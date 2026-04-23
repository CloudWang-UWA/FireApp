from __future__ import annotations

import geopandas as gpd
import numpy as np
from shapely.geometry import LineString

from fire_vulnerability_etl.upstream import (
    HIGH_FUEL_CODE,
    LOW_FUEL_CODE,
    MODERATE_FUEL_CODE,
    _swap_xy_if_needed,
    classify_landcover_fuel,
)


def test_swap_xy_if_needed_normalises_wfs_axis_order() -> None:
    frame = gpd.GeoDataFrame(
        {"name": ["example"]},
        geometry=[LineString([(-35.1, 117.9), (-35.0, 118.0)])],
        crs="EPSG:4326",
    )

    swapped = _swap_xy_if_needed(frame)

    assert swapped.total_bounds[0] > 100
    assert swapped.total_bounds[1] < 0
    assert swapped.geometry.iloc[0].coords[0] == (117.9, -35.1)


def test_classify_landcover_fuel_masks_low_surface_classes() -> None:
    landcover = np.array([[27, 93, 101]], dtype="int16")

    fuel = classify_landcover_fuel(landcover)

    assert fuel.tolist() == [[HIGH_FUEL_CODE, LOW_FUEL_CODE, LOW_FUEL_CODE]]


def test_classify_landcover_fuel_uses_fractional_cover_thresholds_for_supported_classes() -> None:
    landcover = np.array([[27, 28, 29]], dtype="int16")

    fuel = classify_landcover_fuel(landcover)

    assert fuel.tolist() == [[HIGH_FUEL_CODE, MODERATE_FUEL_CODE, MODERATE_FUEL_CODE]]


def test_classify_landcover_fuel_defaults_to_low_when_cover_is_sparse() -> None:
    landcover = np.array([[9, 15, 20, 21, 35]], dtype="int16")

    fuel = classify_landcover_fuel(landcover)

    assert fuel.tolist() == [[MODERATE_FUEL_CODE, MODERATE_FUEL_CODE, MODERATE_FUEL_CODE, MODERATE_FUEL_CODE, LOW_FUEL_CODE]]
