from pathlib import Path

import geopandas as gpd
import rasterio

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

def load_sites_data():
    sites_path = DATA_DIR / "sites.gpkg"
    return gpd.read_file(sites_path)

def load_granite_data():
    granite_path = DATA_DIR / "granite.gpkg"
    return gpd.read_file(granite_path)

def load_fuel_data():
    fuel_path = DATA_DIR / "fuel.tif"
    return rasterio.open(fuel_path)

def load_slope_data():
    slope_path = DATA_DIR / "slope.tif"
    return rasterio.open(slope_path)

def load_fire_history_data():
    fire_history_path = DATA_DIR / "fire_history.gpkg"
    return gpd.read_file(fire_history_path)

