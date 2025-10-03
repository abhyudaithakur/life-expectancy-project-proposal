# Global Longevity Explorer — Project Proposal (First Draft)

## One-sentence pitch
An interactive explorer of **life expectancy by country (2000–present)** that lets you rank, compare, and track changes over time, with context like the global average.

---

## Data Sources

- **Life Expectancy (UN World Population Prospects via Our World in Data)**  
  About/notes: https://ourworldindata.org/life-expectancy  
  Data (UNWPP series, used in this project): https://ourworldindata.org/grapher/life-expectancy-unwpp  
  **Columns used:** `Entity`, `Year`, `life_expectancy` (subset 2000–present)

- **(Exploratory / future)** **Mauna Loa CO₂ (NOAA GML)** — long-term monthly CO₂ at Mauna Loa  
  Dataset hub: https://gml.noaa.gov/ccgg/trends/data.html

- **(Exploratory / future)** **USGS Earthquakes GeoJSON feeds** — recent quakes with mag/depth  
  Docs: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php

---

## Questions & User Tasks

- **Q1 — Ranking (single year):** Who are the top/bottom countries in a given year?  
  **Task:** Choose year → read a **ranked bar chart**; search for a country; compare to **global average**.

- **Q2 — Change (before/after):** Which countries improved the most/least since 2000?  
  **Task:** Select two years → read a **slopegraph** with Δ labels.

- **Q3 — Trends (time series):** How did selected countries evolve over time?  
  **Task:** Multi-select countries → view **lines over time** with latest value labels.

*(Stretch)* Compare regions/income groups; annotate events (pandemics, conflicts).

---

## Early Design & Supporting Work

- **Sketch directions (concepts explored):** Ranked dot/bar for a single year (with Year slider); slopegraph (2000→2023); small-multiples variants for comparisons.  
- **Dataset explorations on VizHub (supporting work):**  
  - Life Expectancy (OWID/UNWPP) — data prep/exploration:  
    https://vizhub.com/abhyudaithakur/47a368e669ca4722958ffd7c898e5d2a  
  - Mauna Loa CO₂ (NOAA GML) — data preview (for future comparison tasks):  
    https://vizhub.com/abhyudaithakur/454cd31d44d84dcebf73c998b0d8aa24  
  - USGS Earthquakes (GeoJSON) — data preview (for future design ideas):  
    https://vizhub.com/abhyudaithakur/05a5a94131a64b42b3b41720fe172e47

---

## Prototypes (links)

- **Life Expectancy — Ranked Bars (React + D3)**  
  Year slider, **sort toggle**, **inline highlight**, **global average** line  
  https://vizhub.com/abhyudaithakur/573d1f71878c489eb3fe75b1bae8eac3

---

## Technical Notes

- **Stack:** React + D3 (developed on VizHub).  
- **Parsing:** robust CSV/TSV loader; detects delimiter; uses `Entity`, `Year`, `life_expectancy`.  
- **Design choices:** large readable ticks; color not the only channel (value labels & avg rule); search highlights without hiding context (optional filter mode).

---

## Risks / Open Questions

- Missing years for some countries; crowded labeling for very large Top-N; mobile layout & touch targets.

---

## Roadmap (rough)

- **M1:** Polish ranked bars (legend/notes, mobile layout, performance tidy-ups).  
- **M2:** Implement slopegraph (two selectable years) and a compare mode for 2–5 countries.  
- **M3:** Narrative annotations + final README write-up; prepare final interactive for submission.

