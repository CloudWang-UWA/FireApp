from models.uploaded_site import UploadedSite
from models.user import db
from services.site_upload.uploaded_site_risk_cal import calculate_uploaded_site_risk

# current study area
STUDY_AREA_MIN_LON = 117.18
STUDY_AREA_MAX_LON = 118.58
STUDY_AREA_MIN_LAT = -35.32
STUDY_AREA_MAX_LAT = -34.22


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

    try:
        site_size_m = float(site_data.get("siteSizeM", 350))
    except (TypeError, ValueError):
        raise ValueError("Site size must be a valid number")

    if site_size_m <= 0:
        raise ValueError("Site size must be greater than 0")

    if location_source not in {"manual", "device_gps"}:
        raise ValueError("Location source must be 'manual' or 'device_gps'")

    return {
        "name": name,
        "place_type": place_type,
        "notes": notes,
        "latitude": latitude,
        "longitude": longitude,
        "site_size_m": site_size_m,
        "location_source": location_source,
    }


def is_inside_study_area(latitude: float, longitude: float) -> bool:
    return (
        STUDY_AREA_MIN_LON <= longitude <= STUDY_AREA_MAX_LON
        and STUDY_AREA_MIN_LAT <= latitude <= STUDY_AREA_MAX_LAT
    )


def create_uploaded_site(site_data: dict, user_id: int) -> dict:
    validated_data = validate_uploaded_site_data(site_data)

    # check whether the uploaded site is inside the study area
    inside_study_area = is_inside_study_area(
        validated_data["latitude"],
        validated_data["longitude"],
    )

    uploaded_site = UploadedSite(
        name=validated_data["name"],
        place_type=validated_data["place_type"],
        notes=validated_data["notes"],
        latitude=validated_data["latitude"],
        longitude=validated_data["longitude"],
        site_size_m=validated_data["site_size_m"],
        location_source=validated_data["location_source"],
        created_by_user_id=user_id,
    )

    is_risk_available = False
    warning_message = None
    uploaded_site.inside_study_area = inside_study_area

    if inside_study_area:
        site_risk = calculate_uploaded_site_risk(
            validated_data["place_type"],
            validated_data["latitude"],
            validated_data["longitude"],
            validated_data["site_size_m"],
        )

        hazard_result = site_risk["hazard"]
        priority_result = site_risk["sitePriority"]
        has_calculated_risk = (
            hazard_result["hazard_score"] is not None
            and hazard_result["hazard_level"] is not None
            and priority_result["site_priority_score"] is not None
            and priority_result["site_priority_level"] is not None
        )

        if has_calculated_risk:
            uploaded_site.hazard_score = hazard_result["hazard_score"]
            uploaded_site.hazard_level = hazard_result["hazard_level"]
            uploaded_site.fuel_code = hazard_result.get("fuel_code")
            uploaded_site.slope_deg = hazard_result.get("slope_deg")
            uploaded_site.fire_year = hazard_result.get("fire_year")
            uploaded_site.fire_type = hazard_result.get("fire_type")

            uploaded_site.site_vulnerability_score = site_risk["siteVulnerability"][
                "site_vulnerability_score"
            ]

            uploaded_site.site_priority_score = priority_result["site_priority_score"]
            uploaded_site.site_priority_level = priority_result["site_priority_level"]
            is_risk_available = True
        else:
            warning_message = (
                "Risk could not be calculated for this site location because "
                "no valid environmental data was available."
            )
    else:
        warning_message = (
            "This site is outside the current study area, so risk was not calculated."
        )

    db.session.add(uploaded_site)
    db.session.commit()

    return {
        "site": uploaded_site.to_dict(),
        "insideStudyArea": inside_study_area,
        "riskAvailable": is_risk_available,
        "outOfAreaWarning": warning_message,
    }
