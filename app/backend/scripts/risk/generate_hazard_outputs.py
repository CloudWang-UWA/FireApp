from pathlib import Path
import sys

import geopandas as gpd
from shapely.geometry import Polygon

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from services.risk.load_processed_data import load_fuel_data
from services.risk.load_processed_data import load_slope_data
from services.risk.load_processed_data import load_fire_history_data
from services.risk.risk_service import get_hazard_result
from services.risk.site_hazard import get_fire_history
from services.risk.site_hazard import get_fuel_code
from services.risk.site_hazard import get_slope_deg

# study area 117.815611, 118.023861, -35.129972, -35.050944
def main() -> None:
    fuel_data = load_fuel_data()
    slope_data = load_slope_data()
    fire_history_data = load_fire_history_data()

    fuel_band = fuel_data.read(1)
    slope_band = slope_data.read(1)

    features = []

    for fuel_row in range(fuel_data.height):
        for fuel_col in range (fuel_data.width):
            # get coordinates of the center point
            center_x, center_y = fuel_data.transform * (fuel_col + 0.5, fuel_row + 0.5)

            fuel_code = get_fuel_code(fuel_data, fuel_band, center_x, center_y)
            slope_deg = get_slope_deg(slope_data, slope_band, center_x, center_y)
            fire_year, fire_type = get_fire_history(
                fire_history_data,
                center_x,
                center_y,
            )
            
            # calculate result
            result = get_hazard_result(fuel_code, slope_deg, fire_year, fire_type)

            # generate final geojson file
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
    geojson_output_path = output_dir / "hazard_overview.geojson"

    hazard_layer.to_file(gpkg_output_path, driver="GPKG")
    hazard_layer.to_file(geojson_output_path, driver="GeoJSON")

    print(f"Saved to: {gpkg_output_path}")
    print(f"Saved to: {geojson_output_path}")


if __name__ == "__main__":
    main()
