from flask import Blueprint, abort, jsonify, request, send_file

from services.export_service import create_export_download, get_export_status


export_bp = Blueprint("export", __name__, url_prefix="/api/export")


@export_bp.get("/status")
def export_status():
    return jsonify(get_export_status())


@export_bp.post("/download")
def export_download():
    payload = request.get_json(silent=True) or {}

    layer_name = str(payload.get("layerName", "")).strip()
    export_format = str(payload.get("format", "csv")).strip().lower()
    bounds = payload.get("bounds") or {}

    if not layer_name:
        abort(400, description="layerName is required")

    if export_format not in {"csv", "xlsx"}:
        abort(400, description="format must be csv or xlsx")

    if not isinstance(bounds, dict):
        abort(400, description="bounds must be an object")

    required_keys = {"north", "south", "east", "west"}
    if not required_keys.issubset(bounds.keys()):
        abort(400, description="bounds must include north, south, east, and west")

    try:
        normalized_bounds = {
            "north": float(bounds["north"]),
            "south": float(bounds["south"]),
            "east": float(bounds["east"]),
            "west": float(bounds["west"]),
        }
    except (TypeError, ValueError):
        abort(400, description="bounds values must be numeric")

    file_bytes, mimetype, filename = create_export_download(
        layer_name=layer_name,
        export_format=export_format,
        bounds=normalized_bounds,
    )

    return send_file(
        file_bytes,
        mimetype=mimetype,
        as_attachment=True,
        download_name=filename,
    )