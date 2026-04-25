from pathlib import Path
import sys

import geopandas as gpd

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from services.risk.load_processed_data import load_granite_data
from services.risk.metadata import update_risk_manifest


def main() -> None:
    granite_data = load_granite_data()

    # Need to convert to metres to calculate distance.
    projected_crs = granite_data.estimate_utm_crs()
    granite_projected = granite_data.to_crs(projected_crs)

    granite_area = granite_projected.geometry.union_all()
    medium_zone = granite_area.buffer(100).difference(granite_area)
    low_zone = granite_area.buffer(250).difference(granite_area.buffer(100))

    # Build three simple granite influence zones:
    # on granite = high, within 100 m = medium, within 250 m = low.
    influence_layer = gpd.GeoDataFrame(
        {
            "zone": ["on_granite", "within_100m", "within_250m"],
            "distance_band": ["0 m", "0-100 m", "100-250 m"],
            "granite_score": [3, 2, 1],
            "geometry": [granite_area, medium_zone, low_zone],
        },
        crs=projected_crs,
    ).to_crs(granite_data.crs)

    output_dir = BACKEND_DIR / "data" / "risk_outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    gpkg_output_path = output_dir / "granite_influence.gpkg"
    geojson_output_path = output_dir / "granite_influence.geojson"

    influence_layer.to_file(gpkg_output_path, driver="GPKG")
    influence_layer.to_crs(4326).to_file(geojson_output_path, driver="GeoJSON")
    update_risk_manifest(
        output_name="granite_influence",
        stage="granite_influence",
        generated_files=[gpkg_output_path, geojson_output_path],
        source_files=[BACKEND_DIR / "data" / "granite.gpkg"],
        notes=[
            "Granite influence shows how close a place is to granite, which may indicate nearby heritage areas: on granite = high, within 100 m = medium, and 100-250 m = low."
        ],
    )

    print(f"Saved to: {gpkg_output_path}")
    print(f"Saved to: {geojson_output_path}")


if __name__ == "__main__":
    main()
