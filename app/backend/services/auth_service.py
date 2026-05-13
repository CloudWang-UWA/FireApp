import os
import secrets

from flask import abort, g, request
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash

from models.user import User, db
from utils.helpers import normalize_email


def create_user(
    email: str,
    password: str,
    display_name: str,
    username: str,
    bio: str = "",
    role: str = "pending",
) -> User:
    user = User(
        email=normalize_email(email),
        password_hash=generate_password_hash(password),
        display_name=display_name.strip(),
        username=username.strip(),
        bio=bio.strip() if bio else None,
        role=role,
    )
    db.session.add(user)
    db.session.commit()
    return user


def get_admin_emails() -> set[str]:
    configured_emails = os.getenv("ADMIN_EMAILS", "")
    # Local default for quick demos. Render should set ADMIN_EMAILS.
    if not configured_emails and not os.getenv("DATABASE_URL"):
        configured_emails = "group21@uwa.com"

    return {
        normalize_email(email)
        for email in configured_emails.split(",")
        if normalize_email(email)
    }


def is_admin_email(email: str) -> bool:
    return normalize_email(email) in get_admin_emails()


def sync_admin_role(user: User) -> None:
    # Promote whitelisted emails to admin on login.
    if is_admin_email(user.email) and user.role != "admin":
        user.role = "admin"
        db.session.commit()


def require_admin() -> User:
    if g.current_user is None:
        abort(401, description="Authentication required")

    if g.current_user.role != "admin":
        abort(403, description="Admin access only")

    return g.current_user


def find_user_by_email(email: str) -> User | None:
    normalized_email = normalize_email(email)

    return db.session.execute(
        db.select(User).where(func.lower(User.email) == normalized_email)
    ).scalar_one_or_none()


def find_user_by_username(username: str) -> User | None:
    normalized_username = username.strip().lower()

    return db.session.execute(
        db.select(User).where(func.lower(User.username) == normalized_username)
    ).scalar_one_or_none()


def authenticate_user(email: str, password: str) -> User | None:
    user = find_user_by_email(email)

    if user is None or not check_password_hash(user.password_hash, password):
        return None

    return user


def issue_auth_token(user: User) -> str:
    token = secrets.token_urlsafe(32)
    user.auth_token = token
    db.session.commit()
    return token


def clear_auth_token(user: User) -> None:
    user.auth_token = None
    db.session.commit()


def get_bearer_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    return auth_header.removeprefix("Bearer ").strip() or None


def get_current_user() -> User | None:
    token = get_bearer_token()

    if not token:
        return None

    return db.session.execute(
        db.select(User).where(User.auth_token == token, User.is_active.is_(True))
    ).scalar_one_or_none()
