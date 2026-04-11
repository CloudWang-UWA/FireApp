from flask import Blueprint, jsonify

from services.site_upload_service import get_site_upload_status


site_upload_bp = Blueprint("site_upload", __name__, url_prefix="/api/site-upload")


@site_upload_bp.get("/status")
def site_upload_status():
    return jsonify(get_site_upload_status())
