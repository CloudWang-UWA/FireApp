from __future__ import annotations

import json
import zipfile
from pathlib import Path

import geopandas as gpd
import numpy as np
import pytest
import rasterio

from fire_vulnerability_etl.config import (
    BBOX_7850,
    CANONICAL_DEM_DATASET_ID,
    CANONICAL_DEM_SOURCE,
    CANONICAL_FUEL_SOURCE,
    CANONICAL_GEOLOGY_DATASET_ID,
    CANONICAL_GEOLOGY_SOURCE,
    DATA_ZIP_PATH,
    DEFAULT_VECTOR_CRS,
    RAW_DATA_DIR,
    STUDY_AREA_DESCRIPTION,
    STUDY_AREA_ID,
    study_area_bbox,
)
from fire_vulnerability_etl.pipeline import (
    _require_single_dem_source,
    ensure_workspace,
    prepare_raw_sources,
    run_pipeline,
    select_dominant_fuel_code,
)


REFERENCE_ARCHIVE_PATH = DATA_ZIP_PATH.parent / "data_change.zip"
EXPECTED_SITE_SOURCE_COUNTS = {"registered": 74, "lodged": 118, "council": 104}
EXPECTED_GRANITE_CODE_COUNTS = {
    "P_gp": 184,
    "P_ns": 49,
    "P_ng": 45,
    "Agp": 8,
    "P_gm": 6,
    "Agv": 2,
    "P_gh": 1,
}
EXCLUDED_SCORING_FIELDS = {
    "risk_score",
    "risk_level",
    "hazard_score",
    "base_fuel_score",
    "primary_factor",
    "fuel_band",
    "slope_band",
    "scoring_status",
}


def _write_archive(path: Path, members: dict[str, bytes], duplicate_member: str | None = None) -> None:
    with zipfile.ZipFile(path, "w") as archive:
        for name, payload in members.items():
            archive.writestr(name, payload)
        if duplicate_member is not None:
            archive.writestr(duplicate_member, b"duplicate")


def _placeholder_archive_members() -> dict[str, bytes]:
    return {
        "granite/granite.geojson": b"{}",
        "vegetation/vegetation.geojson": b"{}",
        "fuel/fuel.tif": b"not-a-real-tif",
        "slope/slope.tif": b"not-a-real-tif",
        "sites/registered.geojson": b"{}",
        "sites/lodged.geojson": b"{}",
        "sites/registered_coord.geojson": b"{}",
        "sites/lodged_coord.geojson": b"{}",
    }


def _write_dem_source_zip(path: Path, member_name: str) -> None:
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr(member_name, b"fake-raster")


def _skip_if_canonical_raw_sources_are_unavailable() -> None:
    try:
        prepare_raw_sources()
    except FileNotFoundError as exc:
        pytest.skip(f"Canonical raw sources are not available in this checkout: {exc}")


@pytest.fixture(scope="session")
def reference_dir(tmp_path_factory: pytest.TempPathFactory) -> Path:
    if not REFERENCE_ARCHIVE_PATH.exists():
        pytest.skip(
            "Regression oracle data_change.zip is not available at the repository root; "
            "place the reference bundle there to run oracle comparisons.",
            allow_module_level=False,
        )
    out_dir = tmp_path_factory.mktemp("data-change-reference")
    with zipfile.ZipFile(REFERENCE_ARCHIVE_PATH) as archive:
        archive.extractall(out_dir)
    return out_dir


@pytest.fixture(scope="session")
def pipeline_outputs(tmp_path_factory: pytest.TempPathFactory):
    _skip_if_canonical_raw_sources_are_unavailable()
    out_dir = tmp_path_factory.mktemp("canonical-raw-derived")
    return run_pipeline(output_dir=out_dir)


