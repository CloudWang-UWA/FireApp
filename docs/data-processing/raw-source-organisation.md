# Canonical Raw Source Organisation

The canonical raw source store for the data processing module lives under:

```text
app/data/raw
```

This directory is ignored by Git. It should contain original vendor packages and source metadata, not clipped or normalized processing outputs.

## Current Required Layout

The processing module currently expects these paths:

```text
app/data/raw/
  Aboriginal_Cultural_Heritage_Register_DPLH_099_WA_GDA2020_Public_Secure_Geopackage.zip
  Aboriginal_Cultural_Heritage_Lodged_DPLH_100_WA_GDA2020_Public_Secure_Geopackage.zip
  Aboriginal_Cultural_Heritage_Survey_Areas_DPLH_080_WA_GDA2020_Public_Secure_Geopackage.zip
  Aboriginal_Cultural_Heritage_Historic_DPLH_098_WA_GDA2020_Public_Secure_Geopackage.zip
  Heritage_Council_State_Register_DPLH_006_WA_GDA2020_Public_Secure_Geopackage.zip
  DBCA_Fire_History/
    DBCA_Fire_History_DBCA_060_WA_GDA2020_Public_Geopackage.zip
  Bushfire_Fuel_Classification_fuel_types_map/
    Bushfire fuel classification fuel types map release 2.tif
  new/
    1_Second_DEM_Smoothed_1300343.zip
    MAPSHEET_250k_MountBarker_Albany_SI5011_SI5015_GDA2020_SHP.zip
```

The `new/` folder contains the replacement DEM and geology sources for the expanded Albany/Mount Barker study area.

## Source Groups

### Heritage

Required source packages:

- Aboriginal Cultural Heritage Register, DPLH-099
- Aboriginal Cultural Heritage Lodged, DPLH-100
- Aboriginal Cultural Heritage Survey Areas, DPLH-080
- Aboriginal Cultural Heritage Historic, DPLH-098
- Heritage Council State Register, DPLH-006

The public `sites` output includes registered, lodged, and council records only. Survey and historic records are retained as internal context for the processed grid output.

### Geology

Required source package:

- `MAPSHEET_250k_MountBarker_Albany_SI5011_SI5015_GDA2020_SHP.zip`

The processing module reads `geology_surface_si5011.shp` from this package and extracts granite using the contracted code set from the reference specification.

### Terrain

Required source package:

- `1_Second_DEM_Smoothed_1300343.zip`

The processing module reads `1_Second_DEM_Smoothed.tif`, derives slope from the full DEM, and clips the resulting slope raster to the study area.

### Fuel

Required source raster:

- `Bushfire fuel classification fuel types map release 2.tif`

This CSIRO raster is the authoritative fuel source. The default processing path does not use DEA landcover-derived fallback fuel.

### Fire History

Required source package:

- `DBCA_Fire_History_DBCA_060_WA_GDA2020_Public_Geopackage.zip`

Fire history is clipped before geometry cleaning so regional boundary records are preserved.

## Reference Oracle

`data_change.zip` is an internal regression oracle that may be placed at the repository root for local validation. It is not committed to Git, is not a canonical raw source, and should not replace `app/data/raw`.

## Generated Outputs

Generated data belongs under:

```text
app/data/derived
```

The default processing outputs are:

- `manifest.json`
- `grid_output.gpkg`
- `analysis_ready/*`

Risk-scored outputs, frontend map outputs, and backend API artifacts are outside the scope of this module.
