from pathlib import Path
import sys

import geopandas as gpd
import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from services.risk.load_processed_data import load_granite_influence_data
from services.risk.load_processed_data import load_hazard_overview_data
from services.risk.load_processed_data import load_sites_data
from services.risk.risk_model import calculate_potential_heritage_precaution

EXCLUDED_SITE_IDS = {
    "ACH-00032790", # This site is a complex polygon that includes several smaller sites.
}


# Build potential heritage precaution from hazard cells and overlapping granite zones,
# then remove cells that overlap recorded sites and merge neighbouring areas by level.
def main() -> None:
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

    hazard_data = hazard_data.reset_index(drop=True)
    hazard_data["hazard_row_id"] = hazard_data.index

    # spatial join between hazard cells and granite influence zones
    joined = gpd.sjoin(
        hazard_data,
        granite_data[["granite_score", "zone", "distance_band", "geometry"]],
        how="left",
        predicate="intersects",
    )

    # group the joined results by hazard cell and take the maximum granite score
    max_granite_scores = joined.groupby("hazard_row_id")["granite_score"].max()

    granite_scores = []
    precaution_scores = []
    precaution_levels = []

    for _, hazard_cell in hazard_data.iterrows():
        hazard_row_id = hazard_cell["hazard_row_id"]
        hazard_score = hazard_cell.get("hazard_score")

        # get the hazard cell's max granite score from the joined granite zones
        granite_score = max_granite_scores.get(hazard_row_id)
        # make sure the value is not None and not missing
        if granite_score is not None and not pd.isna(granite_score):
            granite_score = int(granite_score)
        else:
            granite_score = 0

        # combine hazard score with granite score
        precaution_result = calculate_potential_heritage_precaution(
            hazard_score,
            granite_score,
        )

        # append the results
        granite_scores.append(granite_score)
        precaution_scores.append(
            precaution_result["potential_heritage_precaution_score"]
        )
        precaution_levels.append(
            None
            if precaution_result["potential_heritage_precaution_level"] is None
            else int(precaution_result["potential_heritage_precaution_level"])
        )

    hazard_data["granite_score"] = granite_scores
    hazard_data["potential_heritage_precaution_score"] = precaution_scores
    hazard_data["potential_heritage_precaution_level"] = precaution_levels

    # remove hazard cells that overlap recorded sites
    recorded_site_mask = hazard_data.geometry.intersects(sites_data.union_all())
    kept_precaution_mask = recorded_site_mask == False
    precaution_data = hazard_data[kept_precaution_mask].copy()
    precaution_data = precaution_data.drop(columns=["hazard_row_id"])

    # Merge neighbouring precaution cells with the same final level so the
    # output looks more like a zone map than a grid.
    precaution_data = precaution_data.dissolve(
        by="potential_heritage_precaution_level",
        aggfunc={
            "hazard_score": "max",
            "hazard_level": "max",
            "granite_score": "max",
            "potential_heritage_precaution_score": "max",
        },
    ).reset_index()

    precaution_data = precaution_data.explode(index_parts=False).reset_index(drop=True)

    output_dir = BACKEND_DIR / "data" / "risk_outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    gpkg_output_path = output_dir / "potential_heritage_precaution.gpkg"
    geojson_output_path = output_dir / "potential_heritage_precaution.geojson"

    precaution_data.to_file(gpkg_output_path, driver="GPKG")
    precaution_data.to_file(geojson_output_path, driver="GeoJSON")

    print(f"Saved to: {gpkg_output_path}")
    print(f"Saved to: {geojson_output_path}")


if __name__ == "__main__":
    main()
