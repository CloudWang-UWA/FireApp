from .risk_model import calculate_hazard

def get_risk_status() -> dict:
    return {
        "ready": False,
        "message": "This module will calculate fire risk results and provide overview and detail outputs.",
    }


def get_hazard_result(fuel_code, slope_deg, fire_year, fire_type):
    return calculate_hazard(fuel_code, slope_deg, fire_year, fire_type)
