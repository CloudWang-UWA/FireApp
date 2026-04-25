from flask import Blueprint, abort, g, jsonify, request

from services.auth_service import (
    authenticate_user,
    clear_auth_token,
    create_user,
    find_user_by_email,
    find_user_by_username,
    issue_auth_token,
)
from utils.helpers import normalize_email


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# =========================
# REGISTER
# =========================
@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}

    email = normalize_email(payload.get("email", ""))
    password = payload.get("password", "")
    display_name = payload.get("displayName", "").strip()
    username = payload.get("username", "").strip()
    bio = payload.get("bio", "").strip()

    # Validation
    if not email or not password or not display_name or not username:
        abort(400, description="Email, password, display name, and username are required")

    if len(password) < 8:
        abort(400, description="Password must be at least 8 characters long")

    if find_user_by_email(email) is not None:
        abort(400, description="An account with that email already exists")

    if find_user_by_username(username) is not None:
        abort(400, description="Username already exists")

    # Always register as MEMBER (never allow frontend to choose admin)
    user = create_user(
        email,
        password,
        display_name,
        username,
        bio,
        role="member"
    )

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


# =========================
# LOGIN
# =========================
@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}

    email = normalize_email(payload.get("email", ""))
    password = payload.get("password", "")

    print("LOGIN ATTEMPT:", email)

    if not email or not password:
        abort(400, description="Email and password are required")

    user = authenticate_user(email, password)

    print("USER FOUND:", user)

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


# =========================
# CURRENT USER
# =========================
@auth_bp.get("/me")
def me():
    if g.current_user is None:
        abort(401, description="Authentication required")

    return jsonify({"user": g.current_user.to_dict()})


# =========================
# LOGOUT
# =========================
@auth_bp.post("/logout")
def logout():
    if g.current_user is None:
        abort(401, description="Authentication required")

    clear_auth_token(g.current_user)
    return jsonify({"message": "Logout successful"})


# =========================
# ADMIN ONLY ROUTE (RBAC)
# =========================
@auth_bp.get("/admin-only")
def admin_only():
    if g.current_user is None:
        abort(401, description="Login required")

    if g.current_user.role != "admin":
        abort(403, description="Admin access only")

    return jsonify({
        "message": "Welcome Admin!",
        "role": g.current_user.role
    })