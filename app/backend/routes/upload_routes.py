from flask import Blueprint, jsonify

from services.upload_service import get_upload_status


upload_bp = Blueprint("upload", __name__, url_prefix="/api/upload")


@upload_bp.get("/status")
def upload_status():
    return jsonify(get_upload_status())
