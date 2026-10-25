# AWDF Practical 12: CI/CD Pipeline Using GitHub Actions

**Course:** Advanced Web Development Frameworks (AWDF)  
**Author:** Harshil Patel (Roll No: 77, ID: D25DIT077)  

Automated Continuous Integration and Continuous Deployment (CI/CD) pipeline for the full-stack containerized Task Management application using **GitHub Actions**.

---

## CI/CD Pipeline Workflow

The workflow is configured in `.github/workflows/ci.yml` and is triggered on **pull requests targeting the `main` branch**.

### Pipeline Jobs:
1. **`lint` (Code Quality & Linting)**:
   - Uses **ESLint** to verify code formatting, syntax errors, and undefined variables across backend and frontend source code.
2. **`build-and-test` (Build & Test)**:
   - Depends on the `lint` job (`needs: lint`).
   - Installs Frontend dependencies (`npm install`).
   - Builds Frontend production bundle (`vite build`).
   - Executes Frontend automated test suite (`node --test`).
   - Installs Backend dependencies (`npm install`).
   - Executes Backend unit test suite (`node --test`).
   - Validates Docker Compose service definitions and networks (`docker compose config`).

---

## Local Development & Testing Commands

### Backend Tests
```bash
cd backend
npm install
npm test
```

### Frontend Build & Tests
```bash
cd frontend
npm install
npm run build
npm test
```

### Docker Compose Configuration Validation
```bash
docker compose config
```
