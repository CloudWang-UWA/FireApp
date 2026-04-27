import geopandas as gpd
import pandas as pd
import rasterio
from rasterio.transform import xy
from rasterio.windows import from_bounds
from shapely.geometry import Point

from services.risk.load_processed_data import load_fire_history_data
from services.risk.load_processed_data import load_fuel_data
from services.risk.load_processed_data import load_slope_data
from services.risk.lookups import FUEL_TYPE_LABEL_MAP
from services.risk.risk_model import calculate_hazard
from services.risk.risk_model import calculate_site_priority
from services.risk.risk_model import calculate_site_vulnerability
from services.risk.site_hazard import build_square_site
from services.risk.site_hazard import get_fire_history


def get_sampled_raster_value(dataset, point_x: float, point_y: float):
    sample = next(dataset.sample([(point_x, point_y)]), None)
    if sample is None or len(sample) == 0:
        return None

    value = sample[0]
    if dataset.nodata is not None and value == dataset.nodata:
        return None

    if pd.isna(value):
        return None

    return value


# Uploaded sites do not use the precomputed recorded site layer.
# Instead, we sample the source hazard inputs directly around the uploaded site
# so a new site can be scored immediately after submission.
def get_uploaded_site_hazard(site_shape) -> dict:
    # use the source data directly for upload risk
    fuel_data = load_fuel_data()
    slope_data = load_slope_data()
    fire_history_data = load_fire_history_data()

    # Convert the uploaded site square from WGS84 into the raster CRS so the
    # raster window and point sampling line up with the source hazard data.
    site_data = gpd.GeoDataFrame(
        [{"site_row_id": 0, "geometry": site_shape}],
        geometry="geometry",
        crs="EPSG:4326",
    )
    site_shape_projected = site_data.to_crs(fuel_data.crs).geometry.iloc[0]

    left, bottom, right, top = site_shape_projected.bounds
    window = from_bounds(left, bottom, right, top, transform=fuel_data.transform)
    window = window.round_offsets().round_lengths()

    row_off = max(0, int(window.row_off))
    col_off = max(0, int(window.col_off))
    height = min(fuel_data.height - row_off, int(window.height))
    width = min(fuel_data.width - col_off, int(window.width))

    empty_result = {
        "hazard_score": None,
        "hazard_level": None,
        "fuel_code": None,
        "fuel_type": None,
        "slope_deg": None,
        "fire_year": None,
        "fire_type": None,
    }

    if height <= 0 or width <= 0:
        return empty_result

    # Restrict raster reads to the site's local bounds instead of scanning the
    # full hazard rasters for each uploaded site.
    window = rasterio.windows.Window(col_off, row_off, width, height)
    fuel_band = fuel_data.read(1, window=window)

    fire_history_candidates = fire_history_data.iloc[
        list(fire_history_data.sindex.intersection(site_shape_projected.bounds))
    ]

    best_hazard = None
    best_result = None

    # Keep the highest hazard found inside the uploaded site so this workflow
    # stays aligned with the risk module's hazard calculation method.
    for local_row in range(height):
        for local_col in range(width):
            fuel_code = fuel_band[local_row, local_col]
            if fuel_data.nodata is not None and fuel_code == fuel_data.nodata:
                continue

            row = row_off + local_row
            col = col_off + local_col
            point_x, point_y = xy(fuel_data.transform, row, col, offset="center")
            cell_center = Point(point_x, point_y)

            if not site_shape_projected.intersects(cell_center):
                continue

            fuel_code = int(fuel_code)
            slope_value = get_sampled_raster_value(slope_data, point_x, point_y)
            slope_deg = None if slope_value is None else float(slope_value)
            fire_year, fire_type = get_fire_history(
                fire_history_candidates,
                point_x,
                point_y,
            )

            hazard_result = calculate_hazard(
                fuel_code,
                slope_deg,
                fire_year,
                fire_type,
            )

            hazard_score = hazard_result["hazard_score"]
            if hazard_score is None:
                continue

            if best_hazard is None or hazard_score > best_hazard:
                best_hazard = hazard_score
                best_result = {
                    "hazard_score": hazard_score,
                    "hazard_level": hazard_result["hazard_level"],
                    "fuel_code": fuel_code,
                    "fuel_type": FUEL_TYPE_LABEL_MAP.get(fuel_code),
                    "slope_deg": slope_deg,
                    "fire_year": fire_year,
                    "fire_type": fire_type,
                }

    if best_result is None:
        return empty_result

    return best_result


# Combine uploaded-site hazard with place-type vulnerability using the same
# generic site priority calculation method used in the risk module.
def calculate_uploaded_site_risk(
    place_type: str, latitude: float, longitude: float, site_size_m: float
) -> dict:
    site_shape = build_square_site(longitude, latitude, site_size_m)
    hazard_result = get_uploaded_site_hazard(site_shape)

    site_vulnerability_result = calculate_site_vulnerability(place_type)

    priority_result = calculate_site_priority(
        hazard_result["hazard_score"],
        site_vulnerability_result["site_vulnerability_score"],
    )

    return {
        "hazard": hazard_result,
        "siteVulnerability": site_vulnerability_result,
        "sitePriority": priority_result,
    }
