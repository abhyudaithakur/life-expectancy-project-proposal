## Week — Start Polishing

**Live vizzes**
- Map (Choropleth): https://vizhub.com/abhyudaithakur/573d1f71878c489eb3fe75b1bae8eac3
- Similarity Network: https://vizhub.com/abhyudaithakur/15f5084b0d484251b93d37c1177abd1a

**Polish this week**
- Clear titles/subtitles + short “how to use” hints.
- Legend moved off the map; improved label contrast.
- Network defaults tuned (2005–2023, r ≥ 0.65, Top-K = 5) for a readable first view.
- Added **Reset** to restore defaults & unpin.
- Interactive legend (hover highlight, click filter, Clear).
- Tooltips show end-year value and Δ since start.
- Light performance fixes (edge cap, debounced controls).

**Why it matters**
- Map = global context by year. Network = cohort discovery (regions, bridges).
- The first impression is now self-explanatory for non-technical viewers.

**Known limits**
- Correlation depends on the selected time window; small islands have sparse data.

**Next**
- Persist node positions (URL/localStorage), export PNG/SVG, “top outliers” callouts.






# Life Expectancy — Interactive Exploration

**Live vizzes**
- **Similarity Network (current)**: https://vizhub.com/abhyudaithakur/15f5084b0d484251b93d37c1177abd1a  
- **World Map (previous milestone)**: https://vizhub.com/abhyudaithakur/573d1f71878c489eb3fe75b1bae8eac3

## What’s here (week: Interaction + Color)
- Switched from a static choropleth to an **interactive similarity network** (2000–2023).
- **Nodes** = countries (size = latest life expectancy; **color = region** via Tableau10).
- **Edges** connect countries with correlated trajectories (Pearson r).  
- **Interactive legend**: hover to highlight, click to multi-select; **Clear** resets.
- **Controls**: Start/End year, Top-K neighbors, Min-r threshold, Region filter, Search.
- **Direct manipulation**: Drag nodes; **double-click** a node to unpin (toggle).

## How to use
1. Choose a **year window** (Start/End).  
2. Increase **Top-K** or lower **Min-r** to reveal more connections.  
3. Use the **legend** to focus specific regions; combine with **search** for a country.  
4. Drag important nodes to declutter; double-click to unpin if they’re fixed.

## Insights this unlocks
- Clear **regional clusters** and **convergence** after ~2010.  
- **Bridge countries** connecting regions become visible when Min-r is moderate.  
- Outliers (high LE with weakly correlated neighbors) stand out when Top-K is small.

## Data
- UN WPP via Our World in Data (processed CSV with columns: `Entity, Code (ISO3), Year, life_expectancy`).

## Changelog
- **This week**: interactive legend; node hover emphasis; region filter; search; layout polish.
- **Prior**: choropleth with year slider, global average, better parsing of CSV.

## Next steps
- Tooltips with rank and delta since 2000; snapshot/export; save/restore layouts.
