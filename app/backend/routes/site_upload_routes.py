from flask import Blueprint, abort, g, jsonify, request

from services.site_upload.site_upload_service import (
    create_uploaded_site,
    get_site_upload_status,
    save_uploaded_site_photo,
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
        upload_result = create_uploaded_site(site_data, g.current_user.id)
    except ValueError as error:
        abort(400, description=str(error))

    return jsonify(upload_result), 201


@site_upload_bp.post("/sites/<int:site_id>/photo")
def upload_site_photo(site_id: int):
    if g.current_user is None:
        abort(401, description="Authentication required")

    photo = request.files.get("photo")
    if photo is None:
        abort(400, description="Photo file is required")

    try:
        upload_result = save_uploaded_site_photo(site_id, g.current_user.id, photo)
    except ValueError as error:
        abort(400, description=str(error))

    return jsonify(upload_result), 201
