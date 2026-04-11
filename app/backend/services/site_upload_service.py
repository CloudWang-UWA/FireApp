from models.uploaded_site import UploadedSite
from models.user import db

def get_site_upload_status() -> dict:
    return {
        "ready": False,
        "message": "This module will support upload of newly identified heritage sites and their geometry.",
    }


def validate_uploaded_site_data(site_data: dict) -> dict:
    name = str(site_data.get("name", "")).strip()
    place_type = str(site_data.get("placeType", "")).strip()
    notes = str(site_data.get("notes", "")).strip() or None
    location_source = str(site_data.get("locationSource", "manual")).strip() or "manual"

    if not name:
        raise ValueError("Site name is required")

    if not place_type:
        raise ValueError("Place type is required")

    try:
        latitude = float(site_data.get("latitude"))
    except (TypeError, ValueError):
        raise ValueError("Latitude must be a valid number")

    try:
        longitude = float(site_data.get("longitude"))
    except (TypeError, ValueError):
        raise ValueError("Longitude must be a valid number")

    if latitude < -90 or latitude > 90:
        raise ValueError("Latitude must be between -90 and 90")

    if longitude < -180 or longitude > 180:
        raise ValueError("Longitude must be between -180 and 180")

    if location_source not in {"manual", "device_gps"}:
        raise ValueError("Location source must be 'manual' or 'device_gps'")

    return {
        "name": name,
        "place_type": place_type,
        "notes": notes,
        "latitude": latitude,
        "longitude": longitude,
        "location_source": location_source,
    }


def create_uploaded_site(site_data: dict, user_id: int) -> dict:
    validated_data = validate_uploaded_site_data(site_data)

    uploaded_site = UploadedSite(
        name=validated_data["name"],
        place_type=validated_data["place_type"],
        notes=validated_data["notes"],
        latitude=validated_data["latitude"],
        longitude=validated_data["longitude"],
        location_source=validated_data["location_source"],
        created_by_user_id=user_id,
    )

    db.session.add(uploaded_site)
    db.session.commit()

    return uploaded_site.to_dict()
