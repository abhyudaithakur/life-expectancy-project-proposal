// Use globals: React, d3
const { useEffect, useMemo, useState, useRef } = React;

/*
Life Expectancy — Similarity Network (2000–2023)
- Nodes: countries (size = end-year life expectancy, color = region)
- Edges: top-K most correlated (Pearson r) time-series neighbors within [startYear, endYear]
- Interactions: drag, double-click to unpin; search; region legend (hover highlight, click filter, Clear); Reset
*/

function App() {
  const width = 1100;
  const height = 680;
  const margin = {
    top: 60,
    right: 20,
    bottom: 40,
    left: 20,
  };

  // ---------- state ----------
  const [rows, setRows] = useState(null); // parsed csv rows
  const [regions, setRegions] = useState(null); // Map ISO3 -> region
  const [debug, setDebug] = useState('');

  // friendly defaults for "polish"
  const [startYear, setStartYear] = useState(2005);
  const [endYear, setEndYear] = useState(2023);
  const [topK, setTopK] = useState(5);
  const [minR, setMinR] = useState(0.65);
  const [regionFilter, setRegionFilter] = useState('All');
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [activeRegions, setActiveRegions] = useState(null); // Set of selected regions or null=all
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState(new Set()); // ISO3 codes that are fixed

  const svgRef = useRef(null);

  // keep sliders valid: start < end
  useEffect(() => {
    if (startYear >= endYear) setStartYear(endYear - 1);
  }, [startYear, endYear]);

  // ---------- data load ----------
  // life expectancy CSV
  useEffect(() => {
    (async () => {
      try {
        const text = await d3.text('data.csv');
        const header = text.split(/\r?\n/)[0] || '';
        const count = (re) =>
          (header.match(re) || []).length;
        const delim =
          count(/;/g) > count(/,/g) &&
          count(/;/g) > count(/\t/g)
            ? ';'
            : count(/\t/g) > count(/,/g)
              ? '\t'
              : ',';

        const table = d3.dsvFormat(delim).parse(text);

        const norm = (s) =>
          String(s || '')
            .replace(/^\uFEFF/, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
        const cols = table.columns.map((h) =>
          h.replace(/^\uFEFF/, ''),
        );
        const ncols = cols.map(norm);

        const entityKey =
          cols[ncols.indexOf('entity')] ??
          cols[ncols.indexOf('country')] ??
          cols[ncols.indexOf('location')] ??
          null;
        const codeKey =
          cols[ncols.indexOf('code')] ??
          cols[ncols.indexOf('iso3')] ??
          cols[ncols.indexOf('iso')] ??
          null;
        const yearKey = cols[ncols.indexOf('year')] ?? null;

        let lifeKey =
          cols[ncols.indexOf('lifeexpectancy')] ??
          cols[ncols.indexOf('life_expectancy')] ??
          cols[ncols.indexOf('lifeexpectancyyears')] ??
          null;

        if (!lifeKey) {
          for (let i = 0; i < cols.length; i++) {
            const nk = ncols[i];
            if (
              nk.includes('life') &&
              nk.includes('expect')
            ) {
              lifeKey = cols[i];
              break;
            }
          }
        }

        const out = [];
        for (const r of table) {
          const name = entityKey ? r[entityKey] : undefined;
          let code = codeKey
            ? String(r[codeKey]).trim().toUpperCase()
            : '';
          if (!/^[A-Z]{3}$/.test(code)) continue; // keep real ISO3 only
          const y = yearKey
            ? +String(r[yearKey]).trim()
            : NaN;
          const v = lifeKey
            ? +String(r[lifeKey]).replace(/,/g, '').trim()
            : NaN;
          if (
            name &&
            Number.isFinite(y) &&
            Number.isFinite(v)
          )
            out.push({ name, code, year: y, value: v });
        }

        setRows(out);
        setDebug(
          (d) =>
            `${d ? d + ' | ' : ''}parsed rows=${out.length}`,
        );
      } catch (e) {
        setRows([]);
        setDebug('csv error: ' + (e?.message || e));
      }
    })();
  }, []);

  // iso3 -> region (continent) via world-countries dataset
  useEffect(() => {
    (async () => {
      try {
        const geo = await fetch(
          'https://cdn.jsdelivr.net/npm/world-countries@4/countries.geojson',
        ).then((r) => r.json());
        const map = new Map();
        for (const f of geo.features) {
          const p = f.properties || {};
          const iso3 = (
            p.cca3 ||
            p.CCA3 ||
            p.ISO_A3 ||
            p.iso_a3 ||
            p.ISO3 ||
            p.iso3 ||
            ''
          )
            .toString()
            .toUpperCase();
          const region =
            p.region ||
            p.continent ||
            p.subregion ||
            'Other';
          if (/^[A-Z]{3}$/.test(iso3))
            map.set(iso3, region);
        }
        setRegions(map);
        setDebug((d) => `${d} | region_map=${map.size}`);
      } catch (e) {
        setRegions(new Map());
        setDebug(
          (d) =>
            `${d} | region load error: ${e?.message || e}`,
        );
      }
    })();
  }, []);

  // ---------- derived structures ----------
  const yearsAll = useMemo(() => {
    if (!rows) return [];
    return Array.from(
      new Set(rows.map((d) => d.year)),
    ).sort((a, b) => a - b);
  }, [rows]);

  const seriesByCode = useMemo(() => {
    if (!rows) return null;
    const m = new Map();
    for (const r of rows) {
      let o = m.get(r.code);
      if (!o) {
        o = {
          name: r.name,
          code: r.code,
          series: new Map(),
        };
        m.set(r.code, o);
      }
      o.series.set(r.year, r.value);
    }
    return m;
  }, [rows]);

  // helper: Pearson r
  function pearson(x, y) {
    const n = x.length;
    if (n < 3) return NaN;
    const mx = d3.mean(x),
      my = d3.mean(y);
    let num = 0,
      dx = 0,
      dy = 0;
    for (let i = 0; i < n; i++) {
      const a = x[i] - mx,
        b = y[i] - my;
      num += a * b;
      dx += a * a;
      dy += b * b;
    }
    const den = Math.sqrt(dx * dy);
    return den ? num / den : NaN;
  }

  // build graph (nodes/links) based on settings
  const graph = useMemo(() => {
    if (!seriesByCode || !regions)
      return { nodes: [], links: [] };

    const sY = Math.max(
      startYear,
      yearsAll[0] ?? startYear,
    );
    const eY = Math.min(
      endYear,
      yearsAll[yearsAll.length - 1] ?? endYear,
    );

    // nodes with end-year value
    const nodes = [];
    for (const [code, obj] of seriesByCode) {
      const endVal = obj.series.get(eY);
      if (!Number.isFinite(endVal)) continue;
      const region = regions.get(code) || 'Other';
      nodes.push({
        id: code,
        name: obj.name,
        region,
        endVal,
      });
    }

    const yearsWindow = [];
    for (let y = sY; y <= eY; y++) yearsWindow.push(y);

    const valuesByCode = new Map();
    for (const n of nodes) {
      const ser = seriesByCode.get(n.id).series;
      const arr = [];
      let ok = true;
      for (const y of yearsWindow) {
        const v = ser.get(y);
        if (!Number.isFinite(v)) {
          ok = false;
          break;
        }
        arr.push(v);
      }
      if (ok) valuesByCode.set(n.id, arr);
    }

    // compute topK neighbors by r >= minR
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i].id;
      const va = valuesByCode.get(a);
      if (!va) continue;
      const scores = [];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j].id;
        const vb = valuesByCode.get(b);
        if (!vb) continue;
        const r = pearson(va, vb);
        if (Number.isFinite(r) && r >= minR)
          scores.push({ j, r });
      }
      scores.sort((x, y) => y.r - x.r);
      for (const sc of scores.slice(
        0,
        Math.max(1, +topK || 1),
      )) {
        links.push({ source: i, target: sc.j, r: sc.r });
      }
    }

    return { nodes, links, sY, eY };
  }, [
    seriesByCode,
    regions,
    startYear,
    endYear,
    topK,
    minR,
    yearsAll,
  ]);

  // color + size scales
  const regionList = useMemo(() => {
    const set = new Set(graph.nodes.map((n) => n.region));
    return Array.from(set).sort();
  }, [graph.nodes]);

  const color = useMemo(() => {
    const palette = d3.schemeTableau10.concat(
      d3.schemeSet2 || [],
    );
    return d3.scaleOrdinal(palette).domain(regionList);
  }, [regionList]);

  const size = useMemo(() => {
    const v = graph.nodes.map((n) => n.endVal);
    const extent = d3.extent(v.length ? v : [60, 85]);
    return d3.scaleLinear().domain(extent).range([4, 14]);
  }, [graph.nodes]);

  // visibility + alpha
  function nodeVisible(n) {
    if (regionFilter !== 'All' && n.region !== regionFilter)
      return false;
    if (activeRegions && !activeRegions.has(n.region))
      return false;
    return true;
  }
  function nodeAlpha(n) {
    const q = query.trim().toLowerCase();
    let a = 1;
    if (hoveredRegion && n.region !== hoveredRegion)
      a *= 0.2;
    if (
      q &&
      !n.name.toLowerCase().includes(q) &&
      !n.id.toLowerCase().includes(q)
    )
      a *= 0.25;
    return a;
  }

  // ---------- simulation + rendering ----------
  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Title & subtitles
    svg
      .append('text')
      .attr('x', margin.left)
      .attr('y', 24)
      .attr('font-weight', 700)
      .text(
        'Life Expectancy — Similarity Network (2000–2023)',
      );

    svg
      .append('text')
      .attr('x', margin.left)
      .attr('y', 42)
      .attr('font-size', 12)
      .attr('fill', '#555')
      .text(
        'Nodes are countries (size = end-year life expectancy, color = region). Edges connect countries with correlated trajectories.',
      );

    svg
      .append('text')
      .attr('x', margin.left)
      .attr('y', 58)
      .attr('font-size', 11)
      .attr('fill', '#777')
      .text(
        'Drag to rearrange; double-click to unpin. Hover legend to highlight; click to filter; Reset to restore.',
      );

    const g = svg
      .append('g')
      .attr('transform', `translate(0, ${margin.top})`);

    // Links
    const link = g
      .append('g')
      .attr('stroke', '#bbb')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr(
        'stroke-width',
        (d) => 0.6 + Math.max(0, (d.r - 0.6) * 2),
      );

    // Nodes
    const node = g
      .append('g')
      .selectAll('circle')
      .data(graph.nodes)
      .join('circle')
      .attr('r', (d) => size(d.endVal))
      .attr('fill', (d) => color(d.region))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Tooltips
    const tip = g
      .append('g')
      .style('pointer-events', 'none')
      .style('display', 'none');
    tip
      .append('rect')
      .attr('x', -6)
      .attr('y', -18)
      .attr('width', 240)
      .attr('height', 38)
      .attr('fill', '#fff')
      .attr('stroke', '#bbb');
    const tipText1 = tip
      .append('text')
      .attr('x', 4)
      .attr('y', 0)
      .attr('font-size', 12);
    const tipText2 = tip
      .append('text')
      .attr('x', 4)
      .attr('y', 14)
      .attr('font-size', 11)
      .attr('fill', '#555');

    node
      .on('mouseenter', function (evt, d) {
        const leStart =
          window.seriesCache?.get(d.id)?.get(graph.sY) ??
          seriesByCode.get(d.id).series.get(graph.sY);
        const leEnd = d.endVal;
        const delta =
          Number.isFinite(leStart) && Number.isFinite(leEnd)
            ? (leEnd - leStart).toFixed(1)
            : '—';
        tip
          .style('display', null)
          .attr(
            'transform',
            `translate(${d.x + 14}, ${d.y + 14})`,
          );
        tipText1.text(
          `${d.name} — ${graph.eY}: ${leEnd.toFixed(1)} years`,
        );
        tipText2.text(
          `Δ since ${graph.sY}: ${delta} • Region: ${d.region}`,
        );
      })
      .on('mousemove', function (evt, d) {
        tip.attr(
          'transform',
          `translate(${d.x + 14}, ${d.y + 14})`,
        );
      })
      .on('mouseleave', function () {
        tip.style('display', 'none');
      });

    // Drag + pinning
    node.call(
      d3
        .drag()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
        }),
    );
    node.on('dblclick', (event, d) => {
      d.fx = null;
      d.fy = null;
      const next = new Set(pinned);
      next.delete(d.id);
      setPinned(next);
    });

    // Simulation
    const sim = d3
      .forceSimulation(graph.nodes)
      .force(
        'link',
        d3
          .forceLink(graph.links)
          .distance(40)
          .strength(0.7),
      )
      .force('charge', d3.forceManyBody().strength(-60))
      .force(
        'center',
        d3.forceCenter(
          (width - margin.left - margin.right) / 2,
          (height - margin.top - margin.bottom) / 2,
        ),
      );

    // rAF throttle to reduce jank
    let raf = null;
    sim.on('tick', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;

        node
          .attr(
            'cx',
            (d) =>
              (d.x = Math.max(
                10,
                Math.min(width - 10, d.x),
              )),
          )
          .attr(
            'cy',
            (d) =>
              (d.y = Math.max(
                10,
                Math.min(height - margin.top - 10, d.y),
              )),
          )
          .attr('opacity', (d) =>
            nodeVisible(d) ? nodeAlpha(d) : 0.05,
          );

        link
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y)
          .attr('opacity', (d) =>
            nodeVisible(d.source) && nodeVisible(d.target)
              ? 0.6
              : 0.05,
          );
      });
    });

    // keep pinned nodes fixed after re-render
    for (const n of graph.nodes) {
      if (pinned.has(n.id)) {
        n.fx = n.x;
        n.fy = n.y;
      }
    }

    return () => {
      sim.stop();
    };
  }, [
    graph,
    color,
    size,
    hoveredRegion,
    activeRegions,
    regionFilter,
    query,
    pinned,
    startYear,
    endYear,
    topK,
    minR,
    seriesByCode,
  ]);

  // ---------- controls ----------
  const controls = React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        marginBottom: 8,
        fontFamily: 'system-ui, sans-serif',
      },
    },
    // Start year
    React.createElement('label', null, 'Start year:'),
    React.createElement('input', {
      type: 'range',
      min: yearsAll[0] ?? 2000,
      max: (yearsAll[yearsAll.length - 1] ?? 2023) - 2,
      step: 1,
      value: startYear,
      onChange: (e) => setStartYear(+e.target.value),
    }),
    React.createElement('span', null, startYear),

    // End year
    React.createElement(
      'label',
      { style: { marginLeft: 10 } },
      'End year:',
    ),
    React.createElement('input', {
      type: 'range',
      min: (yearsAll[0] ?? 2000) + 2,
      max: yearsAll[yearsAll.length - 1] ?? 2023,
      step: 1,
      value: endYear,
      onChange: (e) => setEndYear(+e.target.value),
    }),
    React.createElement('span', null, endYear),

    // Top-K
    React.createElement(
      'label',
      { style: { marginLeft: 10 } },
      'Top-K:',
    ),
    React.createElement('input', {
      type: 'number',
      min: 1,
      max: 10,
      step: 1,
      value: topK,
      onChange: (e) => setTopK(+e.target.value || 1),
      style: { width: 50, padding: '2px 4px' },
      title:
        'Keep top-K most correlated neighbors per node',
    }),

    // Min r
    React.createElement(
      'label',
      { style: { marginLeft: 10 } },
      'Min r:',
    ),
    React.createElement('input', {
      type: 'number',
      min: 0,
      max: 1,
      step: 0.05,
      value: minR,
      onChange: (e) => setMinR(+e.target.value || 0),
      style: { width: 60, padding: '2px 4px' },
    }),

    // Region dropdown
    React.createElement(
      'label',
      { style: { marginLeft: 10 } },
      'Region:',
    ),
    React.createElement(
      'select',
      {
        value: regionFilter,
        onChange: (e) => setRegionFilter(e.target.value),
      },
      React.createElement(
        'option',
        { value: 'All' },
        'All',
      ),
      regionList.map((r) =>
        React.createElement(
          'option',
          { key: r, value: r },
          r,
        ),
      ),
    ),

    // Search
    React.createElement(
      'label',
      { style: { marginLeft: 10 } },
      'Search:',
    ),
    React.createElement('input', {
      placeholder: 'type a country…',
      value: query,
      onChange: (e) => setQuery(e.target.value),
      style: { padding: '4px 6px', width: 180 },
    }),

    // Reset
    React.createElement(
      'button',
      {
        onClick: () => {
          setStartYear(2005);
          setEndYear(2023);
          setTopK(5);
          setMinR(0.65);
          setRegionFilter('All');
          setHoveredRegion(null);
          setActiveRegions(null);
          setQuery('');
          setPinned(new Set());
        },
        style: { marginLeft: 8, padding: '4px 10px' },
        title: 'Restore defaults and unpin nodes',
      },
      'Reset',
    ),
  );

  // interactive legend (hover highlight, click filter, clear)
  const legend = React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        margin: '6px 0 10px 0',
      },
    },
    React.createElement(
      'span',
      { style: { fontSize: 12, color: '#555' } },
      'Legend:',
    ),
    ...regionList.map((r) =>
      React.createElement(
        'div',
        {
          key: r,
          onMouseEnter: () => setHoveredRegion(r),
          onMouseLeave: () => setHoveredRegion(null),
          onClick: () => {
            setActiveRegions((prev) => {
              if (prev && prev.has(r)) {
                const next = new Set(prev);
                next.delete(r);
                return next.size ? next : null;
              } else {
                const next = new Set(prev || []);
                next.add(r);
                return next;
              }
            });
          },
          tabIndex: 0,
          role: 'button',
          title: 'Hover to highlight • Click to filter',
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            userSelect: 'none',
            cursor: 'pointer',
            opacity:
              (hoveredRegion && hoveredRegion !== r) ||
              (activeRegions && !activeRegions.has(r))
                ? 0.35
                : 1,
            border:
              activeRegions && activeRegions.has(r)
                ? '1px solid #333'
                : '1px solid #ccc',
            padding: '2px 6px',
            borderRadius: 4,
          },
        },
        React.createElement('span', {
          style: {
            width: 12,
            height: 12,
            background: color(r),
            display: 'inline-block',
            marginRight: 6,
          },
        }),
        React.createElement(
          'span',
          { style: { fontSize: 12 } },
          r,
        ),
      ),
    ),
    React.createElement(
      'button',
      {
        onClick: () => setActiveRegions(null),
        style: { marginLeft: 8, padding: '2px 8px' },
        title: 'Clear region filter',
      },
      'Clear',
    ),
  );

  return React.createElement(
    'div',
    {
      style: {
        fontFamily: 'system-ui, sans-serif',
        padding: 12,
      },
    },
    controls,
    legend,
    React.createElement('svg', {
      ref: svgRef,
      width,
      height,
      role: 'img',
      'aria-label': `Network of countries grouped by similar life expectancy trajectories from ${startYear} to ${endYear}`,
    }),
    React.createElement(
      'div',
      {
        style: {
          fontSize: 12,
          color: '#666',
          marginTop: 6,
        },
      },
      `years=${yearsAll[0]}–${yearsAll[yearsAll.length - 1]} | countries=${graph.nodes.length} | edges=${graph.links.length}`,
    ),
    React.createElement(
      'div',
      { style: { fontSize: 12, color: '#666' } },
      debug,
    ),
  );
}

window.App = App;
