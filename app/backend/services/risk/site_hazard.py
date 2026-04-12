from shapely.geometry import Point

from services.risk.load_processed_data import (
    load_fire_history_data,
    load_fuel_data,
    load_slope_data,
)


def get_fuel_code(fuel_data, fuel_band, point_x: float, point_y: float):
    row, col = fuel_data.index(point_x, point_y)
    fuel_code = fuel_band[row, col]

    if fuel_data.nodata is not None and fuel_code == fuel_data.nodata:
        return None

    return int(fuel_code)


def get_slope_deg(slope_data, slope_band, point_x: float, point_y: float):
    row, col = slope_data.index(point_x, point_y)
    slope_deg = slope_band[row, col]

    if slope_data.nodata is not None and slope_deg == slope_data.nodata:
        return None

    return float(slope_deg)


def get_fire_history(fire_history_data, point_x: float, point_y: float):
    center_point = Point(point_x, point_y)
    matched_fire_history = fire_history_data[
        fire_history_data.geometry.intersects(center_point)
    ]

    if matched_fire_history.empty:
        return None, None

    latest_fire = matched_fire_history.loc[
        matched_fire_history["fih_year1"].idxmax()
    ]
    return int(latest_fire["fih_year1"]), latest_fire["fih_fire_t"]


def get_site_hazard_info(point_x: float, point_y: float) -> dict:
    fuel_data = load_fuel_data()
    slope_data = load_slope_data()
    fire_history_data = load_fire_history_data()

    fuel_band = fuel_data.read(1)
    slope_band = slope_data.read(1)

    fuel_code = get_fuel_code(fuel_data, fuel_band, point_x, point_y)
    slope_deg = get_slope_deg(slope_data, slope_band, point_x, point_y)
    fire_year, fire_type = get_fire_history(fire_history_data, point_x, point_y)

    return {
        "fuel_code": fuel_code,
        "slope_deg": slope_deg,
        "fire_year": fire_year,
        "fire_type": fire_type,
    }
