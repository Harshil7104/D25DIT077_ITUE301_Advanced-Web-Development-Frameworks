# AWDF Practical 11: Containerization with Docker and Docker Compose

**Course:** Advanced Web Development Frameworks (AWDF)  
**Author:** Harshil Patel (Roll No: 77, ID: D25DIT077)  

Multi-container containerization for the full-stack Task Management application using **Docker** and **Docker Compose**.

---

## 🏗️ Architecture & Services

The application is structured into three containerized microservices communicating over a private bridge network (`app-network`):

1. **`frontend` (React + Vite + Nginx)**:
   - Multi-stage build compiled with Vite and served by Nginx on port `5173:80`.
   - Features React.lazy() route splitting, client-side input validation, and Chart.js analytics.
2. **`backend` (Express.js REST API)**:
   - Node.js runtime running on port `5000:5000`.
   - Exposes RESTful CRUD endpoints for tasks and JWT authentication.
   - Includes in-memory caching via `node-cache` and EventEmitter notification streaming.
3. **`mongodb` (Database)**:
   - Official `mongo:7.0` container with volume persistence (`mongo-data`).
   - Configured with automated healthchecks to ensure dependent services wait until MongoDB is ready.

---

## 🐳 Quick Start with Docker Compose

### 1. Build and Run Containers
```bash
docker compose up --build
```

### 2. Service Access
- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **MongoDB:** `localhost:27017`

### 3. Stop Containers
```bash
docker compose down
```
