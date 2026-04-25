# Data Collection And Processing Notes

This document records the data collection decisions behind the Albany/Mount Barker data processing module.

## Purpose

The data processing module prepares spatial inputs for a separate risk module. It is responsible for:

- selecting the canonical raw sources
- clipping and cleaning vector layers
- preparing analysis-ready vector and raster outputs
- summarising raster and vector inputs into a processed grid output
- recording source provenance and output contracts

It is not responsible for risk scoring, risk level classification, backend APIs, or frontend map rendering.

## Study Area

The study area comes from the `data_change` reference specification:

- CRS: `EPSG:7844`
- internal bbox order: `(minx, miny, maxx, maxy)`
- bbox: `(117.18, -35.32, 118.58, -34.22)`
- study area id: `albany_mount_barker_regional_envelope_v1`

The processing CRS is `EPSG:7850`. GeoJSON and overlay metadata are exported in `EPSG:4326`.

## Canonical Raw Sources

The default processing workflow uses local raw source packages under `app/data/raw`.

### Heritage

Required packages:

- `Aboriginal_Cultural_Heritage_Register_DPLH_099_WA_GDA2020_Public_Secure_Geopackage.zip`
- `Aboriginal_Cultural_Heritage_Lodged_DPLH_100_WA_GDA2020_Public_Secure_Geopackage.zip`
- `Aboriginal_Cultural_Heritage_Survey_Areas_DPLH_080_WA_GDA2020_Public_Secure_Geopackage.zip`
- `Aboriginal_Cultural_Heritage_Historic_DPLH_098_WA_GDA2020_Public_Secure_Geopackage.zip`
- `Heritage_Council_State_Register_DPLH_006_WA_GDA2020_Public_Secure_Geopackage.zip`

Public sites output includes registered, lodged, and council records only. Survey and historic records are retained as internal processing context for the processed grid output.

Expected public site counts:

- registered: `74`
- lodged: `118`
- council: `104`
- total: `296`

### Geology

Required package:

- `app/data/raw/new/MAPSHEET_250k_MountBarker_Albany_SI5011_SI5015_GDA2020_SHP.zip`

The processing module reads:

- `geology_surface_si5011.shp`

Granite output keeps only these codes:

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

Expected granite count: `295`.

### Fire History

Required package:

- `app/data/raw/DBCA_Fire_History/DBCA_Fire_History_DBCA_060_WA_GDA2020_Public_Geopackage.zip`

The fire history workflow clips in the source CRS before geometry cleaning. This preserves the expected `1209` records in the expanded study area.

### Fuel

Required raster:

- `app/data/raw/Bushfire_Fuel_Classification_fuel_types_map/Bushfire fuel classification fuel types map release 2.tif`

Rules:

- CSIRO fuel is the authoritative default source.
- Raster reprojection uses nearest-neighbour resampling.
- Raster nodata remains `0`.
- Grid-level missing fuel remains `null` in `fuel_mode_code`.
- `fuel_source_dataset` is only `csiro_primary` or `none`.
- DEA landcover-derived fallback fuel is not consumed by the default processing path.

### DEM And Slope

Required package:

- `app/data/raw/new/1_Second_DEM_Smoothed_1300343.zip`

The processing module reads:

- `1_Second_DEM_Smoothed.tif`

Slope is calculated from the full DEM before clipping to the study area.

## Reference Oracle

`data_change.zip` is an internal regression oracle that can be placed at the repository root for local validation. It is not committed to Git. It contains reference outputs for:

- sites
- granite
- fire history
- fuel
- slope

It is not a canonical raw source. The default runtime must reproduce the reference outputs from `app/data/raw` and `app/data/raw/new`.

## Generated Outputs

The processing module writes:

- `app/data/derived/manifest.json`
- `app/data/derived/grid_output.gpkg`
- `app/data/derived/analysis_ready/interface_manifest.json`
- `app/data/derived/analysis_ready/sites.gpkg`
- `app/data/derived/analysis_ready/sites.geojson`
- `app/data/derived/analysis_ready/granite.gpkg`
- `app/data/derived/analysis_ready/granite.geojson`
- `app/data/derived/analysis_ready/fire_history.gpkg`
- `app/data/derived/analysis_ready/fire_history.geojson`
- `app/data/derived/analysis_ready/fuel.tif`
- `app/data/derived/analysis_ready/fuel.png`
- `app/data/derived/analysis_ready/fuel.json`
- `app/data/derived/analysis_ready/slope.tif`
- `app/data/derived/analysis_ready/slope.png`
- `app/data/derived/analysis_ready/slope.json`

The module does not write:

- `metadata.json`
- `risk_grid.geojson`
- `risk_grid_internal.geojson`
- `risk_grid_export.csv`

## Grid Output

The grid-level processing output is:

```text
app/data/derived/grid_output.gpkg
```

It contains processed attributes for QA and downstream reference, including:

- grid cell id and geometry
- heritage context flags and counts
- granite presence
- fuel mode, source, sample counts, and support status
- slope mean, p90, valid-pixel counts, and support status
- fire history counts and recent-fire context
- centroid coordinates
- QA flags

It intentionally excludes:

- `risk_score`
- `risk_level`
- `hazard_score`
- `base_fuel_score`
- `primary_factor`
- `fuel_band`
- `slope_band`
- `scoring_status`

## Validation Targets

Expected validation targets:

- sites: `296`
- granite: `295`
- fire history: `1209`
- grid output cells: `16120`
- fuel raster CRS: `EPSG:7850`
- fuel raster nodata: `0`
- slope raster CRS: `EPSG:7850`
- slope raster nodata: `-9999.0`

The ETL test suite validates these contracts and compares generated outputs against a local `data_change.zip` when the internal oracle bundle is available.
