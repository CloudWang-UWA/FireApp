# Data Processing Pipeline

This document describes the data processing module for the Albany/Mount Barker study area. The module prepares validated spatial inputs for the risk module and stops before risk scoring.

## Runtime Modes

The default runtime is canonical raw mode. It reads vendor source packages directly from `app/data/raw` and writes processing outputs under `app/data/derived`.

The legacy prepared archive mode remains available through `--data-zip` as a compatibility adapter. It is not the default source of truth.

## Study Area And CRS Rules

- Source-of-truth CRS: `EPSG:7844`
- Source-of-truth bbox in code order `(minx, miny, maxx, maxy)`: `[117.18, -35.32, 118.58, -34.22]`
- Analysis CRS: `EPSG:7850`
- Web/export CRS for GeoJSON and overlays: `EPSG:4326`
- Grid size: `1000 m`

The code derives `study_area_bbox(target_crs)` and `study_area_geometry(target_crs)` from the `EPSG:7844` bbox. The previous small Albany bbox is no longer the default analysis extent.

## Canonical Raw Inputs

Default raw mode uses these source groups:

- Aboriginal Cultural Heritage register, lodged, survey area, and historic packages from DPLH.
- Heritage Council State Register from DPLH.
- DBCA fire history package.
- CSIRO bushfire fuel classification raster.
- New 1-second smoothed DEM package under `app/data/raw/new`.
- New GSWA 250k Mount Barker/Albany geology package under `app/data/raw/new`.

`data_change.zip` is an internal regression oracle that can be placed at the repository root for local validation. It is not committed and is not used as a canonical raw input.

## Vector Processing

For polygonal vector inputs:

1. Read the source layer with a source-CRS bbox filter.
2. Clip to the study area in the source CRS.
3. Normalize geometry validity.
4. Preserve polygonal parts from geometry collections.
5. Drop null, empty, and zero-area geometries.
6. Reproject to `EPSG:7850`.
7. Snap geometry precision to `1 m`.

This ordering is important for DBCA fire history. Clipping before cleaning preserves the expected `1209` regional records.

## Heritage Sites

The public analysis-ready sites output includes only:

- registered Aboriginal Cultural Heritage places
- lodged Aboriginal Cultural Heritage places
- Heritage Council State Register places

Survey areas and historic heritage places are retained as internal processing context only. They are not exported in `sites.gpkg` or `sites.geojson`.

Expected output counts:

- `registered`: `74`
- `lodged`: `118`
- `council`: `104`
- total: `296`

## Granite

Granite extraction uses the GSWA 250k Mount Barker/Albany geology package and the contracted code set:

- `Agp`
- `Agv`
- `Ag/Blo`
- `Age/Blo`
- `Agm/Blo`
- `P_gh`
- `P_gm`
- `P_gp`
- `P_ng`
- `P_ns`

The legacy `CODE == "GR"` rule and broad contains-`GR` matching are not used for the public granite output.

Expected output count: `295`.

## Fire History

DBCA fire history is clipped to the study area before geometry cleaning. The processing output preserves one row per source event after clipping and normalization.

Expected output count: `1209`.

Grid-level fire history attributes include:

- intersecting event count
- prescribed burn count
- wildfire count
- latest fire date, year, and type
- years since latest fire
- recent fire cover ratio
- recent fire presence

## Fuel

The authoritative fuel source is the CSIRO bushfire fuel classification raster.

Rules:

- Reproject with nearest-neighbour resampling.
- Preserve categorical class values.
- Write raster missing data as `0`.
- Keep grid-level missing fuel as `null` in `fuel_mode_code`.
- Set `fuel_source_dataset` to either `csiro_primary` or `none`.
- Do not use DEA landcover-derived fallback fuel in the default processing path.

Grid-level fuel attributes include:

- `fuel_mode_code`
- `fuel_valid_ratio`
- `fuel_sample_count`
- `vegetation_cover_pct`
- `fuel_source_dataset`
- `fuel_support_status`

## Slope

Slope is derived from the new 1-second smoothed DEM:

1. Read the full DEM.
2. Replace DEM nodata with `NaN`.
3. Run `np.gradient(...)` across the full DEM.
4. Convert gradient magnitude to slope degrees.
5. Clip the slope raster to the study area.

Grid-level slope attributes include:

- `slope_mean_deg`
- `slope_p90_deg`
- `slope_valid_ratio`
- `slope_valid_pixel_count`
- `slope_edge_pixel_count`
- `slope_support_status`

## Outputs

Canonical raw mode writes:

- `manifest.json`
- `grid_output.gpkg`
- `analysis_ready/interface_manifest.json`
- `analysis_ready/sites.gpkg`
- `analysis_ready/sites.geojson`
- `analysis_ready/granite.gpkg`
- `analysis_ready/granite.geojson`
- `analysis_ready/fire_history.gpkg`
- `analysis_ready/fire_history.geojson`
- `analysis_ready/fuel.tif`
- `analysis_ready/fuel.png`
- `analysis_ready/fuel.json`
- `analysis_ready/slope.tif`
- `analysis_ready/slope.png`
- `analysis_ready/slope.json`

`grid_output.gpkg` is a processed grid-level output for QA and downstream reference. It intentionally excludes score and classification fields such as `risk_score`, `risk_level`, `hazard_score`, `fuel_band`, `slope_band`, and `scoring_status`.

## Overlay JSON Contract

Fuel and slope overlay JSON files use:

- `crs = "EPSG:4326"`
- `bounds = [[south, west], [north, east]]`
- `image`
- `width`
- `height`

## Validation

The generated outputs are validated against `data_change.zip` when that oracle is present:

- sites feature count matches
- fire history feature count matches
- granite feature count and code distribution match
- fuel raster class set and valid-pixel values match
- slope raster CRS, grid, bounds, and numeric tolerances match
