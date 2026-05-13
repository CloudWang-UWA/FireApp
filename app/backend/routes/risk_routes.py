from flask import Blueprint, jsonify, request

from services.risk.risk_service import get_site_insights
from services.risk.risk_service import get_risk_status


risk_bp = Blueprint("risk", __name__, url_prefix="/api/risk")


@risk_bp.get("/status")
def risk_status():
    return jsonify(get_risk_status())


@risk_bp.get("/site-insights")
def risk_site_insights():
    raw = request.args.get("site_id")
    site_id = raw.strip() if isinstance(raw, str) and raw.strip() else None
    try:
        return jsonify(get_site_insights(site_id=site_id))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
