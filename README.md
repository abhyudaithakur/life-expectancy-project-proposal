# Life Expectancy — Interactive Exploration (Final)

**Live demos**  
- **Similarity Network (final):** https://vizhub.com/abhyudaithakur/15f5084b0d484251b93d37c1177abd1a  
- **World Map (milestone):** https://vizhub.com/abhyudaithakur/573d1f71878c489eb3fe75b1bae8eac3  

(./assets/network_thumb.png)](https://vizhub.com/abhyudaithakur/15f5084b0d484251b93d37c1177abd1a)
(./assets/map_thumb.png)](https://vizhub.com/abhyudaithakur/573d1f71878c489eb3fe75b1bae8eac3)



## Abstract
We explore how countries’ life expectancy trajectories correlate over time. The **Similarity Network** reveals regional clusters, bridges, and outliers by connecting countries with similar year-over-year patterns.

## Data
- UN WPP via Our World in Data — processed CSV: `Entity, Code(ISO3), Year, life_expectancy`.
- Regions joined from `world-countries@4` (GeoJSON).

## Methods (short)
- Compute Pearson correlation within a selected year window (defaults **2005–2023**).
- Create edges to **Top-K** most correlated neighbors (default **5**) above **Min-r** (default **0.65**).
- Node size = end-year life expectancy; node color = region.

## Interactions
- Drag nodes; **double-click** to unpin.
- **Legend**: hover to highlight, **click** to filter, **Clear** to reset.
- Controls: Start/End year, Top-K, Min-r, Region, Search, **Reset**.

## Findings (examples)
- Clear regional clustering and increased convergence post-2010.
- Bridge countries appear as connectors at moderate Min-r.
- Outliers surface when Top-K is small.

## Limitations
- Correlation depends on the chosen window; sparse small-island series may drop out.

## What changed since proposal
- Moved from primarily a choropleth to an interaction-heavy **Similarity Network**.
- Added interactive legend, tooltips with Δ, search, and a polished default view.

## How to run locally (optional)
Open `index.html` from `/viz-network-final/` in a local server (or view on VizHub links above).

## Credits
Course: Data Visualization • Author: Abhyudai Singh Thakur
