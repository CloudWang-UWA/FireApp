import json
from pathlib import Path

from flask import abort

# All GeoJSON / GeoTIFF data is stored under the backend/data folder
DATA_DIR = Path(__file__).resolve().parents[1] / "data"

# Map layer names to their corresponding files
LAYER_FILES = {
    "site": DATA_DIR / "sites.geojson",
    "granite": DATA_DIR / "granite.geojson",
    "fuel": DATA_DIR / "fuel.geojson",
    "vegetation": DATA_DIR / "vegetation.geojson",
    "slope": DATA_DIR / "slope.geojson",
}


def list_available_layers() -> list[dict]:
    # Return basic info for each layer so frontend can decide what to show
    layers = []

    for layer_name, file_path in LAYER_FILES.items():
        layers.append(
            {
                "name": layer_name,
                # Check if the file actually exists locally
                "available": file_path.exists(),
                # Only return filename (not full path) for simplicity
                "path": str(file_path.name),
            }
        )

    return layers


def load_geojson(layer_name: str) -> dict:
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
