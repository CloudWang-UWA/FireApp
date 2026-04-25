from enum import IntEnum


class FuelScore(IntEnum):
    NO_FUEL = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class SlopeScore(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class FireHistoryScore(IntEnum):
    RECENT_FIRE = -1
    NO_RECENT_FIRE = 0


class HazardLevel(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class SiteVulnerabilityScore(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class GraniteScore(IntEnum):
    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class IntegratedPriorityLevel(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


FUEL_SCORE_MAP = {
    0: FuelScore.NO_FUEL,
    110: FuelScore.HIGH,
    120: FuelScore.HIGH,
    210: FuelScore.HIGH,
    220: FuelScore.HIGH,
    230: FuelScore.HIGH,
    310: FuelScore.MEDIUM,
    321: FuelScore.HIGH,
    322: FuelScore.HIGH,
    323: FuelScore.HIGH,
    324: FuelScore.HIGH,
    330: FuelScore.MEDIUM,
    411: FuelScore.MEDIUM,
    421: FuelScore.HIGH,
    422: FuelScore.HIGH,
    423: FuelScore.MEDIUM,
    424: FuelScore.LOW,
    431: FuelScore.HIGH,
    432: FuelScore.HIGH,
    433: FuelScore.MEDIUM,
    434: FuelScore.LOW,
    510: FuelScore.HIGH,
    520: FuelScore.HIGH,
    531: FuelScore.HIGH,
    532: FuelScore.MEDIUM,
    533: FuelScore.LOW,
    610: FuelScore.MEDIUM,
    620: FuelScore.MEDIUM,
    631: FuelScore.MEDIUM,
    632: FuelScore.MEDIUM,
    633: FuelScore.LOW,
    640: FuelScore.LOW,
    700: FuelScore.LOW,
    800: FuelScore.LOW,
    910: FuelScore.NO_FUEL,
    920: FuelScore.LOW,
    930: FuelScore.LOW,
    940: FuelScore.LOW,
    950: FuelScore.NO_FUEL,
    960: FuelScore.NO_FUEL,
}


FUEL_TYPE_LABEL_MAP = {
    0: "No fuel data",
    110: "Tall, closed forest",
    120: "Closed forest",
    210: "Tall open forest",
    220: "Open forest",
    230: "Low open forest",
    310: "Broadleaf plantation",
    321: "Radiata pine",
    322: "Maritime pine",
    323: "Southern pine",
    324: "Other conifer",
    330: "Other plantation",
    411: "Tall woodland with grassy understory",
    421: "Woodland with shrubby understory",
    422: "Woodland with spinifex understory",
    423: "Woodland with grassy understory",
    424: "Woodland with sparse understory",
    431: "Low woodland with shrubby understory",
    432: "Low woodland with spinifex understory",
    433: "Low woodland with grassy understory",
    434: "Low woodland with sparse understory",
    510: "Tall shrubland",
    520: "Shrubland",
    531: "Open shrubland with spinifex understory",
    532: "Open shrubland with grassy understory",
    533: "Open shrubland with sparse understory",
    610: "Sedgeland",
    620: "Hummock grassland",
    631: "Grassland",
    632: "Open grassland",
    633: "Sparse grassland",
    640: "Croplands",
    700: "Horticulture",
    800: "Wetlands",
    910: "Water",
    920: "Wildland urban interface 1",
    930: "Wildland urban interface 2",
    940: "Wildland urban interface 3",
    950: "Built-up",
    960: "Bare ground",
}


SLOPE_SCORE_BANDS = [
    (0, 5, SlopeScore.LOW),
    (5, 15, SlopeScore.MEDIUM),
    (15, None, SlopeScore.HIGH),
]


FIRE_HISTORY_SCORE_BANDS = [
    (0, 5, FireHistoryScore.RECENT_FIRE),
    (5, None, FireHistoryScore.NO_RECENT_FIRE),
]


HAZARD_SCORE_BANDS = [
    (0, 3, HazardLevel.LOW),
    (3, 5, HazardLevel.MEDIUM),
    (5, None, HazardLevel.HIGH),
]


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


INTEGRATED_PRIORITY_BANDS = [
    (0.0, 0.34, IntegratedPriorityLevel.LOW),
    (0.34, 0.67, IntegratedPriorityLevel.MEDIUM),
    (0.67, None, IntegratedPriorityLevel.HIGH),
]


EXCLUDED_SITE_IDS = {
    "ACH-00032790",
}


FIRE_TYPE_CODES = {
    "PB": 1,
    "WF": 2,
    "999": 3,
}


HAZARD_PROGRESS_STEP = 50000
