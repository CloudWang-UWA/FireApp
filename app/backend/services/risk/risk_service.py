from pathlib import Path

import geopandas as gpd
import pandas as pd

from .config import HazardLevel
from .config import IntegratedPriorityLevel
from .config import GraniteScore
from .risk_model import calculate_hazard
from .risk_model import calculate_granite_influence
from .risk_model import calculate_site_vulnerability


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
RISK_OUTPUTS_DIR = DATA_DIR / "risk_outputs"


def _to_native_number(value):
    if value is None or pd.isna(value):
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return value
    try:
        float_value = float(value)
    except (TypeError, ValueError):
        return None

    if float_value.is_integer():
        return int(float_value)
    return float_value


def _to_native_text(value):
    if value is None or pd.isna(value):
        return None
    text = str(value).strip()
    return text or None


def _to_level_name(level_value):
    level_number = _to_native_number(level_value)
    if level_number is None:
        return None

    level_mapping = {
        int(HazardLevel.LOW): "LOW",
        int(HazardLevel.MEDIUM): "MEDIUM",
        int(HazardLevel.HIGH): "HIGH",
        int(IntegratedPriorityLevel.LOW): "LOW",
        int(IntegratedPriorityLevel.MEDIUM): "MEDIUM",
        int(IntegratedPriorityLevel.HIGH): "HIGH",
        int(GraniteScore.NONE): "NONE",
        int(GraniteScore.LOW): "LOW",
        int(GraniteScore.MEDIUM): "MEDIUM",
        int(GraniteScore.HIGH): "HIGH",
    }

    return level_mapping.get(int(level_number))


def _read_recorded_sites_gdf() -> gpd.GeoDataFrame:
    recorded_path = RISK_OUTPUTS_DIR / "recorded_site_priority.geojson"
    sites_gdf = gpd.read_file(recorded_path)
    if sites_gdf.empty:
        raise ValueError("No sites available in recorded_site_priority.geojson")
    return sites_gdf


def _resolve_granite_for_site(site_row) -> tuple[float | int | None, str | None]:
    precaution_path = RISK_OUTPUTS_DIR / "precaution_zone.geojson"
    precaution_gdf = gpd.read_file(precaution_path)

    if precaution_gdf.empty:
        return None, None

    site_gdf = gpd.GeoDataFrame([site_row], geometry="geometry", crs="EPSG:4326")
    if precaution_gdf.crs != site_gdf.crs:
        precaution_gdf = precaution_gdf.to_crs(site_gdf.crs)

    intersected = precaution_gdf[precaution_gdf.geometry.intersects(site_row.geometry)]
    if intersected.empty:
        return None, None

    granite_score = _to_native_number(intersected["granite_score"].max())
    granite_level = _to_level_name(granite_score)
    return granite_score, granite_level


def get_risk_status() -> dict:
    return {
        "ready": False,
        "message": "This module will calculate fire risk results and provide overview and detail outputs.",
    }


def get_hazard_result(fuel_code, slope_deg, fire_year, fire_type):
    return calculate_hazard(fuel_code, slope_deg, fire_year, fire_type)

def get_site_vulnerability_result(place_type, source=None, place_name=None):
    return calculate_site_vulnerability(place_type, source=source, place_name=place_name)


def get_granite_influence_result(on_granite, distance_to_granite):
    return calculate_granite_influence(on_granite, distance_to_granite)


def _site_type_label(source) -> str | None:
    """Human-readable site type from recorded-site `source` (matches map popup labels)."""
    raw = _to_native_text(source)
    if raw is None:
        return None
    s = raw.lower()
    if s == "registered":
        return "ACHIS Registered"
    if s == "lodged":
        return "ACHIS Lodged"
    if s == "council":
        return "Council"
    return raw


def get_site_insights(site_id: str | None = None) -> dict:
    sites_gdf = _read_recorded_sites_gdf()
    if site_id and str(site_id).strip():
        sid = str(site_id).strip()
        col = sites_gdf["ach_identifier"]
        mask = col.astype(str).str.strip() == sid
        matched = sites_gdf[mask]
        if matched.empty:
            raise ValueError(f"No site found for site_id={sid!r}")
        site_gdf = matched.iloc[[0]].copy()
    else:
        site_gdf = sites_gdf.iloc[[0]].copy()

    site_row = site_gdf.iloc[0]

    centroid = site_row.geometry.centroid if site_row.geometry is not None else None
    latitude = None if centroid is None else _to_native_number(centroid.y)
    longitude = None if centroid is None else _to_native_number(centroid.x)

    hazard_score = _to_native_number(site_row.get("hazard_score"))
    hazard_level = _to_level_name(site_row.get("hazard_level"))
    site_priority_score = _to_native_number(site_row.get("recorded_site_priority_score"))
    site_priority_level = _to_level_name(site_row.get("recorded_site_priority_level"))
    granite_score, granite_level = _resolve_granite_for_site(site_row)

    # For now, use site-priority as the overall site risk.
    risk_score = site_priority_score
    risk_level = site_priority_level

    return {
        "site_id": _to_native_text(site_row.get("ach_identifier"))
        or _to_native_text(site_row.get("id")),
        "site_name": _to_native_text(site_row.get("name")),
        "site_type": _site_type_label(site_row.get("source")),
        "ach_identifier": _to_native_text(site_row.get("ach_identifier")),
        "place_type": _to_native_text(site_row.get("place_type")),
        "area_name": _to_native_text(site_row.get("region")),
        "latitude": latitude,
        "longitude": longitude,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "predicted_probability": None,
        "site_vulnerability_score": _to_native_number(site_row.get("site_vulnerability_score")),
        "slope_deg": _to_native_number(site_row.get("slope_deg")),
        "fuel_code": _to_native_number(site_row.get("fuel_code")),
        "fuel_label": _to_native_text(site_row.get("fuel_type")),
        "fire_year": _to_native_number(site_row.get("fire_year")),
        "fire_type": _to_native_text(site_row.get("fire_type")),
        "hazard_score": hazard_score,
        "hazard_level": hazard_level,
        "site_priority_score": site_priority_score,
        "site_priority_level": site_priority_level,
        "granite_score": granite_score,
        "granite_level": granite_level,
    }
