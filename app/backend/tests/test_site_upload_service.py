import sys
import shutil
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from uuid import uuid4
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
from services.site_upload.site_upload_service import save_uploaded_site_photo
from services.site_upload.site_upload_service import validate_uploaded_site_data
from werkzeug.datastructures import FileStorage


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
        # Track temp folders created by tests so we can remove them afterwards.
        self.temp_dirs_to_clean: list[Path] = []

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
        # Clean up any temp upload folders created during a test run.
        for temp_dir in self.temp_dirs_to_clean:
            shutil.rmtree(temp_dir, ignore_errors=True)
    
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

    def test_save_site_photo(self):
        temp_path = Path(tempfile.gettempdir()) / f"fire_app_site_upload_test_{uuid4().hex}"
        temp_path.mkdir(parents=True, exist_ok=True)
        self.temp_dirs_to_clean.append(temp_path)

        with patch(
            "services.site_upload.site_upload_service.PHOTO_UPLOAD_DIR",
            new=temp_path,
        ):
            created_site = create_uploaded_site(
                {
                    "name": "Photo Site",
                    "placeType": "Artefacts / Scatter",
                    "latitude": -34.10,
                    "longitude": 117.90,
                    "siteSizeM": 350,
                    "locationSource": "manual",
                },
                self.user.id,
            )

            photo = FileStorage(
                stream=BytesIO(b"fake image bytes"),
                filename="site-photo.jpg",
                content_type="image/jpeg",
            )

            result = save_uploaded_site_photo(created_site["site"]["id"], self.user.id, photo)

            saved_site = db.session.execute(
                db.select(UploadedSite).where(UploadedSite.id == result["site"]["id"])
            ).scalar_one()

            self.assertEqual(saved_site.photo_filename, "site-photo.jpg")
            self.assertEqual(saved_site.photo_content_type, "image/jpeg")
            self.assertTrue(saved_site.photo_path.endswith(".jpg"))
            self.assertTrue(any(temp_path.iterdir()))
            photo.close()

    def test_replace_site_photo(self):
        temp_path = Path(tempfile.gettempdir()) / f"fire_app_site_upload_test_{uuid4().hex}"
        temp_path.mkdir(parents=True, exist_ok=True)
        self.temp_dirs_to_clean.append(temp_path)

        with patch(
            "services.site_upload.site_upload_service.PHOTO_UPLOAD_DIR",
            new=temp_path,
        ):
            created_site = create_uploaded_site(
                {
                    "name": "Photo Replace Site",
                    "placeType": "Artefacts / Scatter",
                    "latitude": -34.10,
                    "longitude": 117.90,
                    "siteSizeM": 350,
                    "locationSource": "manual",
                },
                self.user.id,
            )

            first_photo = FileStorage(
                stream=BytesIO(b"first image bytes"),
                filename="first.jpg",
                content_type="image/jpeg",
            )
            first_result = save_uploaded_site_photo(
                created_site["site"]["id"],
                self.user.id,
                first_photo,
            )
            first_path = Path(first_result["site"]["photoPath"])
            if not first_path.is_absolute():
                first_path = BACKEND_DIR / first_path

            second_photo = FileStorage(
                stream=BytesIO(b"second image bytes"),
                filename="second.jpg",
                content_type="image/jpeg",
            )
            second_result = save_uploaded_site_photo(
                created_site["site"]["id"],
                self.user.id,
                second_photo,
            )
            second_path = Path(second_result["site"]["photoPath"])
            if not second_path.is_absolute():
                second_path = BACKEND_DIR / second_path

            self.assertFalse(first_path.exists())
            self.assertTrue(second_path.exists())
            self.assertEqual(second_result["site"]["photoFilename"], "second.jpg")

    def test_invalid_photo_extension(self):
        created_site = create_uploaded_site(
            {
                "name": "Bad Photo Site",
                "placeType": "Artefacts / Scatter",
                "latitude": -34.10,
                "longitude": 117.90,
                "siteSizeM": 350,
                "locationSource": "manual",
            },
            self.user.id,
        )

        photo = FileStorage(
            stream=BytesIO(b"not an image"),
            filename="notes.txt",
            content_type="text/plain",
        )

        with self.assertRaises(ValueError) as error:
            save_uploaded_site_photo(created_site["site"]["id"], self.user.id, photo)

        self.assertEqual(str(error.exception), "Photo must be a JPG, PNG, or WEBP image")


if __name__ == "__main__":
    unittest.main()
