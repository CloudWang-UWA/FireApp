from pathlib import Path
import shutil


BACKEND_DIR = Path(__file__).resolve().parents[2]
SOURCE_DIR = BACKEND_DIR.parent / "data" / "derived" / "analysis_ready"
TARGET_DIR = BACKEND_DIR / "data"

DATA_FILES = [
    "fire_history.geojson",
    "fire_history.gpkg",
    "fuel.json",
    "fuel.png",
    "fuel.tif",
    "granite.geojson",
    "granite.gpkg",
    "sites.geojson",
    "sites.gpkg",
    "slope.json",
    "slope.png",
    "slope.tif",
]


def main() -> None:
    for file_name in DATA_FILES:
        source_path = SOURCE_DIR / file_name
        target_path = TARGET_DIR / file_name
        if source_path.is_file():
            shutil.copy2(source_path, target_path)


if __name__ == "__main__":
    main()
