from datetime import datetime, timezone

from models.user import db

# stores uploaded sites
class UploadedSite(db.Model):
    __tablename__ = "uploaded_sites"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    place_type = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.Text, nullable=True)

    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    # For the MVP, we treat all new sites as squares for simplicity
    site_size_m = db.Column(db.Float, nullable=False, default=350.0)

    location_source = db.Column(db.String(50), nullable=False, default="manual")
    status = db.Column(db.String(50), nullable=False, default="submitted")

    # below is risk information
    inside_study_area = db.Column(db.Boolean, nullable=False, default=False)

    fuel_code = db.Column(db.Integer, nullable=True)
    slope_deg = db.Column(db.Float, nullable=True)
    fire_year = db.Column(db.Integer, nullable=True)
    fire_type = db.Column(db.String(20), nullable=True)

    hazard_score = db.Column(db.Integer, nullable=True)
    hazard_level = db.Column(db.String(50), nullable=True)

    site_vulnerability_score = db.Column(db.Integer, nullable=True)

    site_priority_score = db.Column(db.Float, nullable=True)
    site_priority_level = db.Column(db.String(50), nullable=True)

    created_by_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

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

    created_by = db.relationship("User", backref="uploaded_sites")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "placeType": self.place_type,
            "notes": self.notes,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "siteSizeM": self.site_size_m,
            "locationSource": self.location_source,
            "status": self.status,
            "createdByUserId": self.created_by_user_id,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "insideStudyArea": self.inside_study_area,
            "fuelCode": self.fuel_code,
            "slopeDeg": self.slope_deg,
            "fireYear": self.fire_year,
            "fireType": self.fire_type,
            "hazardScore": self.hazard_score,
            "hazardLevel": self.hazard_level,
            "siteVulnerabilityScore": self.site_vulnerability_score,
            "sitePriorityScore": self.site_priority_score,
            "sitePriorityLevel": self.site_priority_level
        }