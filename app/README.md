# Heritage Fire Watch

Heritage Fire Watch is a GIS web application for visualising heritage-related layers, supporting user access, and preparing for later fire risk analysis.

## Module structure

### 1. User Management: Sainath
- login and registration
- user session handling
- user profile access
- role-based access control (RBAC) support
- Profile page

### 2. User Interface: Chinmai and Ramim
- overall application layout around the map
- navigation bar and sidebar structure
- profile entry point and future support pages
- user-friendly presentation for non-expert users
- accessible risk presentation, including colour-blind-friendly display choices

### 3. Interactive Map: Difu, Chinmai and Ramim
- map display and basemap switching
- GIS layer loading and rendering
- layer toggles and popup interaction
- foundation for future drawing and selection tools
- Display the risk level

### 4. Data Processing Pipeline: Difu
- preparation of raw datasets before use in the web app
- cleaning of fields, geometry, and coordinates
- generation of derived outputs for later analysis
- support for preprocessing workflows outside normal API requests

### 5. Fire Risk Assessment: Cloud
- backend fire vulnerability calculation
- overview and detail outputs for the map
- support for cached or pre-generated results
- later risk visualisation on the frontend in coordination with accessible UI design

### 6. Data Export: Sainath
- selection of map areas for reporting
- preparation of tabular outputs such as Excel files
- later export of selected records from the map

### 7. Site Upload: Cloud
- entry of newly discovered heritage sites
- support for geometry and attribute submission
- foundation for later review and approval workflows

## Project structure

```text
fire_app_demo/
├── backend/               backend code
│   ├── app.py             Flask app entry point
│   ├── data/              Map data files used by the backend (GeoJSON, GeoTIFF)
│   ├── instance/          local SQLite database for development
│   ├── models/            database models
│   ├── routes/            backend API routes
│   ├── services/          backend logic
│   ├── scripts/           data processing, risk calculation scripts etc
│   └── utils/             tools, helper functions
├── frontend/              frontend code
│   ├── package.json       frontend dependencies
│   ├── vite.config.ts     Vite config
│   └── src/
│       ├── App.tsx        main frontend app structure
│       ├── App.css        main app styles
│       ├── index.css      global styles
│       ├── main.tsx       frontend entry point
│       ├── components/    UI components
│       ├── routes/        frontend routes
│       ├── config/        frontend config
│       ├── api/           frontend API calls
│       ├── types/         shared TypeScript types, enums
│       └── utils/         tools, helper functions
├── install.md
└── README.md
```

## Adding a new feature

When a new feature is added, the usual pattern is:

1. Add a frontend component if a new screen or panel is needed.
2. Add or extend a frontend route file under `frontend/src/routes/` if a new page URL is needed.
3. Add a frontend API file if the frontend needs to call a new backend endpoint.
4. Add a backend route file or extend an existing route file to expose the endpoint.
5. Add or extend a backend service file for the business logic.
6. Add scripts under `backend/scripts/` if preprocessing or offline generation is needed.
7. Add a model only if the feature needs persistent database storage.

A simple example:
- A new export workflow would usually touch `frontend/src/components/export/`, `frontend/src/api/export.ts`, `backend/routes/export_routes.py`, and `backend/services/export_service.py`.

## API endpoints

### Health and layers
- `GET /api/test`
- `GET /api/layers`
- `GET /api/layers/site`
- `GET /api/layers/granite`
- `GET /api/layers/fuel`
- `GET /api/layers/vegetation`
- `GET /api/layers/slope`

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Placeholders for planned modules
- `GET /api/risk/status`
- `GET /api/permissions/status`
- `GET /api/export/status`
- `GET /api/upload/status`

## Tech stack

### Frontend
- React
- TypeScript
- Vite
- Leaflet
- React-Leaflet

### Backend
- Flask
- Flask-SQLAlchemy
- flask-cors

### Database
- SQLite for the current local-development stage
- PostgreSQL reserved for later expansion of users, permissions, and production-style data management
