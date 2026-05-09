# Heritage Fire Watch

CITS5206 Capstone Project - Group 21 - Semester 1 2026

Heritage Fire Watch is a GIS web application for visualising fire vulnerability risk around cultural heritage sites in the Albany, WA region.

## Tech Stack

- Frontend: React, TypeScript, Vite, Leaflet
- Backend: Flask, Flask-SQLAlchemy, Flask-CORS
- Data processing: GeoPandas, Rasterio, Shapely, PyProj
- Database: SQLite for local development, PostgreSQL for deployment

## Repository Structure

See [`app/README.md`](app/README.md) for the application architecture, feature areas, project structure, API endpoints, and local development notes.

## Prerequisites

Install:

- Python 3.12+
- Node.js and npm
- Git

Recommended: use a Python virtual environment.

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

For macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## Install Required Packages

Install backend dependencies:

```powershell
pip install -r app/backend/requirements.txt
```

Install ETL package:

```powershell
pip install -e app/etl
```

Install frontend dependencies:

```powershell
cd app/frontend
npm install
cd ../..
```

## Run Data Processing

The ETL pipeline generates processed outputs under:

```text
app/data/derived/
app/data/derived/analysis_ready/
```

The default ETL expects raw source data under:

```text
app/data/raw/
```

The raw data source is available from the project Google Drive folder:

[Raw data folder](https://drive.google.com/drive/folders/1DvnN04IMejH7PDkVcPO-_DFWbq35BOTg?usp=sharing)

After downloading the raw data, place it under `app/data/raw/`, then run the ETL pipeline from the repository root:

```bash
fire-vulnerability-etl --raw-data-dir app/data/raw --output-dir app/data/derived
```

There is also an upstream acquisition command for supported public source datasets:

```bash
fire-vulnerability-acquire-upstream
```

## Run Risk Analysis

On Windows:

```powershell
cd app/backend/scripts/risk
.\run_all.ps1
cd ../../../..
```

On macOS/Linux:

```bash
cd app/backend/scripts/risk
bash run_all.sh
cd ../../../..
```

## Run Backend Locally

From the repository root:

```powershell
python app/backend/app.py
```

The backend runs at:

```text
http://127.0.0.1:5000
```

Health check:

```text
http://127.0.0.1:5000/api/test
```

By default, the backend uses local SQLite:

```text
app/backend/instance/fire_app_demo.db
```

To use PostgreSQL locally, set:

```text
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/database_name
```

## Run Frontend Locally

In another terminal:

```powershell
cd app/frontend
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The frontend uses this local backend by default:

```text
http://127.0.0.1:5000
```

To point the frontend to another backend, create `app/frontend/.env`:

```text
VITE_API_BASE_URL=https://your-backend-url
```

## Useful Checks

Frontend production build:

```powershell
cd app/frontend
npm run build
```

Backend tests:

```powershell
pytest app/backend/tests
```

ETL tests:

```powershell
cd app/etl
pytest
```

## Deployment

Current deployment approach:

- Frontend: Vercel
- Backend: Render Web Service
- Database: Render PostgreSQL
- Production branch: `main`

Official deployed application:

```text
https://heritage-fire-watch.vercel.app/
```

### Backend on Render

Create a Render Web Service:

- Root directory: `app/backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`
- Health check path: `/api/test`

Required environment variables:

```text
DATABASE_URL=postgresql+psycopg://...
FLASK_SECRET_KEY=...
FRONTEND_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

### Database on Render

Create a Render PostgreSQL database and use its internal database URL for the backend `DATABASE_URL`.

If the URL starts with:

```text
postgresql://
```

change it to:

```text
postgresql+psycopg://
```

### Frontend on Vercel

Create a Vercel project:

- Root directory: `app/frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Required environment variable:

```text
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

After changing the frontend domain, update `FRONTEND_ORIGINS` on Render.
