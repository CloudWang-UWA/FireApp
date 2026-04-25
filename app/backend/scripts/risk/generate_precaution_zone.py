from pathlib import Path
import sys

import geopandas as gpd
import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from services.risk.load_processed_data import load_granite_influence_data
from services.risk.load_processed_data import load_hazard_overview_data
from services.risk.load_processed_data import load_sites_data
from services.risk.config import EXCLUDED_SITE_IDS
from services.risk.risk_model import calculate_precaution_zone


def prepare_inputs():
    hazard_data = load_hazard_overview_data()
    granite_data = load_granite_influence_data()
    sites_data = load_sites_data().copy()

    if granite_data.crs != hazard_data.crs:
        granite_data = granite_data.to_crs(hazard_data.crs)

    if sites_data.crs != hazard_data.crs:
        sites_data = sites_data.to_crs(hazard_data.crs)

    excluded_site_mask = sites_data["ach_identifier"].isin(EXCLUDED_SITE_IDS)
    kept_site_mask = excluded_site_mask == False
    sites_data = sites_data[kept_site_mask].copy()

    return hazard_data, granite_data, sites_data


def assign_granite_scores(hazard_data, granite_data):
    hazard_data = hazard_data.reset_index(drop=True)
    hazard_data["hazard_row_id"] = hazard_data.index
    hazard_sindex = hazard_data.sindex

    hazard_data["granite_score"] = 0

    granite_features = granite_data.sort_values("granite_score").reset_index(drop=True)
    # Use the hazard spatial index to limit each granite check to nearby cells
    # instead of scanning the whole hazard layer every time.
    for feature_index, granite_row in granite_features.iterrows():
        zone_geometry = granite_row.geometry
        granite_score = int(granite_row["granite_score"])

        # First grab nearby hazard cells from the zone bounding box.
        candidate_ids = list(hazard_sindex.intersection(zone_geometry.bounds))
        if candidate_ids:
            # Then keep only the cells that really intersect the zone.
            zone_mask = hazard_data.iloc[candidate_ids].geometry.intersects(zone_geometry)
            matched_ids = hazard_data.iloc[candidate_ids].index[zone_mask]
            if len(matched_ids) > 0:
                current_scores = hazard_data.loc[matched_ids, "granite_score"]
                hazard_data.loc[matched_ids, "granite_score"] = current_scores.clip(
                    lower=granite_score
                )

        if (feature_index + 1) % 25 == 0 or feature_index + 1 == len(granite_features):
            print(
                f"Processed granite features: {feature_index + 1}/{len(granite_features)}"
            )

    return hazard_data, hazard_sindex


def add_precaution_scores(hazard_data):
    precaution_results = hazard_data.apply(
        lambda row: calculate_precaution_zone(
            row["hazard_score"],
            row["granite_score"],
        ),
        axis=1,
        result_type="expand",
    )
    hazard_data["precaution_zone_score"] = precaution_results["precaution_zone_score"]
    hazard_data["precaution_zone_level"] = precaution_results["precaution_zone_level"]

    return hazard_data


def remove_recorded_site_overlap(hazard_data, sites_data, hazard_sindex):
    recorded_site_mask = pd.Series(False, index=hazard_data.index)
    site_features = sites_data.reset_index(drop=True)
    # Checking one site at a time keeps the candidate set much smaller than
    # building one large union geometry first.
    for site_index, site_row in site_features.iterrows():
        site_geometry = site_row.geometry
        # First grab nearby hazard cells from the site bounding box.
        candidate_ids = list(hazard_sindex.intersection(site_geometry.bounds))
        if candidate_ids:
            # Then keep only the cells that really intersect the site.
            overlap_mask = hazard_data.iloc[candidate_ids].geometry.intersects(site_geometry)
            matched_ids = hazard_data.iloc[candidate_ids].index[overlap_mask]
            if len(matched_ids) > 0:
                recorded_site_mask.loc[matched_ids] = True

        if (site_index + 1) % 25 == 0 or site_index + 1 == len(site_features):
            print(f"Processed recorded sites: {site_index + 1}/{len(site_features)}")

    kept_precaution_mask = recorded_site_mask == False
    precaution_data = hazard_data[kept_precaution_mask].copy()
    precaution_data = precaution_data.drop(columns=["hazard_row_id"])

    return precaution_data


def dissolve_precaution_zones(precaution_data):
    # Merge neighbouring precaution cells with the same final level so the
    # output looks more like a zone map than a grid.
    return precaution_data.dissolve(
        by="precaution_zone_level",
        aggfunc={
            "hazard_score": "max",
            "hazard_level": "max",
            "granite_score": "max",
            "precaution_zone_score": "max",
        },
    ).reset_index()


def save_precaution_outputs(precaution_data):
    output_dir = BACKEND_DIR / "data" / "risk_outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    gpkg_output_path = output_dir / "precaution_zone.gpkg"
    geojson_output_path = output_dir / "precaution_zone.geojson"

    precaution_data.to_file(gpkg_output_path, driver="GPKG")
    precaution_data.to_crs(4326).to_file(geojson_output_path, driver="GeoJSON")

    print(f"Saved to: {gpkg_output_path}")
    print(f"Saved to: {geojson_output_path}")


# Build potential heritage precaution from hazard cells and overlapping granite zones.
def main() -> None:
    hazard_data, granite_data, sites_data = prepare_inputs()
    hazard_data, hazard_sindex = assign_granite_scores(hazard_data, granite_data)
    hazard_data = add_precaution_scores(hazard_data)
    precaution_data = remove_recorded_site_overlap(
        hazard_data,
        sites_data,
        hazard_sindex,
    )
    precaution_data = dissolve_precaution_zones(precaution_data)
    save_precaution_outputs(precaution_data)


if __name__ == "__main__":
    main()
