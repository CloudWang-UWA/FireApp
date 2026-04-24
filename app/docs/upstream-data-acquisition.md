# Upstream Data Acquisition

The repository includes an optional acquisition CLI for discovering and downloading public support datasets. This tool is useful for documentation, QA, and repeatability, but it does not replace the canonical raw source packages under `app/data/raw`.

Run:

```bash
cd <repo-root>
PYTHONPATH=app/etl .venv/bin/python -m fire_vulnerability_etl.upstream
```

Default output root:

```text
app/etl/.cache/upstream/albany_official_sources
```

## What The Acquisition CLI Does

The CLI can:

- query public WA feature services for selected heritage, hydrography, and geology support layers
- clip public DEA raster assets where anonymous access is available
- write an acquisition manifest for downloaded and derived support files
- build optional open validation packages for local experimentation

The acquired support files are written to `.cache` and are not part of the default processing source-of-truth.

## Canonical Sources Still Required

The default data processing workflow still expects manually provisioned canonical sources under `app/data/raw`, including:

- DPLH heritage source packages
- DBCA fire history
- CSIRO bushfire fuel classification
- the new 1-second smoothed DEM package
- the new GSWA 250k Mount Barker/Albany geology package

Several of these sources require manual download, account-mediated access, or local file transfer. They are intentionally not fetched on demand by the processing pipeline.

## Access Constraints

Known constraints:

- DBCA fire history bulk downloads may require SLIP access.
- Some terrain products require manual ordering or account-mediated access.
- Some public feature services return GeoJSON with axis-order quirks that must be normalized before use.

## Relationship To Default Processing

The acquisition CLI is separate from default processing:

- default processing reads `app/data/raw`
- acquisition writes `.cache/upstream`
- analysis-ready outputs are written to `app/data/derived/analysis_ready`
- pre-risk handoff data is written to `app/data/derived/risk_input_grid.gpkg`

DEA landcover-derived support fuel is not consumed by the default processing path. The authoritative default fuel source is the CSIRO bushfire fuel classification raster.
