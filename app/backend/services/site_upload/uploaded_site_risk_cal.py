from services.risk.risk_model import (
    calculate_hazard,
    calculate_site_priority,
    calculate_site_vulnerability,
)

from services.risk.site_hazard import get_site_hazard_info


def get_uploaded_site_hazard_info(
    latitude: float, longitude: float, site_size_m: float
) -> dict:
    return get_site_hazard_info(longitude, latitude)


def calculate_uploaded_site_risk(
    place_type: str, latitude: float, longitude: float, site_size_m: float
) -> dict:
    hazard_inputs = get_uploaded_site_hazard_info(latitude, longitude, site_size_m)

    hazard_result = calculate_hazard(
        hazard_inputs["fuel_code"],
        hazard_inputs["slope_deg"],
        hazard_inputs["fire_year"],
        hazard_inputs["fire_type"],
    )

    site_vulnerability_result = calculate_site_vulnerability(place_type)

    priority_result = calculate_site_priority(
        hazard_result["hazard_score"],
        site_vulnerability_result["site_vulnerability_score"],
    )

    return {
        "hazardInputs": hazard_inputs,
        "hazard": hazard_result,
        "siteVulnerability": site_vulnerability_result,
        "sitePriority": priority_result,
    }
