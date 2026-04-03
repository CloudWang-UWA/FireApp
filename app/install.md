Heritage Fire Watch - Install Guide

**Prerequisites**
- Install `Node.js`
- Install `Python`
- `PostgreSQL` is not required for the current stage

**Backend setup**
- Install backend packages from the project root:
  `pip install -r backend/requirements.txt`
- The current demo uses a local SQLite database by default:
  `backend/instance/fire_app_demo.db`
- `PostgreSQL` can be introduced later when the project moves to a fuller user and permission system
- Example future PostgreSQL connection string:
  `postgresql+psycopg://postgres:postgres@localhost:5432/fire_app_demo`
- When PostgreSQL is used later, set:
  `DATABASE_URL`

**Frontend setup**
- Go to the frontend folder:
  `cd frontend`
- Install frontend packages:
  `npm install`

**Run project**
- Run backend: `python backend/app.py`
- Run frontend: cd frontend, `npm run dev`



