from enum import IntEnum

class FuelScore(IntEnum):
    NO_FUEL = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3

FUEL_SCORE_MAP = {
    0: FuelScore.NO_FUEL,    # No fuel data

    110: FuelScore.HIGH,     # Tall, closed forest
    120: FuelScore.HIGH,     # Closed forest

    210: FuelScore.HIGH,     # Tall open forest
    220: FuelScore.HIGH,     # Open forest
    230: FuelScore.HIGH,     # Low open forest

    310: FuelScore.MEDIUM,   # Broadleaf plantation
    321: FuelScore.HIGH,     # Radiata pine
    322: FuelScore.HIGH,     # Maritime pine
    323: FuelScore.HIGH,     # Southern pine
    324: FuelScore.HIGH,     # Other conifer
    330: FuelScore.MEDIUM,   # Other plantation

    411: FuelScore.MEDIUM,   # Tall woodland with grassy understory
    421: FuelScore.HIGH,     # Woodland with shrubby understory
    422: FuelScore.HIGH,     # Woodland with spinifex understory
    423: FuelScore.MEDIUM,   # Woodland with grassy understory
    424: FuelScore.LOW,      # Woodland with sparse understory

    431: FuelScore.HIGH,     # Low woodland with shrubby understory
    432: FuelScore.HIGH,     # Low woodland with spinifex understory
    433: FuelScore.MEDIUM,   # Low woodland with grassy understory
    434: FuelScore.LOW,      # Low woodland with sparse understory

    510: FuelScore.HIGH,     # Tall shrubland
    520: FuelScore.HIGH,     # Shrubland
    531: FuelScore.HIGH,     # Open shrubland with spinifex understory
    532: FuelScore.MEDIUM,   # Open shrubland with grassy understory
    533: FuelScore.LOW,      # Open shrubland with sparse understory

    610: FuelScore.MEDIUM,   # Sedgeland
    620: FuelScore.MEDIUM,   # Hummock grassland
    631: FuelScore.MEDIUM,   # Grassland
    632: FuelScore.MEDIUM,   # Open grassland
    633: FuelScore.LOW,      # Sparse grassland
    640: FuelScore.LOW,      # Croplands
    700: FuelScore.LOW,      # Horticulture
    800: FuelScore.LOW,      # Wetlands

    910: FuelScore.NO_FUEL,  # Water
    920: FuelScore.LOW,      # Wildland urban interface 1
    930: FuelScore.LOW,      # Wildland urban interface 2
    940: FuelScore.LOW,      # Wildland urban interface 3
    950: FuelScore.NO_FUEL,  # Built-up
    960: FuelScore.NO_FUEL,  # Bare ground
}

