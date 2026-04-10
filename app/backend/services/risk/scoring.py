from .lookups import FUEL_SCORE_MAP
from .lookups import SLOPE_SCORE_BANDS
from .lookups import FireHistoryScore
from .lookups import FIRE_HISTORY_SCORE_BANDS
from .lookups import HAZARD_SCORE_BANDS
from .lookups import PLACE_TYPE_ALIASES
from .lookups import PLACE_TYPE_SCORE_MAP
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

def get_fire_history_score(fire_year, fire_type):
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
                return score if fire_type == "PB" else FireHistoryScore.NO_RECENT_FIRE

    return FireHistoryScore.NO_RECENT_FIRE

# Get the cultural heritage sites score based on their place type, eg. Artefacts / Scatter
def get_place_type_score(raw_place_type):
    if (raw_place_type is None):
        return None
    
    place_types = []

    # Some places have two types like "Artefacts / Scatter; Traditional Structure"
    for single_type in str(raw_place_type).split(";"):
        place_type = single_type.strip()
        if not place_type:
            continue

        place_type = PLACE_TYPE_ALIASES.get(place_type, place_type)
        place_types.append(place_type)

    if not place_types:
        return None

    scores = []

    # Choose the more vulnerable type
    for place_type in place_types:
        score = PLACE_TYPE_SCORE_MAP.get(place_type)
        if score is not None:
            scores.append(score)

    if not scores:
        return None

    return max(scores)


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