def test_pipeline_contract(pipeline_outputs) -> None:
    outputs = pipeline_outputs

    manifest = json.loads(outputs.manifest_path.read_text(encoding="utf-8"))
    analysis_manifest = json.loads(outputs.analysis_ready_manifest_path.read_text(encoding="utf-8"))
    risk_input_grid = gpd.read_file(outputs.risk_input_grid_path)
    analysis_dir = outputs.analysis_ready_dir
    assert analysis_dir is not None

    output_dir = outputs.manifest_path.parent
    assert outputs.risk_input_grid_path.name == "risk_input_grid.gpkg"
    assert not (output_dir / "metadata.json").exists()
    assert not (output_dir / "risk_grid.geojson").exists()
    assert not (output_dir / "risk_grid_internal.geojson").exists()
    assert not (output_dir / "risk_grid_export.csv").exists()

    assert manifest["source_mode"] == "canonical_raw"
    assert manifest["study_area_id"] == STUDY_AREA_ID
    assert manifest["study_area"]["description"] == STUDY_AREA_DESCRIPTION
    assert manifest["study_area"]["bbox_7844"] == list(study_area_bbox(DEFAULT_VECTOR_CRS))
    assert manifest["study_area"]["bbox_7850"] == list(BBOX_7850)
    assert manifest["grid_summary"]["total_cells"] == 16120
    assert manifest["outputs"]["risk_input_grid"] == "risk_input_grid.gpkg"
    assert set(manifest["excluded_scoring_fields"]) == EXCLUDED_SCORING_FIELDS
    assert not EXCLUDED_SCORING_FIELDS & set(risk_input_grid.columns)

    assert risk_input_grid.crs.to_epsg() == 7850
    assert len(risk_input_grid) == manifest["grid_summary"]["total_cells"]
    assert {
        "cell_id",
        "dataset_version",
        "heritage_potential",
        "granite_present",
        "site_proxy_present",
        "fuel_mode_code",
        "fuel_source_dataset",
        "fuel_support_status",
        "slope_mean_deg",
        "slope_p90_deg",
        "slope_support_status",
        "fire_history_event_count",
        "recent_fire_present",
        "recent_fire_cover_pct",
        "centroid_lon",
        "centroid_lat",
        "qa_flags",
    } <= set(risk_input_grid.columns)

    assert set(manifest["raw_sources"]) >= {
        "dplh_register",
        "dplh_lodged",
        "dplh_survey_areas",
        "dplh_historic",
        "dplh_heritage_council_state_register",
        CANONICAL_GEOLOGY_DATASET_ID,
        CANONICAL_DEM_DATASET_ID,
        "csiro_fuel_classification",
        "dbca_fire_history",
    }
    assert Path(manifest["raw_sources"][CANONICAL_DEM_DATASET_ID]["path"]).resolve() == CANONICAL_DEM_SOURCE.resolve()
    assert (
        Path(manifest["raw_sources"][CANONICAL_GEOLOGY_DATASET_ID]["path"]).resolve()
        == CANONICAL_GEOLOGY_SOURCE.resolve()
    )
    assert Path(manifest["raw_sources"]["csiro_fuel_classification"]["path"]).resolve() == CANONICAL_FUEL_SOURCE.resolve()

    assert manifest["outputs"]["analysis_ready"] == {
        "directory": "analysis_ready",
        "interface_manifest": "analysis_ready/interface_manifest.json",
        "sites": {
            "gpkg": "analysis_ready/sites.gpkg",
            "geojson": "analysis_ready/sites.geojson",
        },
        "granite": {
            "gpkg": "analysis_ready/granite.gpkg",
            "geojson": "analysis_ready/granite.geojson",
        },
        "fire_history": {
            "gpkg": "analysis_ready/fire_history.gpkg",
            "geojson": "analysis_ready/fire_history.geojson",
        },
        "fuel": {
            "tif": "analysis_ready/fuel.tif",
            "png": "analysis_ready/fuel.png",
            "json": "analysis_ready/fuel.json",
        },
        "slope": {
            "tif": "analysis_ready/slope.tif",
            "png": "analysis_ready/slope.png",
            "json": "analysis_ready/slope.json",
        },
    }

    assert analysis_manifest["study_area_id"] == STUDY_AREA_ID
    assert analysis_manifest["study_area_bbox_7844"] == list(study_area_bbox(DEFAULT_VECTOR_CRS))
    assert analysis_manifest["analysis_bbox_7850"] == list(BBOX_7850)
    assert set(analysis_manifest["files"]) == {"sites", "granite", "fire_history", "fuel", "slope"}

    raw_sources = analysis_manifest["raw_sources"]
    assert Path(raw_sources[CANONICAL_DEM_DATASET_ID]["path"]).resolve() == CANONICAL_DEM_SOURCE.resolve()
    assert Path(raw_sources[CANONICAL_GEOLOGY_DATASET_ID]["path"]).resolve() == CANONICAL_GEOLOGY_SOURCE.resolve()
    assert Path(raw_sources["csiro_fuel_classification"]["path"]).resolve() == CANONICAL_FUEL_SOURCE.resolve()

    assert not (analysis_dir / "site.gpkg").exists()
    assert not (analysis_dir / "fuel_primary.tif").exists()
    assert not (analysis_dir / "fuel_source_mask.tif").exists()

    sites_gpkg = gpd.read_file(analysis_dir / "sites.gpkg")
    sites_geojson = gpd.read_file(analysis_dir / "sites.geojson")
    granite_gpkg = gpd.read_file(analysis_dir / "granite.gpkg")
    granite_geojson = gpd.read_file(analysis_dir / "granite.geojson")
    fire_history_gpkg = gpd.read_file(analysis_dir / "fire_history.gpkg")
    fire_history_geojson = gpd.read_file(analysis_dir / "fire_history.geojson")

    assert sites_gpkg.crs.to_epsg() == 7850
    assert sites_geojson.crs.to_epsg() == 4326
    assert len(sites_gpkg) == 296
    assert len(sites_geojson) == 296
    assert sites_gpkg["source"].value_counts().to_dict() == EXPECTED_SITE_SOURCE_COUNTS
    assert sites_geojson["source"].value_counts().to_dict() == EXPECTED_SITE_SOURCE_COUNTS
    assert "path" not in sites_gpkg.columns
    assert "layer" not in sites_gpkg.columns

    assert granite_gpkg.crs.to_epsg() == 7850
    assert granite_geojson.crs.to_epsg() == 4326
    assert len(granite_gpkg) == 295
    assert len(granite_geojson) == 295
    assert granite_gpkg["CODE"].value_counts().to_dict() == EXPECTED_GRANITE_CODE_COUNTS
    assert granite_geojson["CODE"].value_counts().to_dict() == EXPECTED_GRANITE_CODE_COUNTS

    assert fire_history_gpkg.crs.to_epsg() == 7850
    assert fire_history_geojson.crs.to_epsg() == 4326
    assert len(fire_history_gpkg) == 1209
    assert len(fire_history_geojson) == 1209

    fuel_json = json.loads((analysis_dir / "fuel.json").read_text(encoding="utf-8"))
    slope_json = json.loads((analysis_dir / "slope.json").read_text(encoding="utf-8"))
    assert fuel_json["image"] == "fuel.png"
    assert fuel_json["crs"] == "EPSG:4326"
    assert fuel_json["width"] == 1436
    assert fuel_json["height"] == 1368
    assert slope_json["image"] == "slope.png"
    assert slope_json["crs"] == "EPSG:4326"
    assert slope_json["width"] == 5074
    assert slope_json["height"] == 4004
    assert np.allclose(
        fuel_json["bounds"],
        [[-35.330190721267655, 117.17762739856026], [-34.209956728475916, 118.60110437722832]],
    )
    assert np.allclose(
        slope_json["bounds"],
        [[-35.330317033715794, 117.17750088833363], [-34.20980283202787, 118.60121385164413]],
    )

    assert "dea_landcover_fallback" not in set(risk_input_grid["fuel_source_dataset"].dropna())
    assert "fallback_landcover_support" not in set(risk_input_grid["fuel_support_status"].dropna())
    assert set(risk_input_grid["fuel_source_dataset"].dropna()) <= {"csiro_primary", "none"}
    assert set(risk_input_grid["fuel_support_status"].dropna()) <= {"supported", "missing_fuel_data"}
    missing_fuel = risk_input_grid[risk_input_grid["fuel_source_dataset"] == "none"]
    assert not missing_fuel.empty
    assert missing_fuel["fuel_mode_code"].isna().all()
    assert set(missing_fuel["fuel_support_status"]) == {"missing_fuel_data"}


