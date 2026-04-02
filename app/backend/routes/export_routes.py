from flask import Blueprint, jsonify

from services.export_service import get_export_status


export_bp = Blueprint("export", __name__, url_prefix="/api/export")


@export_bp.get("/status")
def export_status():
    return jsonify(get_export_status())
