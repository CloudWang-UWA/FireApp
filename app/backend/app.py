import os

from flask import Flask, g, jsonify
from flask_cors import CORS
from models.user import db
from routes.auth_routes import auth_bp
from routes.export_routes import export_bp
from routes.layer_routes import layer_bp
from routes.permission_routes import permission_bp
from routes.risk_routes import risk_bp
from routes.upload_routes import upload_bp
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

# =========================
# ✅ CORS (SIMPLE & WORKING)
# =========================
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)

# =========================
# INIT DB
# =========================
db.init_app(app)

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
    response.headers["Access-Control-Allow-Origin"] = "*"
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
app.register_blueprint(layer_bp)
app.register_blueprint(risk_bp)
app.register_blueprint(permission_bp)
app.register_blueprint(export_bp)
app.register_blueprint(upload_bp)

# =========================
# CREATE DB TABLES
# =========================
with app.app_context():
    db.create_all()

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(debug=True, port=port)