# Karla Heritage Watch New Site Upload Module Documentation

## Overview

The site upload module supports recording newly identified heritage sites through the web app. It allows a user to submit site details, including place type, location, notes, and an optional reference photo, then store the site and display it on the map.

If the site falls inside the current study area and valid environmental data is available, the module also calculates risk information for that uploaded site.

## Inputs and Outputs

The new site upload module receives form input from the frontend. Main user inputs are:

- site name
- place type
- notes
- latitude and longitude
- site size in metres
- location source
- optional photo

The module also depends on backend source data used for risk calculation, including `fuel.tif`, `slope.tif`, and `fire_history.gpkg`, read from `app/backend/data/`.

Main outputs are:

- a stored uploaded site database record, including risk fields when the site is inside the study area and risk is calculable
- uploaded sites returned as GeoJSON features for frontend map display

## Core Module Logic

### 1. Site Submission and Validation

The module first validates raw frontend input before saving anything to the database.

Validation checks include:

- required fields
- numeric latitude and longitude
- coordinate ranges
- positive site size
- allowed location source values
- photo file extension (`.jpg`, `.jpeg`, `.png`, `.webp`) when a photo is uploaded
- photo MIME type matching the file extension
- non-empty photo file
- photo size limit of 5 MB

This step ensures that uploaded records are normalized and safe to save before risk logic is applied.

---

### 2. Study Area Check

The module uses a simple bounding-box check to determine whether an uploaded site falls inside the supported study area.

Current bounds are:

- longitude: `117.18` to `118.58`
- latitude: `-35.32` to `-34.22`

If a site is outside this area:

- the site is still saved
- risk is not calculated
- the API returns a warning message

This design allows the module to preserve submitted records even when the current study area datasets do not support risk calculation.

---

### 3. Photo Upload Handling

If the user selects a photo in the frontend form, the frontend first creates the site record through `POST /api/site-upload/sites`. If that succeeds, it then uploads the selected file through `POST /api/site-upload/sites/<site_id>/photo`.

Photo files are stored in `app/backend/instance/uploaded_site_photos`.

The backend stores:

- saved file path
- original filename
- content type

If a photo is replaced, the old stored file is removed. If the database save fails after a new photo is written, the new file is also removed to avoid leaving orphaned files on disk.

---

### 4. Uploaded Site Hazard

Uploaded site hazard is calculated in `app/backend/services/site_upload/uploaded_site_risk_cal.py`.

Unlike the recorded-site workflow, uploaded sites do not depend on the pre-generated `hazard_overview.gpkg` output. That file is large and makes interactive upload risk calculation unnecessarily costly, so uploaded site hazard is calculated directly from source environmental data.

The current workflow is:

1. build a square geometry from the uploaded point and site size
2. reproject the square into the raster CRS
3. read only the local raster window around the uploaded site
4. sample fuel, slope, and fire-history values within that area
5. calculate hazard for candidate cells
6. keep the highest hazard found within the uploaded site area

This makes the module faster and more practical for interactive use because it avoids dependence on a large generated hazard file.

Uploaded site hazard uses the same scoring logic as the main risk module. Hazard is derived from fuel, slope, and fire history, and the final hazard score ranges from 0 to 6 before being converted into a hazard level.

---

### 5. Uploaded Site Vulnerability

Uploaded site vulnerability is calculated using the same place type scoring logic as the main risk module.

This keeps uploaded site scoring consistent with the rest of the system while still allowing the upload workflow to operate independently. Site vulnerability scores range from 1 to 3 based on the uploaded place type.

Further detail on the hazard and vulnerability scoring logic is provided in the Risk Module Documentation.

---

### 6. Uploaded Site Priority

Uploaded site priority is calculated by combining:

- uploaded site hazard
- uploaded site vulnerability

using the same generic site priority logic as the main risk model.

This allows uploaded sites to be interpreted using the same scoring framework as recorded sites, even though the data enters the system through a different workflow. The uploaded site priority score ranges from 0 to 1. Priority levels are classified as Low (`0.00` to `<0.34`), Medium (`0.34` to `<0.67`), and High (`>= 0.67`).

---

### 7. Uploaded Site Layer Output

Uploaded sites are exposed to the frontend as a GeoJSON layer through the backend layer service.

Current output logic:

- reads uploaded site records from the database
- represents each site as a square polygon using stored location and size
- includes derived risk fields in feature properties
- serves the uploaded sites layer through `/api/layers/uploaded-sites`

This allows uploaded sites to appear on the same map as the main risk outputs.

## Testing

The repository includes backend unit tests in `app/backend/tests/test_site_upload_service.py`.

Current test coverage includes:

- input normalization
- invalid latitude handling
- study area checks
- saving uploaded site risk
- outside-area behavior
- inside-area behavior when risk is not calculable
- photo upload
- photo replacement
- invalid photo extension

In addition to automated tests, this module was also checked through database results, API responses, and frontend map display behavior to confirm that uploaded records were saved and returned correctly.

## Current Limitations

- uploaded site geometry is simplified to a square
- uploaded site hazard currently uses the highest hazard found within the site area
- uploaded site results depend on availability of source environmental data at the submitted location
- photo upload is a second API step after site creation rather than part of a single combined request
- more end-to-end tests could still be added for the full upload workflow and map display

## Appendix A: Key Files

- `app/backend/services/site_upload/site_upload_service.py`  
  Validates input, checks study area membership, creates uploaded site records, saves derived risk fields, and handles photo file storage.

- `app/backend/services/site_upload/uploaded_site_risk_cal.py`  
  Calculates uploaded site hazard directly from local source data and combines it with vulnerability and priority logic.

- `app/backend/routes/site_upload_routes.py`  
  Exposes upload and photo endpoints to the frontend.

- `app/backend/models/uploaded_site.py`  
  Defines the database model for uploaded sites and stored derived fields.

- `app/backend/services/layer_service.py`  
  Converts uploaded sites into GeoJSON features for map display.

- `app/backend/tests/test_site_upload_service.py`  
  Contains unit tests for validation, study-area checks, risk saving behavior, and photo handling.

## Appendix B: API Endpoints

- `POST /api/site-upload/sites`
- `POST /api/site-upload/sites/<site_id>/photo`
- `GET /api/layers/uploaded-sites`
