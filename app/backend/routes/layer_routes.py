from flask import Blueprint, jsonify, send_file

from services.layer_service import (
    get_raster_overlay_image,
    get_raster_overlay_info,
    list_available_layers,
    load_map_layer,
    load_uploaded_sites,
)

layer_bp = Blueprint("layers", __name__, url_prefix="/api/layers")


@layer_bp.get("")
def list_layers():
    return jsonify({"layers": list_available_layers()})


@layer_bp.get("/uploaded-sites")
def uploaded_sites_layer():
    return jsonify(load_uploaded_sites())


@layer_bp.get("/<layer_name>")
def get_layer(layer_name: str):
    return jsonify(load_map_layer(layer_name))


@layer_bp.get("/<layer_name>/overlay")
def get_raster_overlay(layer_name: str):
    return jsonify(get_raster_overlay_info(layer_name))


@layer_bp.get("/<layer_name>/image")
def get_raster_image(layer_name: str):
    image_bytes, mimetype = get_raster_overlay_image(layer_name)
    return send_file(image_bytes, mimetype=mimetype)
