from .scoring import get_fuel_score
from .scoring import get_hazard_level
from .scoring import get_slope_score
from .scoring import get_fire_history_score
from .scoring import get_site_vulnerability_score
from .scoring import get_granite_score
from .scoring import get_recorded_site_priority_score
from .scoring import get_potential_heritage_precaution_score
from .scoring import get_integrated_priority_level

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

def calculate_site_vulnerability(place_type):
    site_vulnerability_score = get_site_vulnerability_score(place_type)

    return {
        "site_vulnerability_score": site_vulnerability_score
    }


def calculate_granite_influence(on_granite, distance_to_granite):
    granite_score = get_granite_score(on_granite, distance_to_granite)

    return {
        "on_granite": on_granite,
        "distance_to_granite": distance_to_granite,
        "granite_score": granite_score,
    }

def calculate_recorded_site_priority(hazard_score, site_vulnerability_score):
    priority_score = get_recorded_site_priority_score(hazard_score, site_vulnerability_score)
    priority_level = get_integrated_priority_level(priority_score)

    return {
        "recorded_site_priority_score": priority_score,
        "recorded_site_priority_level": priority_level,
    }


def calculate_potential_heritage_precaution(hazard_score, granite_score):
    precaution_score = get_potential_heritage_precaution_score(hazard_score, granite_score)
    precaution_level = get_integrated_priority_level(precaution_score)

    return {
        "potential_heritage_precaution_score": precaution_score,
        "potential_heritage_precaution_level": precaution_level,
    }
