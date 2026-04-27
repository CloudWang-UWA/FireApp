from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="member")
    username = db.Column(db.String(50), unique=True, nullable=False)
    bio = db.Column(db.String(200), nullable=True)

    is_active = db.Column(db.Boolean, nullable=False, default=True)

    # Token
    auth_token = db.Column(db.String(255), unique=True, nullable=True, index=True)

    # Timestamps
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
        return {
            "id": self.id,
            "email": self.email,
            "displayName": self.display_name,
            "username": self.username,
            "bio": self.bio,
            "role": self.role,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat(),
        }