from flask import Blueprint, abort, g, jsonify, request

from services.site_upload_service import (
    create_uploaded_site,
    get_site_upload_status,
)

site_upload_bp = Blueprint("site_upload", __name__, url_prefix="/api/site-upload")


@site_upload_bp.get("/status")
def site_upload_status():
    return jsonify(get_site_upload_status())


@site_upload_bp.post("/sites")
def create_site_upload():
    if g.current_user is None:
        abort(401, description="Authentication required")

    site_data = request.get_json(silent=True) or {}

    try:
        uploaded_site = create_uploaded_site(site_data, g.current_user.id)
    except ValueError as error:
        abort(400, description=str(error))

    return jsonify({"site": uploaded_site}), 201

