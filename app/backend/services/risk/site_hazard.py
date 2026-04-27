import math

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point
from shapely.geometry import Polygon

from services.risk.load_processed_data import (
    load_fire_history_data,
    load_fuel_data,
    load_slope_data,
)


def get_fuel_code(fuel_data, fuel_band, point_x: float, point_y: float):
    row, col = fuel_data.index(point_x, point_y)
    if row < 0 or col < 0 or row >= fuel_data.height or col >= fuel_data.width:
        return None
    fuel_code = fuel_band[row, col]

    if fuel_data.nodata is not None and fuel_code == fuel_data.nodata:
        return None

    return int(fuel_code)


def get_slope_deg(slope_data, slope_band, point_x: float, point_y: float):
    row, col = slope_data.index(point_x, point_y)
    if row < 0 or col < 0 or row >= slope_data.height or col >= slope_data.width:
        return None
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
    return int(latest_fire["fih_year1"]), latest_fire["fih_fire_type"]


# get site hazard from a point
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

# draw the new site as a square. 111,320 is the approximate number of meters in 1 degree of latitude.
def build_square_site(
    longitude: float, latitude: float, site_size_m: float
) -> Polygon:
    half_side_m = site_size_m / 2.0

    lat_offset = half_side_m / 111320.0
    lon_offset = half_side_m / (111320.0 * math.cos(math.radians(latitude)))

    return Polygon(
        [
            (longitude - lon_offset, latitude - lat_offset),
            (longitude + lon_offset, latitude - lat_offset),
            (longitude + lon_offset, latitude + lat_offset),
            (longitude - lon_offset, latitude + lat_offset),
            (longitude - lon_offset, latitude - lat_offset),
        ]
    )
