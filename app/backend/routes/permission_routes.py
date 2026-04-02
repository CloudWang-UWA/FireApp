from flask import Blueprint, jsonify

from services.permission_service import get_permission_status


permission_bp = Blueprint("permissions", __name__, url_prefix="/api/permissions")


@permission_bp.get("/status")
def permission_status():
    return jsonify(get_permission_status())
