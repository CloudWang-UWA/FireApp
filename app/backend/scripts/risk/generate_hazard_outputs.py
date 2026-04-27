from pathlib import Path
import sys

import geopandas as gpd
import numpy as np
from rasterio.features import rasterize
from shapely.geometry import Polygon

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from services.risk.load_processed_data import load_fuel_data
from services.risk.load_processed_data import load_slope_data
from services.risk.load_processed_data import load_fire_history_data
from services.risk.config import FIRE_TYPE_CODES
from services.risk.config import HAZARD_PROGRESS_STEP
from services.risk.metadata import require_files
from services.risk.metadata import update_risk_manifest
from services.risk.risk_service import get_hazard_result
from services.risk.site_hazard import get_fuel_code
from services.risk.site_hazard import get_slope_deg


# Match fire history to the fuel grid once so the main loop can read it back
# like the raster inputs instead of running polygon checks cell by cell.
def build_fire_history_grids(fuel_data, fire_history_data):
    if fire_history_data.crs != fuel_data.crs:
        fire_history_data = fire_history_data.to_crs(fuel_data.crs)

    fire_year_grid = np.zeros((fuel_data.height, fuel_data.width), dtype=np.int32)
    fire_type_grid = np.zeros((fuel_data.height, fuel_data.width), dtype=np.int16)

    # Keep a compact code in the grid, then convert back to the original
    # fire type label when the hazard result is assembled.
    # Sort by year so later fires replace earlier ones in overlapping cells.
    sorted_fire_history = fire_history_data.sort_values("fih_year1")

    for _, fire in sorted_fire_history.iterrows():
        fire_year = fire.get("fih_year1")
        fire_type = fire.get("fih_fire_type")

        if fire_year is None or fire_type is None:
            continue

        geometry = fire.geometry
        if geometry is None or geometry.is_empty:
            continue

        year_value = int(fire_year)
        type_value = FIRE_TYPE_CODES.get(str(fire_type))

        if type_value is None:
            continue

        # Turn this fire polygon into a mask on the fuel grid.
        fire_mask = rasterize(
            [(geometry, 1)],
            out_shape=(fuel_data.height, fuel_data.width),
            transform=fuel_data.transform,
            fill=0,
            dtype=np.uint8,
        )

        matched_cells = fire_mask == 1
        if not matched_cells.any():
            continue

        fire_year_grid[matched_cells] = year_value
        fire_type_grid[matched_cells] = type_value

    fire_type_lookup = {value: key for key, value in FIRE_TYPE_CODES.items()}
    return fire_year_grid, fire_type_grid, fire_type_lookup


def main() -> None:
    require_files(
        [
            BACKEND_DIR / "data" / "fuel.tif",
            BACKEND_DIR / "data" / "slope.tif",
            BACKEND_DIR / "data" / "fire_history.gpkg",
        ]
    )
    fuel_data = load_fuel_data()
    slope_data = load_slope_data()
    fire_history_data = load_fire_history_data()

    fuel_band = fuel_data.read(1)
    slope_band = slope_data.read(1)
    fire_year_grid, fire_type_grid, fire_type_lookup = build_fire_history_grids(
        fuel_data,
        fire_history_data,
    )

    features = []
    total_cells = fuel_data.height * fuel_data.width
    processed_cells = 0
    progress_step = HAZARD_PROGRESS_STEP

    for fuel_row in range(fuel_data.height):
        for fuel_col in range(fuel_data.width):
            processed_cells += 1
            if processed_cells % progress_step == 0:
                progress_percent = (processed_cells / total_cells) * 100
                print(
                    f"Progress: {processed_cells}/{total_cells} cells "
                    f"({progress_percent:.1f}%)"
                )

            center_x, center_y = fuel_data.transform * (fuel_col + 0.5, fuel_row + 0.5)

            fuel_code = get_fuel_code(fuel_data, fuel_band, center_x, center_y)
            slope_deg = get_slope_deg(slope_data, slope_band, center_x, center_y)
            # Fire history is already on the fuel grid, so this stays as a
            # cheap array lookup inside the main loop.
            fire_year = int(fire_year_grid[fuel_row, fuel_col])
            fire_type_code = int(fire_type_grid[fuel_row, fuel_col])
            fire_type = fire_type_lookup.get(fire_type_code)
            if fire_year == 0:
                fire_year = None

            result = get_hazard_result(fuel_code, slope_deg, fire_year, fire_type)

            left, top = fuel_data.transform * (fuel_col, fuel_row)
            right, bottom = fuel_data.transform * (fuel_col + 1, fuel_row + 1)

            features.append(
                {
                    "fuel_code": fuel_code,
                    "slope_deg": None if slope_deg is None else float(slope_deg),
                    "fire_year": None if fire_year is None else int(fire_year),
                    "fire_type": fire_type,
                    "hazard_score": result["hazard_score"],
                    "hazard_level": None if result["hazard_level"] is None else int(result["hazard_level"]),
                    "geometry": Polygon(
                        [
                            (left, top),
                            (right, top),
                            (right, bottom),
                            (left, bottom),
                            (left, top),
                        ]
                    ),
                }
            )

    output_dir = BACKEND_DIR / "data" / "risk_outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    hazard_layer = gpd.GeoDataFrame(features, crs=fuel_data.crs)
    gpkg_output_path = output_dir / "hazard_overview.gpkg"

    hazard_layer.to_file(gpkg_output_path, driver="GPKG")
    update_risk_manifest(
        output_name="hazard_overview",
        stage="hazard",
        generated_files=[gpkg_output_path],
        source_files=[
            BACKEND_DIR / "data" / "fuel.tif",
            BACKEND_DIR / "data" / "slope.tif",
            BACKEND_DIR / "data" / "fire_history.gpkg",
        ],
        notes=[
            "Hazard overview is generated from fuel, slope, and fire history inputs."
        ],
    )

    print(f"Saved to: {gpkg_output_path}")


if __name__ == "__main__":
    main()
