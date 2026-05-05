# Snowden Labs - Cyberpunk Cybersecurity Platform

Snowden Labs is a futuristic, cyberpunk-themed cybersecurity training platform. It provides an immersive environment where users can spin up dedicated, isolated Docker containers to practice CTF (Capture The Flag) challenges, learn vulnerability exploitation, and improve their cybersecurity skills. Users can track their progress, maintain learning streaks, and earn badges as they complete hands-on labs.

## 🏗️ Architecture & How It Works

The project is built on a modern, decoupled full-stack architecture:

### Frontend
- **Framework**: React 18 with TypeScript, built using Vite for fast HMR and optimized builds.
- **Styling**: Tailwind CSS with a custom Cyberpunk design system (neon accents, dark mode, glassmorphism).
- **State & Routing**: React Router DOM for protected routing and context providers for global state (e.g., Auth, Theme).
- **Communication**: Uses Axios (`src/api.tsx`) to communicate with the REST API.

### Backend
- **Framework**: FastAPI (Python), providing asynchronous and high-performance REST APIs.
- **Database**: SQLite (`snowdenlabs.db`) via SQLAlchemy as the ORM to manage Users, Labs, Activities, and Badges.
- **Authentication**: JWT-based authentication using standard `OAuth2PasswordBearer` and `python-jose`.
- **Lab Management**: The backend integrates with the host's Docker daemon via the `docker` python SDK (`backend/services/docker_service.py`). When a user starts a lab, FastAPI dynamically spins up a dedicated container, maps it to an available host port, and returns the unique session to the user. A background scheduler handles the cleanup of expired lab sessions.

---

## 🚀 How to Run Locally

### Prerequisites
1. **Node.js** (v18+) & npm
2. **Python** (3.10+)
3. **Docker** Desktop or Engine (Must be running, as the backend needs to spawn lab containers)

### 1. Backend Setup
Navigate to the root directory, create a virtual environment, and install dependencies:
```bash
# Optional but recommended: Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r req.txt

# Start the FastAPI server (runs on http://localhost:8000)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Note: Make sure your Docker daemon is running so the `docker` python client can connect to `var/run/docker.sock`.*

### 2. Frontend Setup
In a new terminal window, run the frontend:
```bash
# Navigate to the project root
npm install

# Start the Vite development server (runs on http://localhost:5175)
npm run dev
```

### 3. Database Seeding (Optional)
If you want to populate the database with initial labs:
```bash
# Ensure you are at the project root and the virtual environment is activated
python -m backend.seed_labs
```

---

## 🛠️ How to Add Features

### 1. Adding a New Lab (Challenge)
Labs are modeled in the database and tied to a specific Docker image.
- **Through the API**: You can send a `POST` request to `http://localhost:8000/create-lab/` with a JSON body matching the `LabCreate` schema (found in `backend/schemas/lab.py`).
- **Through Seeding**: Open `backend/seed_labs.py` and append a new lab dictionary to the list. For example:
  ```python
  {
      "id": "new-sqli-lab",
      "title": "SQL Injection Basics",
      "category": "Web Security",
      "difficulty": "Beginner",
      "docker_image": "vulnerables/web-dvwa:latest",
      "docker_port": 80,
      ...
  }
  ```
  Then, run the seeder script. Ensure the target `docker_image` is pulled or available on Docker Hub.

### 2. Adding a New API Endpoint
1. Navigate to `backend/routers/` and either create a new file (e.g., `leaderboard.py`) or add to an existing router.
2. Define your FastAPI routes, injecting `Depends(get_db)` if database access is needed.
3. If creating a new router file, remember to register it in `backend/main.py`:
   ```python
   from backend.routers import leaderboard
   app.include_router(leaderboard.router)
   ```

### 3. Adding New UI Components / Pages
1. Create reusable UI elements in `src/components/` following the existing Tailwind cyberpunk aesthetic.
2. Create new full-page views in `src/pages/`.
3. Add the new page to the routing configuration in `src/App.tsx`.
4. If the page requires data fetching, add the corresponding API call in the component using the `apiClient` from `src/api.tsx`.

## 📜 License
MIT License# CyberLab
