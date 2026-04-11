from pathlib import Path
import sys

import geopandas as gpd
import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from services.risk.load_processed_data import load_hazard_overview_data
from services.risk.load_processed_data import load_site_vulnerability_data
from services.risk.risk_model import calculate_recorded_site_priority
from services.risk.scoring import get_hazard_level

EXCLUDED_SITE_IDS = {
    "ACH-00032790", # This site is a complex polygon that includes several smaller sites.
}

# Build recorded site priority by matching each recorded site with hazard cells,
# keeping the highest hazard score, and combining it with site vulnerability.
def main() -> None:
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
        hazard_data[["hazard_score", "hazard_level", "geometry"]],
        how="left",
        predicate="intersects",
    )

    # group the joined results by site and take the maximum hazard score for each site
    max_hazard_scores = joined.groupby("site_row_id")["hazard_score"].max()

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

        # TODO: use area-weighted overlap instead of max hazard score if we need
        # a better summary for large recorded sites later.
        # get the site’s max hazard score from the joined hazard cells
        hazard_score = max_hazard_scores.get(site_row_id)

        # make sure the value is not None and not missing
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
        priority_result = calculate_recorded_site_priority(
            hazard_score,
            site_vulnerability_score,
        )
        
        # append the results
        hazard_scores.append(hazard_score)
        hazard_levels.append(
            None if hazard_level is None else int(hazard_level)
        )
        site_vulnerability_scores.append(
            None if site_vulnerability_score is None else int(site_vulnerability_score)
        )
        recorded_site_priority_scores.append(
            priority_result["recorded_site_priority_score"]
        )
        recorded_site_priority_levels.append(
            None
            if priority_result["recorded_site_priority_level"] is None
            else int(priority_result["recorded_site_priority_level"])
        )

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
    sites_data.to_file(geojson_output_path, driver="GeoJSON")

    print(f"Saved to: {gpkg_output_path}")
    print(f"Saved to: {geojson_output_path}")


if __name__ == "__main__":
    main()