class SlopeScore(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


SLOPE_SCORE_BANDS = [
    (0, 5, SlopeScore.LOW),
    (5, 15, SlopeScore.MEDIUM),
    (15, None, SlopeScore.HIGH),
]

# Recent fire may reduce short-term hazard because fuel has already been burnt.
# If there is no recent fire, fire history does not change the score.
class FireHistoryScore(IntEnum):
    RECENT_FIRE = -1
    NO_RECENT_FIRE = 0

FIRE_HISTORY_SCORE_BANDS = [
    (0, 5, FireHistoryScore.RECENT_FIRE),
    (5, None, FireHistoryScore.NO_RECENT_FIRE),
]

# Hazard here means background environmental danger, including fuel, slope, and fire history.
class HazardLevel(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

HAZARD_SCORE_BANDS = [
    (0, 3, HazardLevel.LOW),
    (3, 5, HazardLevel.MEDIUM),
    (5, None, HazardLevel.HIGH),
]

# Site vulnerability based on heritage place type.
class SiteVulnerabilityScore(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class GraniteScore(IntEnum):
    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3


GRANITE_DISTANCE_SCORE_BANDS = [
    (100, GraniteScore.MEDIUM),
    (250, GraniteScore.LOW),
]


PLACE_TYPE_ALIASES = {
    "Plant Res": "Plant Resource",
    "Repository / St": "Repository / Storage Place",
}


COUNCIL_PLACE_NAME_KEYWORDS = {
    "Burial": ("grave", "cemetery"),
    "Quarry": ("quarry",),
    "Water Source": ("fish ponds", "pond", "well"),
    "Landscape / Seascape Feature": (
        "park",
        "reserve",
        "cove",
        "rocks",
        "tree",
        "golf course",
        "precinct",
        "memorial",
    ),
    "Camp": ("camp",),
    "Traditional Structure": (
        "church",
        "chapel",
        "rectory",
        "convent",
        "station",
        "railway",
        "house",
        "homestead",
        "hall",
        "hotel",
        "hospital",
        "school",
        "office",
        "museum",
        "bank",
        "police",
        "court",
        "shop",
        "depot",
        "lighthouse",
        "barn",
        "cottage",
        "building",
        "buildings",
        "club",
        "quarters",
        "lockup",
        "gaol",
        "bridge",
        "jetty",
        "farm",
        "fort",
        "forts",
        "complex",
        "residence",
        "tearoom",
        "rotunda",
        "oven",
    ),
}


PLACE_TYPE_SCORE_MAP = {
    "Artefacts / Scatter": SiteVulnerabilityScore.LOW,
    "BP Dating Details": SiteVulnerabilityScore.LOW,
    "Birthplace": SiteVulnerabilityScore.LOW,
    "Burial": SiteVulnerabilityScore.HIGH,
    "Camp": SiteVulnerabilityScore.MEDIUM,
    "Creation / Dreaming Narrative": SiteVulnerabilityScore.LOW,
    "Engraving": SiteVulnerabilityScore.HIGH,
    "Fish Trap": SiteVulnerabilityScore.LOW,
    "Grinding areas / Grooves": SiteVulnerabilityScore.LOW,
    # Historical is currently only seen with other place types in our data.
    # It may fall into high, medium, or low depending on the site, so we are
    # not assigning it a standalone level here.
    # "Historical": SiteVulnerabilityScore.HIGH,
    "Hunting Place": SiteVulnerabilityScore.LOW,
    "Landscape / Seascape Feature": SiteVulnerabilityScore.LOW,
    "Massacre": SiteVulnerabilityScore.LOW,
    "Meeting Place": SiteVulnerabilityScore.LOW,
    "Midden": SiteVulnerabilityScore.MEDIUM,
    "Mission": SiteVulnerabilityScore.HIGH,
    "Modified Tree": SiteVulnerabilityScore.HIGH,
    "Ochre": SiteVulnerabilityScore.LOW,
    "Other": SiteVulnerabilityScore.MEDIUM,
    "Painting": SiteVulnerabilityScore.HIGH,
    "Plant Resource": SiteVulnerabilityScore.HIGH,
    "Quarry": SiteVulnerabilityScore.LOW,
    "Repository / Storage Place": SiteVulnerabilityScore.MEDIUM,
    "Ritual / Ceremonial": SiteVulnerabilityScore.LOW,
    "Rock Shelter": SiteVulnerabilityScore.LOW,
    "Shell": SiteVulnerabilityScore.LOW,
    "Stone Arrangement": SiteVulnerabilityScore.MEDIUM,
    "Sub surface cultural material": SiteVulnerabilityScore.LOW,
    "Traditional Structure": SiteVulnerabilityScore.HIGH,
    "Water Source": SiteVulnerabilityScore.LOW,
}

class IntegratedPriorityLevel(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


INTEGRATED_PRIORITY_BANDS = [
    (0.0, 0.34, IntegratedPriorityLevel.LOW),
    (0.34, 0.67, IntegratedPriorityLevel.MEDIUM),
    (0.67, None, IntegratedPriorityLevel.HIGH),
]
