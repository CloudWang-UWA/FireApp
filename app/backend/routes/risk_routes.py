from flask import Blueprint, jsonify

from app.backend.services.risk.risk_service import get_risk_status


risk_bp = Blueprint("risk", __name__, url_prefix="/api/risk")


@risk_bp.get("/status")
def risk_status():
    return jsonify(get_risk_status())