def test_pipeline_matches_data_change_reference(pipeline_outputs, reference_dir: Path) -> None:
    outputs = pipeline_outputs
    analysis_dir = outputs.analysis_ready_dir
    assert analysis_dir is not None

    sites_gpkg = gpd.read_file(analysis_dir / "sites.gpkg")
    granite_gpkg = gpd.read_file(analysis_dir / "granite.gpkg")
    fire_history_gpkg = gpd.read_file(analysis_dir / "fire_history.gpkg")

    reference_sites = gpd.read_file(reference_dir / "sites.gpkg")
    reference_granite = gpd.read_file(reference_dir / "granite.gpkg")
    reference_fire_history = gpd.read_file(reference_dir / "fire_history.gpkg")
    assert len(sites_gpkg) == len(reference_sites)
    assert len(granite_gpkg) == len(reference_granite)
    assert granite_gpkg["CODE"].value_counts().to_dict() == reference_granite["CODE"].value_counts().to_dict()
    assert len(fire_history_gpkg) == len(reference_fire_history)

    with rasterio.open(analysis_dir / "fuel.tif") as produced_fuel, rasterio.open(reference_dir / "fuel.tif") as reference_fuel:
        produced = produced_fuel.read(1)
        reference = reference_fuel.read(1)
        produced_valid = produced != produced_fuel.nodata
        reference_valid = reference != reference_fuel.nodata

        assert produced_fuel.crs == reference_fuel.crs
        assert produced_fuel.shape == reference_fuel.shape
        assert produced_fuel.bounds == pytest.approx(reference_fuel.bounds)
        assert produced_fuel.res == pytest.approx(reference_fuel.res)
        assert produced_fuel.nodata == reference_fuel.nodata == 0
        assert set(np.unique(produced[produced_valid])) == set(np.unique(reference[reference_valid]))
        assert np.array_equal(produced[reference_valid], reference[reference_valid])
        assert int((produced_valid & ~reference_valid).sum()) <= 600
        assert int((reference_valid & ~produced_valid).sum()) == 0

    with rasterio.open(analysis_dir / "slope.tif") as produced_slope, rasterio.open(reference_dir / "slope.tif") as reference_slope:
        produced = produced_slope.read(1).astype("float32")
        reference = reference_slope.read(1).astype("float32")
        valid = (produced != produced_slope.nodata) & (reference != reference_slope.nodata)
        diff = np.abs(produced[valid] - reference[valid])

        assert produced_slope.crs == reference_slope.crs
        assert produced_slope.shape == reference_slope.shape
        assert produced_slope.bounds == pytest.approx(reference_slope.bounds)
        assert produced_slope.res == pytest.approx(reference_slope.res)
        assert produced_slope.nodata == reference_slope.nodata == -9999.0
        assert float(diff.mean()) < 0.1
        assert float(np.quantile(diff, 0.95)) < 0.25
        assert float(diff.max()) < 25.0


