from .lookups import FUEL_SCORE_MAP
from .lookups import SLOPE_SCORE_BANDS
from .lookups import FireHistoryScore
from .lookups import FIRE_HISTORY_SCORE_BANDS
from .lookups import HAZARD_SCORE_BANDS
from .lookups import PLACE_TYPE_ALIASES
from .lookups import PLACE_TYPE_SCORE_MAP
from .lookups import GraniteScore
from .lookups import GRANITE_DISTANCE_SCORE_BANDS
from .lookups import INTEGRATED_PRIORITY_BANDS
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


def get_granite_score(on_granite, distance_to_granite):
    if on_granite:
        return GraniteScore.HIGH

    if distance_to_granite is None:
        return GraniteScore.NONE

    distance_to_granite = float(distance_to_granite)

    for upper, score in GRANITE_DISTANCE_SCORE_BANDS:
        if distance_to_granite <= upper:
            return score

    return GraniteScore.NONE


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

# TODO: change the scaling factor so that it suits new data, we may extend our areas later
def normalize_hazard_score(hazard_score):
    if hazard_score is None:
        return None
    return min(max(float(hazard_score) / 6.0, 0.0), 1.0)


def normalize_site_vulnerability_score(place_type_score):
    if place_type_score is None:
        return None
    return min(max(float(place_type_score) / 3.0, 0.0), 1.0)


def normalize_granite_score(granite_score):
    if granite_score is None:
        return None
    return min(max(float(granite_score) / 3.0, 0.0), 1.0)

# Caculate site priority score, combination of environmental factors and sites place type
def get_recorded_site_priority_score(hazard_score, place_type_score):
    hazard = normalize_hazard_score(hazard_score)
    site = normalize_site_vulnerability_score(place_type_score)

    if hazard is None or site is None:
        return None

    return 0.5 * hazard + 0.5 * site

# Caculate potential heritage precaution score, combination of environmental factors and granite
def get_potential_heritage_precaution_score(hazard_score, granite_score):
    hazard = normalize_hazard_score(hazard_score)
    granite = normalize_granite_score(granite_score)

    if hazard is None or granite is None:
        return None

    return 0.7 * hazard + 0.3 * granite

# Convert integrated score to level
def get_integrated_priority_level(score):
    if score is None:
        return None

    score = float(score)

    for lower, upper, level in INTEGRATED_PRIORITY_BANDS:
        if upper is None:
            if score >= lower:
                return level
        else:
            if lower <= score < upper:
                return level

    return None