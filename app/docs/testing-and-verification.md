# Testing And Verification

This branch verifies the data processing module only. Backend, frontend, and risk scoring tests are outside the scope of this PR.

## Automated Tests

Run:

```bash
cd /home/god/Fire-Vulnerability-App
PYTHONPATH=app/etl .venv/bin/pytest app/etl/tests -q
```

The ETL test suite covers:

- canonical raw source selection
- expanded Albany/Mount Barker study area configuration
- analysis-ready sites, granite, and fire history outputs
- analysis-ready fuel and slope rasters
- strict fuel missing-data semantics
- pre-risk grid handoff schema
- source archive validation for the legacy adapter path
- optional regression comparisons against `data_change.zip`

Raw integration tests skip clearly when the required local raw source files are not available. The `data_change.zip` oracle comparison is skipped only when the oracle bundle is missing; core contract tests still run when raw sources are available.

## Manual Verification Checklist

After running the ETL, confirm that `app/data/derived` contains:

- `manifest.json`
- `risk_input_grid.gpkg`
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

Confirm that the processing output does not contain:

- `metadata.json`
- `risk_grid.geojson`
- `risk_grid_internal.geojson`
- `risk_grid_export.csv`

Confirm the expected counts:

- sites: `296`
- granite: `295`
- fire history: `1209`
- risk input grid cells: `16120`

Confirm fuel semantics:

- `analysis_ready/fuel.tif` has nodata `0`
- missing grid-level fuel has `fuel_mode_code = null`
- `fuel_source_dataset` is only `csiro_primary` or `none`
- no `dea_landcover_fallback` value is present

Confirm the risk handoff boundary:

- `risk_input_grid.gpkg` contains processed input attributes for the risk module
- it does not contain risk scores, risk levels, hazard scores, or scoring status fields

## Known Data Risks

- Raw source packages are large and are not committed to Git. A developer or CI runner must provision them under `app/data/raw` before running raw integration tests.
- The CSIRO fuel raster has coverage gaps in the expanded study area. Missing authoritative fuel is expected in some grid cells and is represented as `null` in the grid summary.
- Slope is derived from a smoothed 1-second DEM. It is suitable for regional screening, but it is not a substitute for high-resolution local terrain survey.
