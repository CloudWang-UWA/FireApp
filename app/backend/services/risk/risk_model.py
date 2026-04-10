from .scoring import get_fuel_score
from .scoring import get_hazard_level
from .scoring import get_slope_score
from .scoring import get_fire_history_score

def calculate_hazard(fuel_code, slope_deg, fire_year, fire_type):
    fuel_score = get_fuel_score(fuel_code)
    slope_score = get_slope_score(slope_deg)
    fire_history_score = get_fire_history_score(fire_year, fire_type)

    if fuel_score is None or slope_score is None:
        return {
            "fuel_score": fuel_score,
            "slope_score": slope_score,
            "fire_history_score": fire_history_score,
            "hazard_score": None,
            "hazard_level": None,
        }

    hazard_score = int(fuel_score) + int(slope_score) + int(fire_history_score)
    hazard_level = get_hazard_level(hazard_score)

    return {
        "fuel_score": fuel_score,
        "slope_score": slope_score,
        "fire_history_score": fire_history_score,
        "hazard_score": hazard_score,
        "hazard_level": hazard_level
    }
