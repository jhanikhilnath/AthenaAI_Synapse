# Athena AI

This project consists of three main components that need to be run concurrently:
1. **ML Engine** (Python FastAPI)
2. **Backend Server** (Node.js / Express with Bun)
3. **Frontend Application** (React / Vite)

## Prerequisites
Before starting, ensure you have the following installed on your system:
- **[Bun](https://bun.sh/)** (JavaScript runtime used for the backend)
- **Node.js & npm** (Used for the frontend)
- **Python 3.x** (Used for the ML engine)

---

## 1. Fast API ML Engine (Python)

The ML Engine serves the random forest models and prediction endpoints. It runs from the root of the project.

**Installation & Setup:**
1. Open a terminal in the root directory (`/home/njha/Coding/AthenaAI`).
2. Activate the pre-existing Python virtual environment:
   ```bash
   source venv/bin/activate
   ```
   *(If you are setting this up from scratch, you would need to install the required packages: `pip install fastapi uvicorn pandas scikit-learn joblib pydantic`)*

**Start the Server:**
Run the FastAPI application using uvicorn:
```bash
uvicorn main:app --reload --port 8000
```
*The ML engine will typically run on `http://localhost:8000`.*

---

## 2. Backend Server (Bun / Express)

The backend handles the core API, database connections, and communicates with the ML engine.

**Installation & Setup:**
1. Open a new terminal and navigate to the `backend` directory.
   ```bash
   cd backend
   ```
2. Install the required Node packages using Bun:
   ```bash
   bun install
   ```

**Start the Server:**
Start the backend server in development mode (with watch mode enabled):
```bash
bun run dev
```

---

## 3. Frontend Application (React / Vite)

The frontend is a React application built with Vite and Tailwind CSS.

**Installation & Setup:**
1. Open a new terminal and navigate to the `frontend` directory.
   ```bash
   cd frontend
   ```
2. Install the required packages using npm (or bun/yarn):
   ```bash
   npm install
   ```

**Start the Server:**
Start the Vite development server:
```bash
npm run dev
```
*The web app will typically launch on `http://localhost:5173`.*

---

## Running the Full Project
To test and work on the application, you must keep all **three** servers running simultaneously in separate terminal windows.
