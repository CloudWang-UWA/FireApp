from pathlib import Path

import geopandas as gpd
import rasterio

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
RISK_OUTPUT_DIR = DATA_DIR / "risk_outputs"

def load_sites_data():
    sites_path = DATA_DIR / "sites.gpkg"
    return gpd.read_file(sites_path, layer="sites")

def load_granite_data():
    granite_path = DATA_DIR / "granite.gpkg"
    return gpd.read_file(granite_path, layer="granite")

def load_fuel_data():
    fuel_path = DATA_DIR / "fuel.tif"
    return rasterio.open(fuel_path)

def load_slope_data():
    slope_path = DATA_DIR / "slope.tif"
    return rasterio.open(slope_path)

def load_fire_history_data():
    fire_history_path = DATA_DIR / "fire_history.gpkg"
    return gpd.read_file(fire_history_path, layer="fire_history")

def load_hazard_overview_data():
    hazard_path = RISK_OUTPUT_DIR / "hazard_overview.gpkg"
    return gpd.read_file(hazard_path)

def load_site_vulnerability_data():
    site_vulnerability_path = RISK_OUTPUT_DIR / "site_vulnerability.gpkg"
    return gpd.read_file(site_vulnerability_path)

def load_granite_influence_data():
    granite_influence_path = RISK_OUTPUT_DIR / "granite_influence.gpkg"
    return gpd.read_file(granite_influence_path)

