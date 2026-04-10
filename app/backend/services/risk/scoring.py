from .lookups import FUEL_SCORE_MAP
from .lookups import SLOPE_SCORE_BANDS
from .lookups import FireHistoryScore
from .lookups import FIRE_HISTORY_SCORE_BANDS
from .lookups import HAZARD_SCORE_BANDS
from datetime import date

def get_fuel_score(fuel_code):
    if (fuel_code is None):
        return None
    fuel_code = int(fuel_code)
    score = FUEL_SCORE_MAP.get(fuel_code)

    if score is None:
        print(f"Invalid fuel code: {fuel_code}")
        return None
    
    return score


def get_slope_score(slope_deg):
    if slope_deg is None:
        return None

    slope_deg = float(slope_deg)

    for lower, upper, score in SLOPE_SCORE_BANDS:
        if upper is None:
            if slope_deg >= lower:
                return score
        else:
            if lower <= slope_deg < upper:
                return score

    return None

def get_fire_history_score(fire_year):
    if (fire_year is None):
        return FireHistoryScore.NO_RECENT_FIRE
    
    # Get the current year as an integer
    current_year = date.today().year
    year_since_fire = current_year - int(fire_year)

    for lower, upper, score in FIRE_HISTORY_SCORE_BANDS:
        if upper is None:
            if year_since_fire >= lower:
                return score
        else:
            if lower <= year_since_fire < upper:
                return score

    return FireHistoryScore.NO_RECENT_FIRE

def get_hazard_level(hazard_score):
    if hazard_score is None:
        return None

    hazard_score = float(hazard_score)

    for lower, upper, level in HAZARD_SCORE_BANDS:
        if upper is None:
            if hazard_score >= lower:
                return level
        else:
            if lower <= hazard_score < upper:
                return level

    return None
