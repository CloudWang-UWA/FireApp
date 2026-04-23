# Fire Vulnerability App

CITS5206 Capstone Project - Group 21 - Semester 1 2026.

This branch adds the data processing module for the Albany/Mount Barker study area. The module prepares validated spatial inputs for the later risk module, but it does not calculate risk scores, risk levels, backend API responses, or frontend map outputs.

## Repository Structure

- `app/etl/`: data processing package and tests.
- `app/data/raw/`: local canonical raw source store. This directory is ignored by Git.
- `app/data/derived/analysis_ready/`: generated vector and raster outputs for QA and downstream use.
- `app/data/derived/risk_input_grid.gpkg`: pre-risk handoff grid for the risk module.
- `app/docs/`: data processing documentation.
- `data_change.zip`: optional internal regression oracle. This file is not committed.
- `docs/`: project documentation and deliverable materials.

## Data Processing Setup

Create a Python environment and install the ETL package:

```bash
cd /home/god/Fire-Vulnerability-App
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -e app/etl
```

Prepare the canonical raw sources under `app/data/raw/`. The default processing path expects:

- `Aboriginal_Cultural_Heritage_Register_DPLH_099_WA_GDA2020_Public_Secure_Geopackage.zip`
- `Aboriginal_Cultural_Heritage_Lodged_DPLH_100_WA_GDA2020_Public_Secure_Geopackage.zip`
- `Aboriginal_Cultural_Heritage_Survey_Areas_DPLH_080_WA_GDA2020_Public_Secure_Geopackage.zip`
- `Aboriginal_Cultural_Heritage_Historic_DPLH_098_WA_GDA2020_Public_Secure_Geopackage.zip`
- `Heritage_Council_State_Register_DPLH_006_WA_GDA2020_Public_Secure_Geopackage.zip`
- `DBCA_Fire_History/DBCA_Fire_History_DBCA_060_WA_GDA2020_Public_Geopackage.zip`
- `Bushfire_Fuel_Classification_fuel_types_map/Bushfire fuel classification fuel types map release 2.tif`
- `new/1_Second_DEM_Smoothed_1300343.zip`
- `new/MAPSHEET_250k_MountBarker_Albany_SI5011_SI5015_GDA2020_SHP.zip`

The raw source files are not committed because they are vendor source packages and include large raster data. `data_change.zip` is also not committed because it is an internal reference bundle; place it at the repository root only when running optional oracle comparisons.

## Run The Data Processing Pipeline

```bash
cd /home/god/Fire-Vulnerability-App
PYTHONPATH=app/etl .venv/bin/python -m fire_vulnerability_etl.cli
```

The command writes:

- `app/data/derived/manifest.json`
- `app/data/derived/risk_input_grid.gpkg`
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

The default study area is `albany_mount_barker_regional_envelope_v1`. It is defined in `EPSG:7844` as `(minx, miny, maxx, maxy) = (117.18, -35.32, 118.58, -34.22)`.

## Processing Boundary

This module stops before risk scoring. `risk_input_grid.gpkg` contains processed heritage, geology, fuel, slope, and fire history attributes for the risk module. It intentionally excludes:

- `risk_score`
- `risk_level`
- `hazard_score`
- `base_fuel_score`
- `primary_factor`
- `fuel_band`
- `slope_band`
- `scoring_status`

Fuel is authoritative CSIRO-only in the default processing path. Raster missing data remains `0`; grid-level missing fuel remains `null` in `fuel_mode_code` with `fuel_source_dataset = "none"`.

## Verification

Run the ETL tests:

```bash
cd /home/god/Fire-Vulnerability-App
PYTHONPATH=app/etl .venv/bin/pytest app/etl/tests -q
```

The tests validate canonical source selection, output structure, analysis-ready vector and raster contracts, strict fuel missing-data semantics, and optional comparisons against a local `data_change.zip`.

## More Documentation

- `app/docs/data-pipeline.md`
- `app/docs/raw-source-organisation.md`
- `app/docs/upstream-data-acquisition.md`
- `app/docs/testing-and-verification.md`
- `data_collection.md`
