# Practical 7: User Authentication & Authorization in Task Management Application

**Course:** ITUE301 - Advanced Web Development Frameworks  
**Author:** D25DIT077  
**Technology Stack:** Node.js, Express.js, MongoDB / Mongoose, Bcrypt.js, JSON Web Tokens (JWT), Vanilla HTML5/CSS3/JavaScript  

---

## 📋 Table of Contents
1. [Overview & Problem Statement](#overview--problem-statement)
2. [Key Architecture & Features](#key-architecture--features)
3. [Project Structure](#project-structure)
4. [Authentication & Security Flow](#authentication--security-flow)
5. [REST API Endpoints Specification](#rest-api-endpoints-specification)
6. [Pre-Database Input Validation](#pre-database-input-validation)
7. [Supplementary Problems Implementation](#supplementary-problems-implementation)
8. [Automated Verification Test Suite](#automated-verification-test-suite)
9. [Setup & Running Locally](#setup--running-locally)
10. [Postman Collection](#postman-collection)
11. [Viva Questions & Core Concepts](#viva-questions--core-concepts)

---

## 🎯 Overview & Problem Statement

### Main Problem Statement
- **User Registration & Login:** Implement secure user registration and login functionality for the Task Management system.
- **Password Hashing:** Hash passwords using `bcrypt` (10 salt rounds) before saving the `User` document to MongoDB.
- **JWT Token Generation:** Implement signed JWT token generation upon successful login/registration, with a strict 1-hour expiry.
- **Route Protection:** Protect all `/tasks` routes using an authentication middleware that verifies the Bearer JWT.
- **Server-Side Input Validation:** Add validation middleware that rejects malformed requests (e.g. missing title, invalid email, short password) before they reach the database.

### Supplementary Problems
- **Problem 1 (`/me` Endpoint):** Implement a `GET /api/auth/me` endpoint that returns the currently logged-in user's details and token lifespan using the decoded JWT.
- **Problem 2 (Token Expiry Handling):** Implement frontend 401 interceptor that clears expired tokens from `localStorage` and automatically redirects the user to the Sign In screen with an informative alert.
- **Problem 3 (Logout Mechanism):** Add a logout action that wipes client-side tokens from storage, halts background timers, and notifies the backend.

---

## 🛠️ Key Architecture & Features

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (Browser)                                  |
|  - Auth Gateway (Login / Register Tabs + Quick Demo Fill)                         |
|  - JWT Expiry Live Countdown Timer (1-Hour Duration)                              |
|  - 401 Interceptor with Auto-Redirect to Login Screen                             |
|  - Task Management Dashboard (CRUD, Filters, Stats, Search, Priority Colors)      |
|  - Live Pre-DB Validation Sandbox & /me Inspector Modal                           |
+-----------------------------------------------------------------------------------+
                                   │ Bearer JWT
                                   ▼
+-----------------------------------------------------------------------------------+
|                                EXPRESS API SERVER                                 |
|                                                                                   |
|  1. Global Middleware: CORS, Morgan, Body-Parser (JSON)                           |
|                                                                                   |
|  2. Server-Side Input Validator (`middleware/validator.js`):                      |
|     - validateRegister: name (min 2), email format regex, password (min 6)        |
|     - validateLogin: email format regex, password presence                        |
|     - validateTask: title required (min 3, max 100), priority enum, etc.          |
|     * Rejects invalid requests with HTTP 400 BEFORE touching MongoDB!            |
|                                                                                   |
|  3. Authentication Middleware (`middleware/authMiddleware.js`):                  |
|     - Extracts `Bearer <token>` from Authorization header                         |
|     - Verifies JWT with HMAC SHA-256 (`JWT_SECRET`)                              |
|     - Verifies token expiration (`TokenExpiredError` -> HTTP 401)                 |
|     - Attaches verified user document to `req.user` (excluding password)         |
|                                                                                   |
|  4. Controllers (`authController.js`, `taskController.js`):                      |
|     - User Isolation: Tasks query strictly filtered by `{ user: req.user._id }`   |
|                                                                                   |
|  5. Centralized Error Handler (`middleware/errorHandler.js`):                     |
|     - Converts Mongoose ValidationErrors, CastErrors, Duplicate Keys to JSON      |
+-----------------------------------------------------------------------------------+
                                   │ Mongoose ODM
                                   ▼
+-----------------------------------------------------------------------------------+
|                                MONGODB DATABASE                                   |
|  - Users Collection (Email index: unique, Password: $2a$ Bcrypt Hashed)           |
|  - Tasks Collection (Referenced to user: ObjectId, pre-save trim hooks)           |
+-----------------------------------------------------------------------------------+
```

---

## 📂 Project Structure

```
c:\WEBD\Practical7\
├── config/
│   └── db.js                 # Database connection (Local MongoDB / Atlas / Memory fallback)
├── controllers/
│   ├── authController.js     # User registration, login, /me, and logout
│   └── taskController.js     # User-isolated Task CRUD operations
├── middleware/
│   ├── authMiddleware.js     # JWT verification middleware & token generator
│   ├── validator.js          # Pre-database request validation (HTTP 400)
│   ├── errorHandler.js       # Centralized JSON error response handler
│   └── notFound.js           # 404 Route Not Found handler
├── models/
│   ├── User.js               # User schema with pre-save bcrypt hash & methods
│   └── Task.js               # Task schema with user reference & trim hook
├── public/                   # Modern Glassmorphic SPA Frontend
│   ├── index.html            # Auth gateway, dashboard, and /me modal
│   ├── style.css             # Obsidian theme, glassmorphism, animations
│   ├── app.js                # Frontend state, 401 interceptor, countdown timer
│   └── postman_collection.json # Exportable Postman collection
├── routes/
│   ├── authRoutes.js         # /api/auth (register, login, me, logout)
│   └── taskRoutes.js         # Protected /tasks (GET, POST, PUT, DELETE)
├── tests/
│   └── test-api.js           # Automated test suite (35 assertion checks)
├── .env                      # Local environment configuration
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore file
├── package.json              # Node.js dependencies & scripts
├── postman_collection.json   # Root Postman collection file
└── README.md                 # Complete documentation & lab report
```

---

## 🔐 Authentication & Security Flow

### 1. Password Hashing with Bcrypt
When a user registers:
1. `validateRegister` validates name, email format, and password length (min 6 chars).
2. The user document is instantiated.
3. The Mongoose **pre-save hook** intercepts the document:
   ```javascript
   userSchema.pre('save', async function (next) {
     if (!this.isModified('password')) return next();
     const salt = await bcrypt.genSalt(10);
     this.password = await bcrypt.hash(this.password, salt);
     next();
   });
   ```
4. Only the 60-character bcrypt hash (`$2a$10$...`) is written to MongoDB. Plaintext passwords are never saved.
5. In responses, `userSchema.methods.toJSON` strips the password field completely.

### 2. JWT Generation & Verification
On successful login:
1. User provides email and password.
2. `User.findOne({ email })` retrieves the user.
3. `user.matchPassword(password)` executes `bcrypt.compare()` in constant time to prevent timing attacks.
4. If valid, a JWT token is created:
   ```javascript
   const token = jwt.sign(
     { id: user._id, email: user.email, name: user.name },
     process.env.JWT_SECRET,
     { expiresIn: '1h' }
   );
   ```
5. All protected endpoints verify this token via `authMiddleware.protect`:
   - Checks `req.headers.authorization.startsWith('Bearer ')`.
   - Decodes token using `jwt.verify(token, secret)`.
   - Confirms user exists in database: `User.findById(decoded.id).select('-password')`.
   - Attaches `req.user = user`.

---

## 📡 REST API Endpoints Specification

### 1. Authentication Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user, hash password with bcrypt, return JWT |
| `POST` | `/api/auth/login` | Public | Verify credentials, return signed JWT (1h expiry) |
| `GET` | `/api/auth/me` | Private | Decodes JWT, returns authenticated user details (**Supp. 1**) |
| `POST` | `/api/auth/logout` | Public/Private | Server logout acknowledgment (**Supp. 3**) |

### 2. Protected Task Routes (`/tasks`)

> **Note:** All task routes are protected by `protect` middleware. Requests must include header:  
> `Authorization: Bearer <jwt_token>`

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/tasks` | `completed`, `priority`, `search`, `sort` | Retrieve tasks for authenticated user |
| `POST` | `/tasks` | None | Create new task (requires `title`) |
| `GET` | `/tasks/:id` | None | Retrieve single task owned by user |
| `PUT` | `/tasks/:id` | None | Update task fields (title, description, completed, priority) |
| `DELETE` | `/tasks/:id` | None | Delete task owned by user |

### 3. Diagnostics & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns server status, database connection state, and feature list |

---

## ⚡ Pre-Database Input Validation

Implemented in `middleware/validator.js` to ensure malformed requests are rejected with **HTTP 400 Bad Request** before touching the database:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Input Validation Error",
  "message": "Task title is required and cannot be empty",
  "errors": [
    {
      "field": "title",
      "message": "Task title is required and cannot be empty"
    }
  ]
}
```

### Validation Rules:
1. **Task Title:** Mandatory, string, non-empty, min 3, max 100 characters.
2. **Task Priority:** Optional, but if provided must be one of `['low', 'medium', 'high']`.
3. **Registration Email:** Valid regex format `^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$`.
4. **Registration Password:** Minimum 6 characters.

---

## 🌟 Supplementary Problems Implementation

### Supplementary Problem 1: `/me` Endpoint
- **Endpoint:** `GET /api/auth/me`
- **Protection:** Protected by `authMiddleware.protect`.
- **Functionality:** Extracts user ID from decoded JWT, retrieves user details from MongoDB (without password), and calculates remaining token lifespan in seconds.
- **Sample Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "6718d7...",
      "name": "Harshil Student",
      "email": "harshil@example.com",
      "createdAt": "2026-10-25T04:19:56.000Z"
    },
    "tokenDetails": {
      "issuedAt": "2026-10-25T04:20:00.000Z",
      "expiresAt": "2026-10-25T05:20:00.000Z",
      "expiresInSeconds": 3594
    }
  }
  ```

### Supplementary Problem 2: Frontend Token Expiry Handling
- **Implementation:** Custom fetch wrapper `apiFetch()` in `public/app.js`:
  ```javascript
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    handleClientLogout(false);
    showToast('Session expired. Redirecting to login...', 'warning');
    renderApp();
    throw new Error('Unauthorized (401)');
  }
  ```
- **Simulate Button:** The UI includes an interactive button: **"⚠️ Simulate Expired Token (401)"** to test this behavior live.

### Supplementary Problem 3: Client Logout Mechanism
- **Implementation:**
  - Clicking the **🚪 Logout** button calls `handleClientLogout()`.
  - Removes `token` and `user` keys from `localStorage`.
  - Halts the active token countdown `setInterval`.
  - Switches the display back to the Authentication Gateway.
  - Sends asynchronous notification to `POST /api/auth/logout`.

---

## 🧪 Automated Verification Test Suite

The test suite (`tests/test-api.js`) contains **35 automated assertion checks** validating all requirements:

```powershell
node tests/test-api.js
```

### Test Results:
```
================================================================
🧪 PRACTICAL 7: COMPREHENSIVE AUTOMATED TEST SUITE
================================================================

Test Group 1: Server-Side Input Validation (Rejection before DB)
  ✓ PASS: Rejects registration with invalid email format (HTTP 400)
  ✓ PASS: Returns "Input Validation Error" type
  ✓ PASS: Rejects registration with password shorter than 6 characters (HTTP 400)

Test Group 2: User Registration & Bcrypt Hashing
  ✓ PASS: User registered successfully (HTTP 201)
  ✓ PASS: Response indicates success = true
  ✓ PASS: Registration issues a valid JWT token
  ✓ PASS: User email returned accurately
  ✓ PASS: Password is NOT exposed in API response
  ✓ PASS: User document exists in MongoDB
  ✓ PASS: Password in MongoDB is NOT plaintext
  ✓ PASS: Password is encrypted using standard bcrypt hash ($2a$/$2b$)
  ✓ PASS: Rejects registration with duplicate email (HTTP 409)

Test Group 3: User Login & JWT Generation (1-hour expiry)
  ✓ PASS: Rejects invalid credentials with HTTP 401 Unauthorized
  ✓ PASS: User logged in successfully (HTTP 200)
  ✓ PASS: Login returns JWT token
  ✓ PASS: JWT expiry is exactly 1 hour (3600s), actual: 3600s
  ✓ PASS: JWT payload contains user email

Test Group 4: Supplementary Problem 1 (/me Endpoint)
  ✓ PASS: Accessing /me without token returns HTTP 401 Unauthorized
  ✓ PASS: Accessing /me with valid token returns HTTP 200
  ✓ PASS: Returns logged-in user details from decoded JWT
  ✓ PASS: Returns token expiration metadata

Test Group 5: Route Protection on Tasks (Auth Middleware)
  ✓ PASS: GET /tasks without token returns HTTP 401 Unauthorized
  ✓ PASS: POST /tasks without token returns HTTP 401 Unauthorized
  ✓ PASS: Rejects invalid/malformed JWT with HTTP 401

Test Group 6: Task Validation (Rejection before reaching DB)
  ✓ PASS: Rejects task creation with missing title (HTTP 400)
  ✓ PASS: Returns descriptive error message for missing title
  ✓ PASS: Rejects task creation with invalid priority (HTTP 400)

Test Group 7: Protected Task CRUD & User Data Isolation
  ✓ PASS: Task created successfully under authenticated user (HTTP 201)
  ✓ PASS: User 2 cannot see User 1 tasks (User Isolation active)
  ✓ PASS: User 2 cannot modify User 1 task (HTTP 404 / Unauthorized)
  ✓ PASS: User 1 successfully updates own task (HTTP 200)
  ✓ PASS: Task completed status updated in DB
  ✓ PASS: User 1 successfully deletes own task (HTTP 200)

Test Group 8: Supplementary Problem 3 (Logout Endpoint)
  ✓ PASS: Logout acknowledgment endpoint returns HTTP 200
  ✓ PASS: Logout acknowledgment returns success = true

================================================================
Test Summary: Total Passed: 35 | Failed: 0
================================================================
```

---

## 🚀 Setup & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd c:\WEBD\Practical7
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Configure `.env` file (already created):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/taskmanager_practical7
   JWT_SECRET=super_secret_jwt_key_practical7_d25dit077_itue301_2026
   JWT_EXPIRE=1h
   ```

4. Start the Application:
   ```powershell
   npm start
   ```
   *(Or for auto-reloading development server: `npm run dev`)*

5. Open your browser and navigate to:
   - **Interactive Live Dashboard:** [http://localhost:5000](http://localhost:5000)
   - **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📬 Postman Collection

A complete Postman collection is included in `postman_collection.json` (and downloadable via the top-right button in the web UI).

### How to use:
1. Open Postman -> Click **Import** -> Select `c:\WEBD\Practical7\postman_collection.json`.
2. Send request **"Register User"** or **"Login User"**.
3. The embedded post-response test script automatically saves the returned JWT token to the `jwt_token` collection variable:
   ```javascript
   const res = pm.response.json();
   if (res.token) {
       pm.collectionVariables.set('jwt_token', res.token);
   }
   ```
4. All subsequent protected task requests and the `/me` request automatically use `Bearer {{jwt_token}}`!

---

## 💡 Viva Questions & Core Concepts

### Q1: Why do we hash passwords with Bcrypt instead of SHA-256 or MD5?
**Answer:** SHA-256 and MD5 are general-purpose cryptographic hash functions designed for speed. Modern GPUs can compute billions of SHA-256 hashes per second, making them vulnerable to brute-force dictionary attacks. **Bcrypt** is a slow, adaptive hashing algorithm based on the Blowfish cipher. It includes a configurable **work factor (salt rounds)** that exponentially increases the computational cost, making brute-force attacks computationally infeasible. Furthermore, Bcrypt automatically incorporates a cryptographically secure random **salt** into every hash, defeating precomputed Rainbow Table attacks.

### Q2: What is the structure of a JSON Web Token (JWT)?
**Answer:** A JWT consists of three parts separated by dots (`.`):
1. **Header:** Identifies the algorithm (e.g. `HS256`) and token type (`JWT`).
2. **Payload:** Contains claims such as user identity (`id`, `email`, `name`) and expiration time (`iat`, `exp`).
3. **Signature:** Computed using `HMAC-SHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`. It ensures that the token cannot be modified or tampered with by clients without invalidating the signature.

### Q3: Why is input validation performed on the server even if client-side validation exists?
**Answer:** Client-side validation improves user experience by providing instant feedback, but can easily be bypassed using tools like Postman, curl, or browser developer tools. **Server-side validation** is the true security gatekeeper that guarantees malformed, malicious, or incomplete data is rejected before reaching controllers or the database.

### Q4: How does the application ensure user data isolation?
**Answer:** Every task document stores a `user` field referencing the `User` ObjectId. The `authMiddleware` attaches the authenticated user's document to `req.user`. All database queries (`find`, `findOne`, `findOneAndUpdate`, `findOneAndDelete`) enforce `{ user: req.user._id }`, preventing User A from accessing, modifying, or deleting User B's tasks.
