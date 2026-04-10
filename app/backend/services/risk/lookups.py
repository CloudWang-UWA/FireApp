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
