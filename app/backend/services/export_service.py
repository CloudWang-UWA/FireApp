from datetime import datetime
from io import BytesIO
from pathlib import Path

import geopandas as gpd
import pandas as pd
from flask import abort
from shapely.geometry import box


BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_DIR / "data"
RISK_OUTPUT_DIR = DATA_DIR / "risk_outputs"

EXPORT_LAYER_FILES = {
    "site": DATA_DIR / "sites.geojson",
    "granite": DATA_DIR / "granite.geojson",
    "fire_history": DATA_DIR / "fire_history.geojson",
    # These can be used later if the risk module outputs are available.
    "recorded_site_priority": RISK_OUTPUT_DIR / "recorded_site_priority.geojson",
    "precaution_zone": RISK_OUTPUT_DIR / "precaution_zone.geojson",
}


def get_export_status() -> dict:
    available_layers = [
        layer_name
        for layer_name, file_path in EXPORT_LAYER_FILES.items()
        if file_path.exists()
    ]

    return {
        "ready": True,
        "message": "Export is available for selected map records within the current map area.",
        "formats": ["csv", "xlsx"],
        "supportedLayers": available_layers,
    }


def create_export_download(
    layer_name: str,
    export_format: str,
    bounds: dict,
) -> tuple[BytesIO, str, str]:
    layer_path = EXPORT_LAYER_FILES.get(layer_name)

    if layer_path is None:
        abort(404, description=f"Unknown export layer '{layer_name}'")

    if not layer_path.exists():
        abort(404, description=f"Export layer '{layer_name}' is not available")

    if export_format not in {"csv", "xlsx"}:
        abort(400, description="format must be csv or xlsx")

    layer_data = gpd.read_file(layer_path)

    if layer_data.empty:
        return _build_download(
            export_rows=pd.DataFrame(),
            layer_name=layer_name,
            export_format=export_format,
        )

    # Make sure map-bound filtering uses the same lon/lat CRS as the frontend.
    if layer_data.crs is not None and str(layer_data.crs) != "EPSG:4326":
        layer_data = layer_data.to_crs(4326)

    selection_bounds = box(
        bounds["west"],
        bounds["south"],
        bounds["east"],
        bounds["north"],
    )

    selected_rows = layer_data[layer_data.geometry.intersects(selection_bounds)].copy()

    export_rows = _prepare_export_rows(selected_rows)

    return _build_download(
        export_rows=export_rows,
        layer_name=layer_name,
        export_format=export_format,
    )


def _prepare_export_rows(layer_data: gpd.GeoDataFrame) -> pd.DataFrame:
    if layer_data.empty:
        return pd.DataFrame()

    export_rows = pd.DataFrame(layer_data.drop(columns=["geometry"]))

    representative_points = layer_data.geometry.representative_point()

    export_rows["geometry_type"] = layer_data.geometry.geom_type
    export_rows["longitude"] = representative_points.x.round(6)
    export_rows["latitude"] = representative_points.y.round(6)
    export_rows["geometry_wkt"] = layer_data.geometry.to_wkt()

    return export_rows


def _build_download(
    export_rows: pd.DataFrame,
    layer_name: str,
    export_format: str,
) -> tuple[BytesIO, str, str]:
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = f"{layer_name}-export-{timestamp}.{export_format}"
    file_bytes = BytesIO()

    if export_format == "csv":
        export_rows.to_csv(file_bytes, index=False)
        mimetype = "text/csv"
    else:
        with pd.ExcelWriter(file_bytes, engine="openpyxl") as writer:
            export_rows.to_excel(writer, index=False, sheet_name="export")
        mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    file_bytes.seek(0)
    return file_bytes, mimetype, filename