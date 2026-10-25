# AWDF Practical 13: AI-Powered Task Management System Using Gemini API

**Course:** Advanced Web Development Frameworks (AWDF)  
**Author:** Harshil Patel (Roll No: 77, ID: D25DIT077)  
**Project:** Practical 13 — AI-Powered Task Description Generation (Continuation of Practical 12)

---

## 📌 Overview

This project implements **Practical 13**, integrating dynamic AI capabilities into the existing full-stack Task Management application. Using Google's official Gemini API (`@google/generative-ai`), users can generate concise, context-aware task descriptions with a single click, directly populated into the task creation form.

### Core Enhancements in Practical 13:
1. **AI-Powered Task Descriptions:** A **"✨ Generate Description"** button in the task creation form calls an Express backend endpoint that communicates with Google's Gemini API (`gemini-3.5-flash`).
2. **Dedicated Frontend Loading State:** While awaiting the AI response, an animated spinner badge displays: *"AI is generating description... Drafting a concise suggestion"*, and the button shows *"⏳ Generating..."* to prevent multiple concurrent requests.
3. **API Rate Limiting (1 Request / Minute):** Prevents excessive API usage and quota depletion by enforcing a strict 60-second cooldown per user/task on both the backend (HTTP 429) and frontend (interactive countdown timer: *"⏳ Wait (55s)"*).
4. **Clear AI Disclaimer & Review Badge:** The UI displays an amber advisory box stating that suggestions are AI-generated and should be reviewed by the user, alongside a green status badge highlighting generated suggestions.
5. **Strict API Key Security:** The `GEMINI_API_KEY` is kept **exclusively on the backend** inside `.env`. It is never bundled into frontend assets, never prefixed with `VITE_`, never exposed via API responses, and never tracked in Git.
6. **Graceful Degradation & Independent Failure:** If the AI service fails, times out, or lacks an API key, the core Task Management application remains 100% operational. The user receives a friendly inline message and can enter descriptions manually.
7. **Preserved Architecture:** Retains MongoDB persistence, JWT authentication, server-side validation, in-memory caching (`node-cache`), asynchronous EventEmitter notifications, Chart.js analytics with lazy loading, Docker multi-container support, and automated CI tests.

---

## 🏗️ Architecture & AI Workflow

```
[React Task Form: User enters Title]
                 │
                 ▼
[Click "✨ Generate Description" Button]
                 │
                 ▼
[Frontend: Activates animated spinner & disables repeated clicks]
                 │
                 ▼
[POST /api/ai/generate-description with JWT Bearer Token]
                 │
                 ▼
[Express Server: authMiddleware verifies JWT token]
                 │
                 ▼
[Express Server: Rate Limiter checks 1 req/min limit (HTTP 429 if exceeded)]
                 │
                 ▼
[Express Server: validateTask verifies non-empty title (HTTP 400 on error)]
                 │
                 ▼
[Express Server reads GEMINI_API_KEY strictly from process.env]
                 │
                 ▼
[Backend calls Google Gemini API (gemini-3.5-flash) with fallback]
                 │
                 ▼
[Backend cleans response and returns JSON: { "description": "..." }]
                 │
                 ▼
[React populates Description textarea, triggers 60s cooldown, displays disclaimer]
                 │
                 ▼
[User reviews/edits generated text and clicks "Add Task" to save normally]
```

---

## 🔒 Security Best Practices

* **No Hardcoded Keys:** Source code files contain **no** API keys or secrets.
* **Backend Only:** All AI provider interactions happen server-side in `backend/routes/aiRoutes.js`.
* **Git Excluded:** All `.env` files are ignored by `.gitignore` and `backend/.gitignore`.
* **CI Protected:** Automated unit tests mock/simulate responses without requiring an active API key or incurring external costs.

---

## ⚙️ Environment Configuration

### 1. Backend Environment (`backend/.env`)
Create or edit `backend/.env` (ignored by git):
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/taskdb
JWT_SECRET=practical13_secret_key_jwt_authentication_2026
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Root Environment (`.env` for Docker Compose)
Create or edit `.env` in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://mongodb:27017/taskdb
JWT_SECRET=practical13_secret_key_jwt_authentication_2026
GEMINI_API_KEY=your_actual_gemini_api_key_here
VITE_API_URL=http://localhost:5000
```

> **Note:** Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 🚀 Running the Application Locally

### Step 1: Start MongoDB
Ensure MongoDB is running locally on port 27017:
```powershell
mongod
```

### Step 2: Start the Backend Server
```powershell
cd backend
npm install
npm start
# Server runs on http://localhost:3000
```

### Step 3: Start the Frontend Application
```powershell
cd frontend
npm install
npm run dev
# React Vite development server runs on http://localhost:5173
```

---

## 🐳 Running with Docker & Docker Compose

Docker Compose builds and runs all three microservices (`frontend`, `backend`, and `mongodb`) in an isolated network:

```powershell
# Set your API key in root .env or terminal:
$env:GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Build and start containers:
docker compose up --build
```

### Service Map:
* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:5000`
* **MongoDB:** `localhost:27017`

To stop containers:
```powershell
docker compose down
```

---

## 🧪 Automated Testing

Both frontend and backend include automated tests that run without external network or AI API dependencies:

### Backend Unit Tests (16 Tests)
Tests input validation, JWT authentication, error handling, and rate limiting:
```powershell
cd backend
npm test
```

### Frontend Unit Tests
Tests DOM structure, components, scripts, and client-side validation:
```powershell
cd frontend
npm test
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Protection | Description |
| :--- | :--- | :---: | :--- |
| **POST** | `/api/ai/generate-description` | JWT Required | Generates description from `{ "title": "..." }` (Rate limited: 1 req/min, returns HTTP 429 on abuse) |
| **POST** | `/auth/register` | Public | Register a new user account |
| **POST** | `/auth/login` | Public | Log in and receive a signed JWT token |
| **GET** | `/tasks` | JWT Required | Fetch all tasks (cached with `node-cache`) |
| **POST** | `/tasks` | JWT Required | Create a new task in MongoDB |
| **PUT** | `/tasks/:id` | JWT Required | Update a task and invalidate cache |
| **DELETE**| `/tasks/:id` | JWT Required | Delete a task and emit event |
| **GET** | `/tasks/debug/cache` | JWT Required | View cache hits, misses, and stats |

---

## 📋 Viva & Evaluation Checklist

1. **Title Validation:** Submitting an empty or whitespace title to the AI endpoint returns HTTP 400.
2. **Secure Key Storage:** Key is stored solely in `.env` and read via `process.env.GEMINI_API_KEY`. Never exposed to frontend.
3. **Dedicated Loading State:** Animated spinner banner and button showing `"⏳ Generating..."` while AI generates response.
4. **Rate Limiting:** Enforces max 1 AI request per minute with interactive countdown timer and backend HTTP 429 status code.
5. **AI Disclaimer:** Visible advisory disclaimer reminding user that descriptions are AI suggestions and must be reviewed.
6. **Editable Generation:** Generated descriptions populate the standard textarea and can be edited freely before saving.
7. **Graceful Degradation:** The application continues working normally if the AI key is missing or service is unavailable.
8. **CI & Docker:** Docker Compose and GitHub Actions pass without requiring hardcoded secrets or making live paid API calls.
