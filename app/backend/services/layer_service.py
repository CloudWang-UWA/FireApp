import json
from pathlib import Path

from flask import abort


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
LAYER_FILES = {
    "site": DATA_DIR / "sites.geojson",
    "granite": DATA_DIR / "granite.geojson",
    "fuel": DATA_DIR / "fuel.geojson",
    "vegetation": DATA_DIR / "vegetation.geojson",
    "slope": DATA_DIR / "slope.geojson",
}


def list_available_layers() -> list[dict]:
    return [
        {
            "name": layer_name,
            "available": file_path.exists(),
            "path": str(file_path.name),
        }
        for layer_name, file_path in LAYER_FILES.items()
    ]


def load_geojson(layer_name: str) -> dict:
    file_path = LAYER_FILES.get(layer_name)
    if file_path is None:
        abort(404, description=f"Unknown layer '{layer_name}'")

    if not file_path.exists():
        abort(404, description=f"GeoJSON file for '{layer_name}' was not found")

    with file_path.open("r", encoding="utf-8") as geojson_file:
        return json.load(geojson_file)
