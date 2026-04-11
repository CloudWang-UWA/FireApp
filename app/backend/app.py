import os

from flask import Flask, g, jsonify
from flask_cors import CORS
from models.user import db
from models.uploaded_site import UploadedSite
from routes.auth_routes import auth_bp
from routes.export_routes import export_bp
from routes.layer_routes import layer_bp
from routes.permission_routes import permission_bp
from routes.risk_routes import risk_bp
from routes.site_upload_routes import site_upload_bp
from services.auth_service import get_current_user
from services.layer_service import LAYER_FILES


app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
SQLITE_PATH = os.path.join(INSTANCE_DIR, "fire_app_demo.db")

# Use a local SQLite file for the demo so the backend can run without extra DB setup.
os.makedirs(INSTANCE_DIR, exist_ok=True)

app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", f"sqlite:///{SQLITE_PATH}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Allow the frontend to call backend APIs during development
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    allow_headers=["Content-Type", "Authorization"],
)

db.init_app(app)


@app.before_request
def load_current_user() -> None:
     # Load the logged-in user once per request so routes can access it through g.
    g.current_user = get_current_user()


@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(404)
def handle_known_errors(error):
    return jsonify({"error": error.description}), error.code


@app.route("/api/test")
def test():
    # Simple endpoint used to confirm that the backend and layer config are loaded.
    return jsonify(
        {
            "message": "backend works",
            "availableLayers": list(LAYER_FILES.keys()),
            "authEnabled": True,
            "databaseConfigured": bool(app.config["SQLALCHEMY_DATABASE_URI"]),
        }
    )
app.register_blueprint(auth_bp)
app.register_blueprint(layer_bp)
app.register_blueprint(risk_bp)
app.register_blueprint(permission_bp)
app.register_blueprint(export_bp)
app.register_blueprint(site_upload_bp)

with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)
