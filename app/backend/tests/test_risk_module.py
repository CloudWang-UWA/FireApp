import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
# Allow the test file to import backend services when run from the repo root.
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.risk.lookups import FireHistoryScore
from services.risk.lookups import GraniteScore
from services.risk.lookups import HazardLevel
from services.risk.lookups import IntegratedPriorityLevel
from services.risk.lookups import SiteVulnerabilityScore
from services.risk.risk_model import calculate_hazard
from services.risk.risk_model import calculate_precaution_zone
from services.risk.risk_model import calculate_recorded_site_priority
from services.risk.risk_model import calculate_site_vulnerability
from services.risk.scoring import get_fire_history_score
from services.risk.scoring import get_granite_score
from services.risk.scoring import get_hazard_level
from services.risk.scoring import get_integrated_priority_level
from services.risk.scoring import get_precaution_zone_score
from services.risk.scoring import get_recorded_site_priority_score
from services.risk.scoring import get_site_vulnerability_score
from services.risk.scoring import normalize_granite_score
from services.risk.scoring import normalize_hazard_score
from services.risk.scoring import normalize_site_vulnerability_score


class SiteVulnerabilityTests(unittest.TestCase):
    def test_place_type_alias_maps_to_expected_score(self):
        score = get_site_vulnerability_score("Plant Res")
        self.assertEqual(score, SiteVulnerabilityScore.HIGH)

    def test_multiple_place_types_use_highest_score(self):
        score = get_site_vulnerability_score(
            "Artefacts / Scatter; Traditional Structure"
        )
        self.assertEqual(score, SiteVulnerabilityScore.HIGH)

    def test_site_vulnerability_model_returns_named_field(self):
        result = calculate_site_vulnerability("Artefacts / Scatter")
        self.assertEqual(
            result["site_vulnerability_score"],
            SiteVulnerabilityScore.MEDIUM,
        )


class HazardTests(unittest.TestCase):
    def test_recent_prescribed_burn_reduces_fire_history_score(self):
        score = get_fire_history_score(2024, "PB")
        self.assertEqual(score, FireHistoryScore.RECENT_FIRE)

    def test_recent_wildfire_does_not_reduce_fire_history_score(self):
        score = get_fire_history_score(2024, "WF")
        self.assertEqual(score, FireHistoryScore.NO_RECENT_FIRE)

    def test_hazard_model_combines_component_scores(self):
        result = calculate_hazard(631, 10, 2024, "PB")
        self.assertEqual(result["hazard_score"], 3)
        self.assertEqual(result["hazard_level"], HazardLevel.MEDIUM)

    def test_hazard_level_bands_match_current_lookup(self):
        self.assertEqual(get_hazard_level(2), HazardLevel.LOW)
        self.assertEqual(get_hazard_level(4), HazardLevel.MEDIUM)
        self.assertEqual(get_hazard_level(5), HazardLevel.HIGH)


class GraniteTests(unittest.TestCase):
    def test_granite_score_is_high_when_on_granite(self):
        score = get_granite_score(True, None)
        self.assertEqual(score, GraniteScore.HIGH)

    def test_granite_score_uses_distance_bands(self):
        self.assertEqual(get_granite_score(False, 80), GraniteScore.MEDIUM)
        self.assertEqual(get_granite_score(False, 200), GraniteScore.LOW)
        self.assertEqual(get_granite_score(False, 500), GraniteScore.NONE)


class NormalizationTests(unittest.TestCase):
    def test_normalize_hazard_score(self):
        self.assertAlmostEqual(normalize_hazard_score(6), 1.0)
        self.assertAlmostEqual(normalize_hazard_score(3), 0.5)

    def test_normalize_site_vulnerability_score(self):
        self.assertAlmostEqual(normalize_site_vulnerability_score(3), 1.0)
        self.assertAlmostEqual(normalize_site_vulnerability_score(1), 1.0 / 3.0)

    def test_normalize_granite_score(self):
        self.assertAlmostEqual(normalize_granite_score(3), 1.0)
        self.assertAlmostEqual(normalize_granite_score(0), 0.0)


class IntegratedScoreTests(unittest.TestCase):
    def test_recorded_site_priority_score_uses_equal_weights(self):
        score = get_recorded_site_priority_score(6, 3)
        self.assertAlmostEqual(score, 1.0)

    def test_precaution_zone_score_weights_hazard_more_than_granite(self):
        score = get_precaution_zone_score(3, 3)
        self.assertAlmostEqual(score, 0.65)

    def test_integrated_priority_level_bands(self):
        self.assertEqual(get_integrated_priority_level(0.2), IntegratedPriorityLevel.LOW)
        self.assertEqual(
            get_integrated_priority_level(0.5),
            IntegratedPriorityLevel.MEDIUM,
        )
        self.assertEqual(
            get_integrated_priority_level(0.8),
            IntegratedPriorityLevel.HIGH,
        )

    def test_recorded_site_priority_model_returns_score_and_level(self):
        result = calculate_recorded_site_priority(5, 3)
        self.assertAlmostEqual(result["recorded_site_priority_score"], 11.0 / 12.0)
        self.assertEqual(
            result["recorded_site_priority_level"],
            IntegratedPriorityLevel.HIGH,
        )

    def test_precaution_zone_model_returns_score_and_level(self):
        result = calculate_precaution_zone(3, 2)
        self.assertAlmostEqual(result["precaution_zone_score"], 0.55)
        self.assertEqual(
            result["precaution_zone_level"],
            IntegratedPriorityLevel.MEDIUM,
        )


if __name__ == "__main__":
    unittest.main()