def test_prepare_raw_sources_uses_explicit_canonical_new_dem_and_geology() -> None:
    _skip_if_canonical_raw_sources_are_unavailable()
    prepared = prepare_raw_sources()

    assert prepared.dem.dataset_id == CANONICAL_DEM_DATASET_ID
    assert prepared.dem.source_path == CANONICAL_DEM_SOURCE.resolve()
    assert prepared.dem.resolved_path.name == "1_Second_DEM_Smoothed.tif"

    assert prepared.geology.dataset_id == CANONICAL_GEOLOGY_DATASET_ID
    assert prepared.geology.source_path == CANONICAL_GEOLOGY_SOURCE.resolve()
    assert prepared.geology.resolved_path.name == "geology_surface_si5011.shp"

    assert prepared.fuel.source_path == CANONICAL_FUEL_SOURCE.resolve()
    assert prepared.fuel.resolved_path.name == "Bushfire fuel classification fuel types map release 2.tif"


def test_dominant_fuel_code_uses_deterministic_family_priority() -> None:
    assert select_dominant_fuel_code([940, 510, 940, 510]) == 510
    assert select_dominant_fuel_code([230, 640, 640, 230]) == 230
    assert select_dominant_fuel_code([]) is None


@pytest.mark.parametrize(
    ("label", "archive_factory", "expected_message"),
    [
        (
            "missing_member",
            lambda path: _write_archive(
                path,
                {
                    key: value
                    for key, value in _placeholder_archive_members().items()
                    if key != "fuel/fuel.tif"
                },
            ),
            "missing required inputs",
        ),
        (
            "duplicate_required_member",
            lambda path: _write_archive(
                path,
                _placeholder_archive_members(),
                duplicate_member="fuel/fuel.tif",
            ),
            "duplicate required inputs",
        ),
        (
            "path_traversal",
            lambda path: _write_archive(
                path,
                {
                    **_placeholder_archive_members(),
                    "../evil.txt": b"nope",
                },
            ),
            "unsafe path",
        ),
    ],
)
def test_ensure_workspace_rejects_invalid_archives(
    tmp_path: Path,
    label: str,
    archive_factory,
    expected_message: str,
) -> None:
    archive_path = tmp_path / f"{label}.zip"
    archive_factory(archive_path)

    with pytest.raises(ValueError, match=expected_message):
        ensure_workspace(archive_path)


def test_require_single_dem_source_uses_archive_contents_not_zip_filename(tmp_path: Path) -> None:
    dem_zip = tmp_path / "ga_download_70715.zip"
    _write_dem_source_zip(dem_zip, "1_Second_DEM_Smoothed.tif")

    assert _require_single_dem_source(tmp_path) == dem_zip.resolve()


def test_require_single_dem_source_rejects_hydro_only_archives(tmp_path: Path) -> None:
    hydro_zip = tmp_path / "Hydro_Enforced_1_Second_DEM_1148099.zip"
    _write_dem_source_zip(hydro_zip, "Hydro_Enforced_1_Second_DEM.tif")

    with pytest.raises(FileNotFoundError, match="No DEM-S source package found"):
        _require_single_dem_source(tmp_path)


def test_require_single_dem_source_rejects_multiple_dem_s_archives(tmp_path: Path) -> None:
    first = tmp_path / "first_dem_s.zip"
    second = tmp_path / "second_dem_s.zip"
    _write_dem_source_zip(first, "1_Second_DEM_Smoothed.tif")
    _write_dem_source_zip(second, "1_Second_DEM_Smoothed.tif")

    with pytest.raises(ValueError, match="Multiple DEM-S source packages found"):
        _require_single_dem_source(tmp_path)
