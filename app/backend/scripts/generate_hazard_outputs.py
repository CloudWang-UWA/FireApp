from pathlib import Path
import sys
import json

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from shapely.geometry import Point

from services.risk.load_processed_data import load_fuel_data
from services.risk.load_processed_data import load_slope_data
from services.risk.load_processed_data import load_fire_history_data
from services.risk.risk_service import get_hazard_result

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
            fuel_code = fuel_band[fuel_row, fuel_col]
            
            # get coordinates of the center point
            center_x, center_y = fuel_data.transform * (fuel_col + 0.5, fuel_row + 0.5)
            center_p = Point(center_x, center_y)
            
            # get slope data of the center point
            slope_row, slope_col = slope_data.index(center_x, center_y)
            slope_deg = slope_band[slope_row, slope_col]

            if slope_deg == slope_data.nodata:
                slope_deg = None

            # get fire history data
            matched_fire_history = fire_history_data[fire_history_data.geometry.intersects(center_p)]

            if matched_fire_history.empty:
                fire_year = None
                fire_type = None
            else:
                latest_fire = matched_fire_history.loc[
                    matched_fire_history["fih_year1"].idxmax()
                ]
                fire_year = latest_fire["fih_year1"]
                fire_type = latest_fire["fih_fire_t"]
            
            # calculate result
            result = get_hazard_result(fuel_code, slope_deg, fire_year, fire_type)

            # generate final geojson file
            left, top = fuel_data.transform * (fuel_col, fuel_row)
            right, bottom = fuel_data.transform * (fuel_col + 1, fuel_row + 1)

            feature = {
                "type": "Feature",
                "properties": {
                    "fuel_code": int(fuel_code),
                    "slope_deg": None if slope_deg is None else float(slope_deg),
                    "fire_year": None if fire_year is None else int(fire_year),
                    "fire_type": fire_type,
                    "hazard_score": result["hazard_score"],
                    "hazard_level": None if result["hazard_level"] is None else int(result["hazard_level"]),
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [left, top],
                        [right, top],
                        [right, bottom],
                        [left, bottom],
                        [left, top],
                    ]]
                },
            }

            features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    output_dir = BACKEND_DIR / "data" / "risk_outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / "hazard_overview.geojson"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    main()
