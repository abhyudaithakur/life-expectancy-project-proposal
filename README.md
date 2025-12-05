# Life Expectancy — Similarity Network

**Live viz:** https://vizhub.com/abhyudaithakur/15f5084b0d484251b93d37c1177abd1a

## What it shows
- **Nodes:** countries (size = end-year life expectancy; **color = region**).
- **Edges:** connect the **Top-K** most correlated life-expectancy trajectories (Pearson *r*) within the selected year window.
- This reveals regional clusters, bridges between regions, and outliers.

## How to use
1. Pick a **Start** and **End** year to define the window for correlation.
2. Tune **Top-K** (neighbors per node) and **Min-r** (correlation threshold).
3. Use the **legend** (hover to highlight, click to multi-select; **Clear** to reset).
4. **Search** a country, **drag** nodes to declutter, **double-click** a node to unpin.

## This week’s finishing touches
- rAF-throttled force tick (smoother interaction).
- Safer link updates (`d.source.x/y`, `d.target.x/y`).
- Defaults for a clean first view: **2005–2023**, **Top-K=5**, **Min-r=0.65**.
- Tooltip now shows end-year value and **Δ** since start; legend has Clear.

## Data
- UN WPP via Our World in Data (`Entity, Code(ISO3), Year, life_expectancy`).
- Regions joined from `world-countries@4` (GeoJSON).

## Known limits
- Correlation depends on the window; sparse small-island series may drop out.

## Next ideas
- Persist node positions (URL/localStorage), rank callouts (top risers/decliners), export PNG/SVG.
