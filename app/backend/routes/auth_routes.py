from flask import Blueprint, abort, g, jsonify, request

from services.auth_service import (
    authenticate_user,
    clear_auth_token,
    create_user,
    find_user_by_email,
    issue_auth_token,
)
from utils.helpers import normalize_email


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    email = normalize_email(payload.get("email", ""))
    password = payload.get("password", "")
    display_name = payload.get("displayName", "").strip()

    if not email or not password or not display_name:
        abort(400, description="Email, password, and display name are required")

    if len(password) < 8:
        abort(400, description="Password must be at least 8 characters long")

    if find_user_by_email(email) is not None:
        abort(400, description="An account with that email already exists")

    user = create_user(email, password, display_name)
    token = issue_auth_token(user)

    return (
        jsonify(
            {
                "message": "Registration successful",
                "token": token,
                "user": user.to_dict(),
            }
        ),
        201,
    )


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = normalize_email(payload.get("email", ""))
    password = payload.get("password", "")

    if not email or not password:
        abort(400, description="Email and password are required")

    user = authenticate_user(email, password)
    if user is None:
        abort(401, description="Invalid email or password")

    if not user.is_active:
        abort(401, description="This account is inactive")

    token = issue_auth_token(user)

    return jsonify(
        {
            "message": "Login successful",
            "token": token,
            "user": user.to_dict(),
        }
    )


@auth_bp.get("/me")
def me():
    # Used by frontend to restore the current logged-in user
    if g.current_user is None:
        abort(401, description="Authentication required")

    return jsonify({"user": g.current_user.to_dict()})


@auth_bp.post("/logout")
def logout():
    if g.current_user is None:
        abort(401, description="Authentication required")

    clear_auth_token(g.current_user)
    return jsonify({"message": "Logout successful"})
