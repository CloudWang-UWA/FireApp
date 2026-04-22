import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from flask import Flask


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from models.uploaded_site import UploadedSite
from models.user import User
from models.user import db
from services.site_upload.site_upload_service import create_uploaded_site
from services.site_upload.site_upload_service import is_inside_study_area
from services.site_upload.site_upload_service import validate_uploaded_site_data


class SiteUploadServiceTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite://"
        self.app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        db.init_app(self.app)

        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Keep one real user in the test DB so uploaded sites can point to it.
        self.user = User(
            email="tester@example.com",
            password_hash="just a test user",
            display_name="Test User",
        )
        db.session.add(self.user)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    # raw form input should be cleaned before saving
    def test_normalize_input(self):
        result = validate_uploaded_site_data(
            {
                "name": "  New Site  ",
                "placeType": "  Artefacts / Scatter ",
                "notes": "  test note ",
                "latitude": "-35.09",
                "longitude": "117.90",
                "siteSizeM": "350",
                "locationSource": "manual",
            }
        )

        self.assertEqual(result["name"], "New Site")
        self.assertEqual(result["place_type"], "Artefacts / Scatter")
        self.assertEqual(result["notes"], "test note")
        self.assertEqual(result["latitude"], -35.09)
        self.assertEqual(result["longitude"], 117.90)
        self.assertEqual(result["site_size_m"], 350.0)
        self.assertEqual(result["location_source"], "manual")

    def test_invalid_latitude(self):
        with self.assertRaises(ValueError) as error:
            validate_uploaded_site_data(
                {
                    "name": "Bad site",
                    "placeType": "Artefacts / Scatter",
                    "latitude": "north",
                    "longitude": "117.90",
                }
            )

        self.assertEqual(str(error.exception), "Latitude must be a valid number")

    def test_inside_study_area(self):
        self.assertTrue(is_inside_study_area(-35.09, 117.90))

    def test_outside_study_area(self):
        self.assertFalse(is_inside_study_area(-34.10, 117.90))

    # create a site and make sure its risk is saved
    @patch("services.site_upload.site_upload_service.calculate_uploaded_site_risk")
    def test_save_site_risk(self, mock_calculate_uploaded_site_risk):
        # Mock the GIS-heavy part so this test stays about save logic.
        mock_calculate_uploaded_site_risk.return_value = {
            "hazard": {
                "hazard_score": 3,
                "hazard_level": 2,
            },
            "siteVulnerability": {
                "site_vulnerability_score": 2,
            },
            "sitePriority": {
                "site_priority_score": 0.58,
                "site_priority_level": 2,
            },
        }

        result = create_uploaded_site(
            {
                "name": "Uploaded Test Site",
                "placeType": "Artefacts / Scatter",
                "notes": "saved from unit test",
                "latitude": -35.09,
                "longitude": 117.90,
                "siteSizeM": 350,
                "locationSource": "manual",
            },
            self.user.id,
        )

        self.assertTrue(result["insideStudyArea"])
        self.assertTrue(result["riskAvailable"])
        self.assertIsNone(result["outOfAreaWarning"])

        saved_site = db.session.execute(
            db.select(UploadedSite).where(UploadedSite.id == result["site"]["id"])
        ).scalar_one()

        self.assertTrue(saved_site.inside_study_area)
        self.assertIsNone(saved_site.fuel_code)
        self.assertIsNone(saved_site.slope_deg)
        self.assertIsNone(saved_site.fire_year)
        self.assertIsNone(saved_site.fire_type)
        self.assertEqual(saved_site.hazard_score, 3)
        self.assertEqual(saved_site.hazard_level, 2)
        self.assertEqual(saved_site.site_vulnerability_score, 2)
        self.assertAlmostEqual(saved_site.site_priority_score, 0.58)
        self.assertEqual(saved_site.site_priority_level, 2)

    # outside the study area, the site should save without risk
    @patch("services.site_upload.site_upload_service.calculate_uploaded_site_risk")
    def test_outside_area_skips_risk(self, mock_calculate_uploaded_site_risk):
        result = create_uploaded_site(
            {
                "name": "Outside Site",
                "placeType": "Artefacts / Scatter",
                "latitude": -34.10,
                "longitude": 117.90,
                "siteSizeM": 350,
                "locationSource": "manual",
            },
            self.user.id,
        )

        mock_calculate_uploaded_site_risk.assert_not_called()
        self.assertFalse(result["insideStudyArea"])
        self.assertFalse(result["riskAvailable"])
        self.assertIsNotNone(result["outOfAreaWarning"])

        saved_site = db.session.execute(
            db.select(UploadedSite).where(UploadedSite.id == result["site"]["id"])
        ).scalar_one()

        self.assertFalse(saved_site.inside_study_area)
        self.assertIsNone(saved_site.hazard_score)
        self.assertIsNone(saved_site.site_priority_score)

    # inside the study area, a site can still save even when no hazard is calculable
    @patch("services.site_upload.site_upload_service.calculate_uploaded_site_risk")
    def test_inside_area_without_calculable_risk(self, mock_calculate_uploaded_site_risk):
        mock_calculate_uploaded_site_risk.return_value = {
            "hazard": {
                "hazard_score": None,
                "hazard_level": None,
                "fuel_code": None,
                "fuel_type": None,
                "slope_deg": None,
                "fire_year": None,
                "fire_type": None,
            },
            "siteVulnerability": {
                "site_vulnerability_score": 2,
            },
            "sitePriority": {
                "site_priority_score": None,
                "site_priority_level": None,
            },
        }

        result = create_uploaded_site(
            {
                "name": "No Data Site",
                "placeType": "Artefacts / Scatter",
                "latitude": -35.09,
                "longitude": 117.90,
                "siteSizeM": 350,
                "locationSource": "manual",
            },
            self.user.id,
        )

        self.assertTrue(result["insideStudyArea"])
        self.assertFalse(result["riskAvailable"])
        self.assertEqual(
            result["outOfAreaWarning"],
            "Risk could not be calculated for this site location because no valid environmental data was available.",
        )

        saved_site = db.session.execute(
            db.select(UploadedSite).where(UploadedSite.id == result["site"]["id"])
        ).scalar_one()

        self.assertTrue(saved_site.inside_study_area)
        self.assertIsNone(saved_site.fuel_code)
        self.assertIsNone(saved_site.slope_deg)
        self.assertIsNone(saved_site.fire_year)
        self.assertIsNone(saved_site.fire_type)
        self.assertIsNone(saved_site.hazard_score)
        self.assertIsNone(saved_site.hazard_level)
        self.assertIsNone(saved_site.site_vulnerability_score)
        self.assertIsNone(saved_site.site_priority_score)
        self.assertIsNone(saved_site.site_priority_level)


if __name__ == "__main__":
    unittest.main()
