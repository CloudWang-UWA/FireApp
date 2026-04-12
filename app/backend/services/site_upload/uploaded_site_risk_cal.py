from services.risk.risk_model import calculate_site_priority
from services.risk.risk_model import calculate_site_vulnerability
from services.risk.site_hazard import build_square_site
from services.risk.site_hazard import get_site_hazard_by_shape


def calculate_uploaded_site_risk(
    place_type: str, latitude: float, longitude: float, site_size_m: float
) -> dict:
    site_shape = build_square_site(longitude, latitude, site_size_m)
    hazard_result = get_site_hazard_by_shape(site_shape)

    site_vulnerability_result = calculate_site_vulnerability(place_type)

    priority_result = calculate_site_priority(
        hazard_result["hazard_score"],
        site_vulnerability_result["site_vulnerability_score"],
    )

    return {
        "hazard": hazard_result,
        "siteVulnerability": site_vulnerability_result,
        "sitePriority": priority_result,
    }
