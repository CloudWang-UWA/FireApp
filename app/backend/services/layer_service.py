import json
from pathlib import Path
from io import BytesIO

from models.uploaded_site import UploadedSite
from models.user import db

from flask import abort

# All GeoJSON / GeoTIFF data is stored under the backend/data folder
DATA_DIR = Path(__file__).resolve().parents[1] / "data"

# Map layer names to their corresponding files
LAYER_FILES = {
    "recorded_site_priority": DATA_DIR / "risk_outputs" / "recorded_site_priority.geojson",
    "precaution_zone": DATA_DIR / "risk_outputs" / "precaution_zone.geojson",
    "granite": DATA_DIR / "granite.geojson",
    "fire_history": DATA_DIR / "fire_history.geojson",
}

RASTER_FILES = {
    "fuel": DATA_DIR / "fuel.tif",
    "slope": DATA_DIR / "slope.tif",
}

RASTER_METADATA_FILES = {
    "fuel": DATA_DIR / "fuel.json",
    "slope": DATA_DIR / "slope.json",
}

RASTER_IMAGE_FILES = {
    "fuel": DATA_DIR / "fuel.png",
    "slope": DATA_DIR / "slope.png",
}


def list_available_layers() -> list[dict]:
    # Return basic info for each layer so frontend can decide what to show
    layers = []

    for layer_name, file_path in LAYER_FILES.items():
        layers.append(
            {
                "name": layer_name,
                "type": "geojson",
                # Check if the file actually exists locally
                "available": file_path.exists(),
                # Only return filename (not full path) for simplicity
                "path": str(file_path.name),
            }
        )

    for layer_name, file_path in RASTER_METADATA_FILES.items():
        layers.append(
            {
                "name": layer_name,
                "type": "image_overlay",
                "available": file_path.exists(),
                "path": str(file_path.name),
            }
        )

    layers.append(
        {
            "name": "uploaded-sites",
            "type": "geojson",
            "available": True,
            "path": "database",
        }
    )

    return layers


def load_map_layer(layer_name: str) -> dict:
    file_path = LAYER_FILES.get(layer_name)

    if file_path is None:
        # Layer name not recognised
        abort(404, description=f"Unknown layer '{layer_name}'")

    if not file_path.exists():
        # File is expected but missing (e.g. not downloaded yet)
        abort(404, description=f"GeoJSON file for '{layer_name}' was not found")

    # Load GeoJSON content and return as dict
    with file_path.open("r", encoding="utf-8") as geojson_file:
        return json.load(geojson_file)


def get_raster_overlay_info(layer_name: str) -> dict:
    # Return frontend overlay metadata, including bounds and the PNG URL.
    metadata_path = RASTER_METADATA_FILES.get(layer_name)
    png_path = RASTER_IMAGE_FILES.get(layer_name)

    if metadata_path is None or png_path is None:
        abort(404, description=f"Unknown raster layer '{layer_name}'")

    if not metadata_path.exists():
        abort(404, description=f"Overlay metadata for '{layer_name}' was not found")

    if not png_path.exists():
        abort(404, description=f"Overlay image for '{layer_name}' was not found")

    with metadata_path.open("r", encoding="utf-8") as metadata_file:
        metadata = json.load(metadata_file)

    return {
        "name": layer_name,
        "type": "image_overlay",
        "image_url": f"/api/layers/{layer_name}/image",
        "bounds": metadata["bounds"],
    }


def get_raster_overlay_image(layer_name: str) -> tuple[BytesIO, str]:
    # Return the pre-rendered PNG image used by the raster overlay.
    png_path = RASTER_IMAGE_FILES.get(layer_name)

    if png_path is None:
        abort(404, description=f"Unknown raster layer '{layer_name}'")

    if not png_path.exists():
        abort(404, description=f"Overlay image for '{layer_name}' was not found")

    image_bytes = BytesIO(png_path.read_bytes())
    image_bytes.seek(0)
    return image_bytes, "image/png"
    

def load_uploaded_sites() -> dict:
    uploaded_sites = db.session.execute(
        db.select(UploadedSite).order_by(UploadedSite.id.asc())
    ).scalars().all()

    features = []

    for site in uploaded_sites:
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [site.longitude, site.latitude],
                },
                "properties": {
                    "id": site.id,
                    "name": site.name,
                    "place_type": site.place_type,
                    "notes": site.notes,
                    "status": site.status,
                    "inside_study_area": site.inside_study_area,
                    "hazard_score": site.hazard_score,
                    "hazard_level": site.hazard_level,
                    "site_vulnerability_score": site.site_vulnerability_score,
                    "site_priority_score": site.site_priority_score,
                    "site_priority_level": site.site_priority_level,
                    "created_by_user_id": site.created_by_user_id,
                },
            }
        )

    return {
        "type": "FeatureCollection",
        "features": features,
    }
