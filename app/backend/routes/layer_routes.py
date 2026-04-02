from flask import Blueprint, jsonify

from services.layer_service import list_available_layers, load_geojson


layer_bp = Blueprint("layers", __name__, url_prefix="/api/layers")


@layer_bp.get("")
def list_layers():
    return jsonify({"layers": list_available_layers()})


@layer_bp.get("/<layer_name>")
def get_layer(layer_name: str):
    return jsonify(load_geojson(layer_name))
