from flask import Flask, g, jsonify
from flask_cors import CORS
import pytest

from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
    
from models.user import User, db
from routes.admin_routes import admin_bp
from routes.auth_routes import auth_bp
from services.auth_service import get_current_user


@pytest.fixture()
def app(tmp_path):
    test_db_path = tmp_path / "test_auth.db"

    test_app = Flask(__name__)
    test_app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret",
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{test_db_path}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    CORS(
        test_app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    db.init_app(test_app)

    @test_app.before_request
    def before_request_handler():
        g.current_user = get_current_user()

    @test_app.errorhandler(400)
    @test_app.errorhandler(401)
    @test_app.errorhandler(403)
    @test_app.errorhandler(404)
    def handle_known_errors(error):
        return jsonify({"error": error.description}), error.code

    test_app.register_blueprint(auth_bp)
    test_app.register_blueprint(admin_bp)

    with test_app.app_context():
        db.create_all()

    yield test_app

    with test_app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def register_user(
    client,
    email="test@example.com",
    password="password123",
    display_name="Test User",
    username="testuser",
    bio="hello",
):
    return client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "displayName": display_name,
            "username": username,
            "bio": bio,
        },
    )


def login_user(client, email="test@example.com", password="password123"):
    return client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_register_success(client):
    response = register_user(client)

    assert response.status_code == 201
    payload = response.get_json()

    assert payload["message"] == "Registration successful"
    assert payload["token"]
    assert payload["user"]["email"] == "test@example.com"
    assert payload["user"]["username"] == "testuser"
    assert payload["user"]["role"] == "pending"


def test_register_rejects_duplicate_email(client):
    register_user(client)

    response = register_user(
        client,
        email="test@example.com",
        username="differentuser",
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "An account with that email already exists"


def test_register_rejects_duplicate_username(client):
    register_user(client)

    response = register_user(
        client,
        email="different@example.com",
        username="testuser",
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Username already exists"


def test_login_success(client):
    register_user(client)

    response = login_user(client)

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["message"] == "Login successful"
    assert payload["token"]
    assert payload["user"]["email"] == "test@example.com"
    assert payload["user"]["role"] == "pending"


def test_admin_email_gets_admin_role(client, monkeypatch):
    register_user(client, email="admin@example.com")
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")

    response = login_user(client, email="admin@example.com")

    assert response.status_code == 200
    assert response.get_json()["user"]["role"] == "admin"


def test_login_rejects_invalid_credentials(client):
    register_user(client)

    response = login_user(client, password="wrong-password")

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid email or password"


def test_login_rejects_inactive_user(client, app):
    register_user(client)

    with app.app_context():
        user = db.session.execute(
            db.select(User).where(User.email == "test@example.com")
        ).scalar_one()
        user.is_active = False
        db.session.commit()

    response = login_user(client)

    assert response.status_code == 401
    assert response.get_json()["error"] == "This account is inactive"


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.get_json()["error"] == "Authentication required"


def test_me_returns_current_user(client):
    register_user(client)
    login_response = login_user(client)
    token = login_response.get_json()["token"]

    response = client.get("/api/auth/me", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["user"]["email"] == "test@example.com"
    assert payload["user"]["username"] == "testuser"


def test_logout_clears_auth_token(client):
    register_user(client)
    login_response = login_user(client)
    token = login_response.get_json()["token"]

    logout_response = client.post("/api/auth/logout", headers=auth_headers(token))
    assert logout_response.status_code == 200
    assert logout_response.get_json()["message"] == "Logout successful"

    me_response = client.get("/api/auth/me", headers=auth_headers(token))
    assert me_response.status_code == 401
    assert me_response.get_json()["error"] == "Authentication required"


def test_admin_only_rejects_pending_user(client):
    register_user(client)
    login_response = login_user(client)
    token = login_response.get_json()["token"]

    response = client.get("/api/auth/admin-only", headers=auth_headers(token))

    assert response.status_code == 403
    assert response.get_json()["error"] == "Admin access only"


def test_admin_only_allows_admin(client, app):
    register_user(client)

    with app.app_context():
        user = db.session.execute(
            db.select(User).where(User.email == "test@example.com")
        ).scalar_one()
        user.role = "admin"
        db.session.commit()

    login_response = login_user(client)
    token = login_response.get_json()["token"]

    response = client.get("/api/auth/admin-only", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["message"] == "Welcome Admin!"
    assert payload["role"] == "admin"


def test_admin_approves_pending_user(client, app):
    register_user(client, email="admin@example.com", username="adminuser")
    register_user(client, email="pending@example.com", username="pendinguser")

    with app.app_context():
        admin = db.session.execute(
            db.select(User).where(User.email == "admin@example.com")
        ).scalar_one()
        pending = db.session.execute(
            db.select(User).where(User.email == "pending@example.com")
        ).scalar_one()
        admin.role = "admin"
        db.session.commit()
        pending_id = pending.id

    login_response = login_user(client, email="admin@example.com")
    token = login_response.get_json()["token"]

    list_response = client.get(
        "/api/admin/pending-users",
        headers=auth_headers(token),
    )
    assert list_response.status_code == 200
    pending_emails = {user["email"] for user in list_response.get_json()["users"]}
    assert "pending@example.com" in pending_emails

    approve_response = client.post(
        f"/api/admin/users/{pending_id}/approve",
        headers=auth_headers(token),
    )
    assert approve_response.status_code == 200
    assert approve_response.get_json()["user"]["role"] == "viewer"
