import json
from datetime import datetime, timezone
from pathlib import Path

from .config import EXCLUDED_SITE_IDS
from .config import FIRE_TYPE_CODES
from .config import GRANITE_DISTANCE_SCORE_BANDS
from .config import HAZARD_PROGRESS_STEP
from .config import INTEGRATED_PRIORITY_BANDS
from .config import RECORDED_SITE_HAZARD_AGGREGATION


BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / "data"
RISK_OUTPUT_DIR = DATA_DIR / "risk_outputs"
MANIFEST_PATH = RISK_OUTPUT_DIR / "manifest.json"
MODEL_NAME = "current_demo_model"
SOURCE_INPUT_FILES = [
    DATA_DIR / "sites.gpkg",
    DATA_DIR / "granite.gpkg",
    DATA_DIR / "fire_history.gpkg",
    DATA_DIR / "fuel.tif",
    DATA_DIR / "slope.tif",
]


def _to_relative_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(BACKEND_DIR.resolve()))
    except ValueError:
        return str(path)


def _serialize_value(value):
    if isinstance(value, dict):
        return {str(key): _serialize_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize_value(item) for item in value]
    if hasattr(value, "value"):
        return value.value
    return value


def get_config_snapshot() -> dict:
    return {
        "excluded_site_ids": sorted(EXCLUDED_SITE_IDS),
        "recorded_site_hazard_aggregation": RECORDED_SITE_HAZARD_AGGREGATION,
        "fire_type_codes": _serialize_value(FIRE_TYPE_CODES),
        "granite_distance_score_bands": _serialize_value(GRANITE_DISTANCE_SCORE_BANDS),
        "integrated_priority_bands": _serialize_value(INTEGRATED_PRIORITY_BANDS),
        "hazard_progress_step": HAZARD_PROGRESS_STEP,
    }


def update_risk_manifest(
    output_name: str,
    generated_files: list[Path],
    source_files: list[Path],
    stage: str | None = None,
    notes: list[str] | None = None,
) -> None:
    RISK_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    else:
        manifest = {
            "model_name": MODEL_NAME,
            "updated_at": None,
            "config": get_config_snapshot(),
            "source_inputs": {
                "produced_by": "data_processing_module",
                "files": [_to_relative_path(path) for path in SOURCE_INPUT_FILES],
            },
            "generated_outputs": {
                "produced_by": "risk_module",
                "files": [],
            },
            "outputs": {},
        }

    generated_at = datetime.now(timezone.utc).isoformat()
    manifest["model_name"] = MODEL_NAME
    manifest["updated_at"] = generated_at
    manifest["config"] = get_config_snapshot()
    manifest["source_inputs"] = {
        "produced_by": "data_processing_module",
        "files": [_to_relative_path(path) for path in SOURCE_INPUT_FILES],
    }
    manifest["outputs"][output_name] = {
        "stage": stage or output_name,
        "generated_at": generated_at,
        "generated_files": [_to_relative_path(path) for path in generated_files],
        "source_files": [_to_relative_path(path) for path in source_files],
        "notes": notes or [],
    }
    generated_output_files = sorted(
        {
            generated_file
            for output in manifest["outputs"].values()
            for generated_file in output.get("generated_files", [])
        }
    )
    manifest["generated_outputs"] = {
        "produced_by": "risk_module",
        "files": generated_output_files,
    }

    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding="utf-8",
    )


def require_files(paths: list[Path]) -> None:
    missing_paths = [path for path in paths if not path.exists()]
    if not missing_paths:
        return

    missing_list = ", ".join(_to_relative_path(path) for path in missing_paths)
    raise FileNotFoundError(f"Required input files are missing: {missing_list}")
