import os

from flask import Flask, g, jsonify
from flask_cors import CORS
from models.user import db
from models.uploaded_site import UploadedSite
from sqlalchemy import inspect, text
from routes.admin_routes import admin_bp
from routes.auth_routes import auth_bp
from routes.export_routes import export_bp
from routes.layer_routes import layer_bp
from routes.permission_routes import permission_bp
from routes.risk_routes import risk_bp
from routes.site_upload_routes import site_upload_bp
from services.auth_service import get_current_user
from services.layer_service import LAYER_FILES


app = Flask(__name__)

# =========================
# PATH SETUP
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
SQLITE_PATH = os.path.join(INSTANCE_DIR, "fire_app_demo.db")

os.makedirs(INSTANCE_DIR, exist_ok=True)

# =========================
# CONFIG
# =========================
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", f"sqlite:///{SQLITE_PATH}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

# =========================
# ✅ CORS (SIMPLE & WORKING)
# =========================
CORS(
    app,
    resources={r"/api/*": {"origins": allowed_origins}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)

# =========================
# INIT DB
# =========================
db.init_app(app)

def ensure_uploaded_site_schema() -> None:
    # Backfill missing photo columns for older databases.
    inspector = inspect(db.engine)
    if "uploaded_sites" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("uploaded_sites")
    }
    missing_columns = {
        "photo_path": "ALTER TABLE uploaded_sites ADD COLUMN photo_path VARCHAR(512)",
        "photo_filename": "ALTER TABLE uploaded_sites ADD COLUMN photo_filename VARCHAR(255)",
        "photo_content_type": "ALTER TABLE uploaded_sites ADD COLUMN photo_content_type VARCHAR(100)",
    }

    for column_name, ddl in missing_columns.items():
        if column_name not in existing_columns:
            db.session.execute(text(ddl))

    db.session.commit()

# =========================
# BEFORE REQUEST
# =========================
@app.before_request
def before_request_handler():
    g.current_user = get_current_user()

# =========================
# ERROR HANDLING
# =========================
@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
def handle_known_errors(error):
    return jsonify({"error": error.description}), error.code

@app.after_request
def handle_cors(response):
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

# =========================
# TEST ROUTE
# =========================
@app.route("/api/test")
def test():
    return jsonify(
        {
            "message": "backend works",
            "availableLayers": list(LAYER_FILES.keys()),
            "authEnabled": True,
            "databaseConfigured": bool(app.config["SQLALCHEMY_DATABASE_URI"]),
        }
    )

# =========================
# REGISTER ROUTES
# =========================
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(layer_bp)
app.register_blueprint(risk_bp)
app.register_blueprint(permission_bp)
app.register_blueprint(export_bp)
app.register_blueprint(site_upload_bp)

# =========================
# CREATE DB TABLES
# =========================
with app.app_context():
    db.create_all()
    ensure_uploaded_site_schema()

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(debug=True, port=port)
