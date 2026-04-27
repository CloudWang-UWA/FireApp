from pathlib import Path
import sys

import geopandas as gpd
import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from services.risk.load_processed_data import load_hazard_overview_data
from services.risk.load_processed_data import load_site_vulnerability_data
from services.risk.config import EXCLUDED_SITE_IDS
from services.risk.config import RECORDED_SITE_HAZARD_AGGREGATION
from services.risk.lookups import FUEL_TYPE_LABEL_MAP
from services.risk.metadata import require_files
from services.risk.metadata import update_risk_manifest
from services.risk.risk_model import calculate_site_priority
from services.risk.scoring import get_hazard_level


def build_site_hazard_lookup(joined: gpd.GeoDataFrame) -> pd.DataFrame:
    if RECORDED_SITE_HAZARD_AGGREGATION != "max":
        raise ValueError(
            "Unsupported recorded-site hazard aggregation method: "
            f"{RECORDED_SITE_HAZARD_AGGREGATION}"
        )

    # Future option: add area-weighted mean so large sites can use overlap area
    # instead of only the maximum intersecting hazard cell.
    joined_with_hazard = joined.dropna(subset=["hazard_score"]).copy()
    if joined_with_hazard.empty:
        return pd.DataFrame()

    joined_with_hazard = joined_with_hazard.sort_values(
        by=["site_row_id", "hazard_score"],
        ascending=[True, False],
    )
    joined_with_hazard = joined_with_hazard.drop_duplicates(
        subset=["site_row_id"],
        keep="first",
    )
    return joined_with_hazard.set_index("site_row_id")


# Build recorded site priority by matching each recorded site with hazard cells,
# keeping the highest hazard score, and combining it with site vulnerability.
def main() -> None:
    require_files(
        [
            BACKEND_DIR / "data" / "risk_outputs" / "site_vulnerability.gpkg",
            BACKEND_DIR / "data" / "risk_outputs" / "hazard_overview.gpkg",
        ]
    )
    sites_data = load_site_vulnerability_data().copy()
    hazard_data = load_hazard_overview_data()

    if hazard_data.crs != sites_data.crs:
        hazard_data = hazard_data.to_crs(sites_data.crs)

    excluded_site_mask = sites_data["ach_identifier"].isin(EXCLUDED_SITE_IDS)
    kept_site_mask = excluded_site_mask == False
    sites_data = sites_data[kept_site_mask].copy()
    sites_data = sites_data.reset_index(drop=True)
    sites_data["site_row_id"] = sites_data.index

    # spatial join between sites and hazard_data
    joined = gpd.sjoin(
        sites_data,
        hazard_data[
            [
                "fuel_code",
                "slope_deg",
                "fire_year",
                "fire_type",
                "hazard_score",
                "hazard_level",
                "geometry",
            ]
        ],
        how="left",
        predicate="intersects",
    )

    site_hazard_rows = build_site_hazard_lookup(joined)

    fuel_codes = []
    fuel_labels = []
    slope_values = []
    fire_years = []
    fire_types = []
    hazard_scores = []
    hazard_levels = []
    site_vulnerability_scores = []
    recorded_site_priority_scores = []
    recorded_site_priority_levels = []

    for _, site in sites_data.iterrows():
        site_row_id = site["site_row_id"]
        site_vulnerability_score = site.get("site_vulnerability_score")
        if site_vulnerability_score is not None and not pd.isna(site_vulnerability_score):
            site_vulnerability_score = int(site_vulnerability_score)
        else:
            site_vulnerability_score = None

        # Current config uses the highest-scoring intersecting hazard cell.
        # Future work may support area-weighted mean for large recorded sites.
        site_hazard_row = (
            site_hazard_rows.loc[site_row_id]
            if site_row_id in site_hazard_rows.index
            else None
        )

        if site_hazard_row is not None:
            fuel_code = site_hazard_row.get("fuel_code")
            slope_deg = site_hazard_row.get("slope_deg")
            fire_year = site_hazard_row.get("fire_year")
            fire_type = site_hazard_row.get("fire_type")
            hazard_score = site_hazard_row.get("hazard_score")
        else:
            fuel_code = None
            slope_deg = None
            fire_year = None
            fire_type = None
            hazard_score = None

        if fuel_code is not None and not pd.isna(fuel_code):
            fuel_code = int(fuel_code)
            fuel_label = FUEL_TYPE_LABEL_MAP.get(fuel_code)
        else:
            fuel_code = None
            fuel_label = None

        if slope_deg is not None and not pd.isna(slope_deg):
            slope_deg = float(slope_deg)
        else:
            slope_deg = None

        if fire_year is not None and not pd.isna(fire_year):
            fire_year = int(fire_year)
        else:
            fire_year = None

        if fire_type is not None and pd.isna(fire_type):
            fire_type = None

        if hazard_score is not None and not pd.isna(hazard_score):
            hazard_score = float(hazard_score)
        else:
            hazard_score = None

        # convert hazard score to hazard level
        if hazard_score is None:
            hazard_level = None
        else:
            hazard_level = get_hazard_level(hazard_score)

        # combine hazard score with site vulnerability score
        priority_result = calculate_site_priority(
            hazard_score,
            site_vulnerability_score,
        )
        
        # append the results
        fuel_codes.append(fuel_code)
        fuel_labels.append(fuel_label)
        slope_values.append(slope_deg)
        fire_years.append(fire_year)
        fire_types.append(fire_type)
        hazard_scores.append(hazard_score)
        hazard_levels.append(
            None if hazard_level is None else int(hazard_level)
        )
        site_vulnerability_scores.append(
            None if site_vulnerability_score is None else int(site_vulnerability_score)
        )
        recorded_site_priority_scores.append(
            priority_result["site_priority_score"]
        )
        recorded_site_priority_levels.append(
            None
            if priority_result["site_priority_level"] is None
            else int(priority_result["site_priority_level"])
        )

    sites_data["fuel_code"] = fuel_codes
    sites_data["fuel_type"] = fuel_labels
    sites_data["slope_deg"] = slope_values
    sites_data["fire_year"] = fire_years
    sites_data["fire_type"] = fire_types
    sites_data["hazard_score"] = hazard_scores
    sites_data["hazard_level"] = hazard_levels
    sites_data["site_vulnerability_score"] = site_vulnerability_scores
    sites_data["recorded_site_priority_score"] = recorded_site_priority_scores
    sites_data["recorded_site_priority_level"] = recorded_site_priority_levels

    sites_data = sites_data.drop(columns=["site_row_id"])

    output_dir = BACKEND_DIR / "data" / "risk_outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    gpkg_output_path = output_dir / "recorded_site_priority.gpkg"
    geojson_output_path = output_dir / "recorded_site_priority.geojson"

    sites_data.to_file(gpkg_output_path, driver="GPKG")
    sites_data.to_crs(4326).to_file(geojson_output_path, driver="GeoJSON")
    update_risk_manifest(
        output_name="recorded_site_priority",
        stage="recorded_site_priority",
        generated_files=[gpkg_output_path, geojson_output_path],
        source_files=[
            BACKEND_DIR / "data" / "risk_outputs" / "site_vulnerability.gpkg",
            BACKEND_DIR / "data" / "risk_outputs" / "hazard_overview.gpkg",
        ],
        notes=[
            "Recorded-site priority shows the relative priority of recorded heritage sites by combining site vulnerability with local hazard.",
        ],
    )

    print(f"Saved to: {gpkg_output_path}")
    print(f"Saved to: {geojson_output_path}")


if __name__ == "__main__":
    main()
