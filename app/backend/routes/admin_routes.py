from flask import Blueprint, abort, jsonify, request
from werkzeug.security import generate_password_hash

from models.user import User, db
from services.auth_service import require_admin


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.before_request
def protect_admin_routes():
    # Skip admin check for OPTIONS requests.
    if request.method == "OPTIONS":
        return None

    require_admin()


@admin_bp.get("/pending-users")
def list_pending_users():
    users = db.session.execute(
        db.select(User)
        .where(User.role == "pending", User.is_active.is_(True))
        .order_by(User.created_at.asc())
    ).scalars().all()

    return jsonify({"users": [user.to_dict() for user in users]})


@admin_bp.get("/users")
def list_users():
    users = db.session.execute(
        db.select(User)
        .where(User.is_active.is_(True))
        .order_by(User.created_at.desc())
    ).scalars().all()

    return jsonify({"users": [user.to_dict() for user in users]})


@admin_bp.post("/users/<int:user_id>/approve")
def approve_user(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        abort(404, description="User was not found")

    if user.role == "admin":
        abort(400, description="Admin users do not need approval")

    user.role = "viewer"
    db.session.commit()

    return jsonify({"user": user.to_dict()})


@admin_bp.post("/users/<int:user_id>/reset-password")
def reset_user_password(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        abort(404, description="User was not found")

    if user.role == "admin":
        abort(400, description="Admin passwords cannot be reset from this page")

    payload = request.get_json(silent=True) or {}
    new_password = payload.get("password", "")
    if not isinstance(new_password, str) or len(new_password) < 8:
        abort(400, description="Password must be at least 8 characters")

    user.password_hash = generate_password_hash(new_password)
    user.auth_token = None
    db.session.commit()

    return jsonify({"user": user.to_dict()})


@admin_bp.delete("/users/<int:user_id>")
def reject_user(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        abort(404, description="User was not found")

    if user.role == "admin":
        abort(400, description="Admin users cannot be deleted from this page")

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted"})
