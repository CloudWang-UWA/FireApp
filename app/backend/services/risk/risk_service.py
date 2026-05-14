from .risk_model import calculate_hazard
from .risk_model import calculate_granite_influence
from .risk_model import calculate_site_vulnerability


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
