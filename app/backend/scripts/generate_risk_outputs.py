from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from services.risk.load_processed_data import load_fuel_data
from services.risk.load_processed_data import load_slope_data
from services.risk.load_processed_data import load_fire_history_data
from services.risk.risk_service import get_hazard_result

from shapely.geometry import Point

def main() -> None:
    fuel_data = load_fuel_data()
    slope_data = load_slope_data()
    fire_history_data = load_fire_history_data()

    # study area 117.815611, 118.023861, -35.129972, -35.050944
    sample_x = 117.919736
    sample_y = -35.090458

    fuel_row, fuel_col = fuel_data.index(sample_x, sample_y)
    fuel_code = fuel_data.read(1)[fuel_row, fuel_col]
    
    print("fuel_code: ", fuel_code)

    slope_row, slope_col = slope_data.index(sample_x, sample_y)
    slope_deg = slope_data.read(1)[slope_row, slope_col]

    sample_point = Point(sample_x, sample_y)
    
    print("slope_deg: ", slope_deg)

    sample_point = Point(sample_x, sample_y)
    matched_fire = fire_history_data[fire_history_data.geometry.intersects(sample_point)]

    if matched_fire.empty:
        fire_year = None
    else:
        fire_year = matched_fire["fih_year1"].max()

    print("fire_year: ", fire_year)
    
    result = get_hazard_result(fuel_code, slope_deg, fire_year)

    print (result)

    # backend_dir = Path(__file__).resolve().parents[1]
    # output_path = backend_dir / "data" / "risk_outputs" / "risk_overview.geojson"

if __name__ == "__main__":
    main()
