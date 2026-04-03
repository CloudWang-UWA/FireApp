from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    # Simple token-based auth for current demo (stored directly on user)
    auth_token = db.Column(db.String(255), unique=True, nullable=True, index=True)

    # Track when the user was created / last updated
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        # Convert to frontend-friendly format (camelCase keys)
        return {
            "id": self.id,
            "email": self.email,
            "displayName": self.display_name,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat(),
        }
