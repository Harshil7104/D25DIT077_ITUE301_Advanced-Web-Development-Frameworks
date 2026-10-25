# Practical 5: MongoDB Integration and Schema Design with Mongoose

**Course:** Advanced Web Development Frameworks (ITUE301)  
**Student ID:** D25DIT077  
**Academic Year:** 2026-2027  
**CO / PO Mapping:** CO2, CO3 / PO3, PO5  

---

## 🎯 Objective
To connect a MongoDB database to an Express server and enforce strict data integrity through a structured Mongoose schema, replacing volatile in-memory storage with persistent database model operations and structured JSON error reporting.

---

## 📋 Problem Statement & Requirements Checklist

- [x] **MongoDB Connection**: Connect MongoDB to Express backend using Mongoose.
- [x] **Schema Design**: Define a `Task` schema with at least 4 fields:
  - `title` (String, required, min 3, max 100 chars, whitespace trimmed).
  - `description` (String, max 500 chars).
  - `completed` (Boolean, default `false`).
  - `createdAt` (Date, default `Date.now`).
- [x] **Persistent CRUD Operations**: Replace Practical 4's in-memory JavaScript array with real Mongoose model operations (`Task.find`, `Task.findById`, `Task.create`/`.save()`, `Task.findByIdAndDelete`).
- [x] **Structured Validation Errors**: Intercept raw Mongoose error objects and return structured JSON responses with HTTP 400.
- [x] **Postman Testing**: Comprehensive testing of all CRUD endpoints, schema edge cases, and error responses.
- [x] **Supplementary 1**: `priority` field restricted to enum `['low', 'medium', 'high']` with default `'medium'`.
- [x] **Supplementary 2**: Pre-save hook automatically trimming whitespace from `title`.
- [x] **Supplementary 3**: `GET /tasks/:id` endpoint returning a 404 JSON response when an ID does not exist.

---

## 🏗️ Architecture & Data Flow

```
+-------------------------------------------------------------+
|              Client (Postman / Web UI Client)               |
+-------------------------------------------------------------+
                              │ HTTP JSON Requests
                              ▼
+-------------------------------------------------------------+
|                     Express Application                     |
|  - Middleware: CORS, Morgan, JSON Parser                    |
|  - Routes: /tasks, /tasks/:id, /api/health                  |
|  - Controller: taskController.js                            |
+-------------------------------------------------------------+
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
+-----------------------------+ +-----------------------------+
|       Mongoose Model        | |   Centralized ErrorHandler  |
|  - Schema Validation        | |  - Formats ValidationErrors |
|  - Pre-save Trimming Hooks  | |  - Formats CastErrors (400) |
|  - Enum Restrictions        | |  - Formats 404 & 500 JSON   |
+-----------------------------+ +-----------------------------+
               │
               ▼
+-------------------------------------------------------------+
|                    MongoDB Database Engine                  |
|          (Local MongoDB / Atlas / Memory Server)            |
+-------------------------------------------------------------+
```

---

## 🧠 Key Questions / In-Depth Analysis

### 1. What is the purpose of a schema in a NoSQL database like MongoDB, given that MongoDB itself is schema-less?

**Answer:**  
MongoDB is natively **schema-less** (or schema-flexible) at the database layer. This means MongoDB collections do not enforce rigid column definitions, allowing documents within the same collection to have entirely different fields, missing properties, or conflicting data types.

While this flexibility is powerful for rapid prototyping, production applications require **data consistency, predictability, and business invariants**. A schema layer provided by an ODM (Object Data Modeling) library like **Mongoose** serves several critical purposes:

1. **Application-Level Data Contract:** Mongoose schemas establish a predictable shape for documents. Application code can safely assume that `task.completed` is always a Boolean and `task.title` is always a non-empty String.
2. **Type Casting and Coercion:** Mongoose automatically casts incoming data types (e.g., converting the string `"true"` or `"1"` into a boolean `true`, or an ISO timestamp string into a JavaScript `Date` object).
3. **Data Integrity & Validation:** Prevents corrupted or incomplete data from reaching the storage layer by executing custom validators, range checks, regex patterns, and enums before executing database writes.
4. **Lifecycle Hooks (Middleware):** Provides `pre` and `post` hooks for actions like trimming whitespace, hashing passwords, generating slugs, or cascading deletions.
5. **Virtuals, Getters, and Setters:** Allows computed properties that exist in code without occupying physical storage in the database.

> **Summary:** MongoDB provides the flexible storage engine, while Mongoose provides the governance, integrity, and predictability needed by production software.

---

### 2. Why is it important to define required fields and default values at the schema level rather than relying on frontend validation alone?

**Answer:**  
Frontend validation (such as HTML5 `required` attributes or React state validation) is designed exclusively for **User Experience (UX)**—providing immediate feedback to well-behaved users in a web browser. It is **never** a security or data-integrity boundary.

Defining required fields and defaults at the **schema level** is crucial because:

1. **Bypassing the Frontend:** Any client can make requests directly to your backend API using tools like Postman, curl, Python scripts, or malicious HTTP requests, completely bypassing the browser and all frontend JavaScript checks.
2. **Multiple Consumer Clients:** In modern architectures, a single backend API often serves web apps, mobile apps (iOS/Android), background microservices, third-party webhooks, and administrative CLI tools. Centralizing validation at the schema level guarantees data integrity across all entry points.
3. **Defense in Depth:** Even if a bug is introduced in frontend form logic or an API gateway, the Mongoose schema acts as the ultimate gatekeeper before data is permanently committed to disk.
4. **Deterministic Document State:** Setting defaults (like `completed: false`, `priority: 'medium'`, and `createdAt: Date.now`) at the schema level ensures newly created documents are always in a consistent, queryable state without requiring callers to specify every attribute.

---

### 3. What happens internally when a document fails Mongoose validation — where is the request stopped?

**Answer:**  
Mongoose validation runs **in-memory inside the Node.js application process** *before* any query or command is sent over the network to the MongoDB server.

Here is the exact internal execution lifecycle when `Task.create()` or `task.save()` is called:

```
Client HTTP Request
        │
        ▼
Express Route / Controller
        │
        ▼
Instantiate Document: new Task(req.body)
        │
        ▼
Mongoose Internal Execution:
   1. Document pre-save middleware hooks execute (e.g., whitespace trimming).
   2. Internal document validation runs: document.validate()
        │
        ├──> [FAILURE]: Schema rule violated (e.g. title is undefined or priority is invalid)
        │       │
        │       ├── 1. Mongoose halts the operation immediately.
        │       ├── 2. NO network request is dispatched to the MongoDB database!
        │       ├── 3. Mongoose constructs a `ValidationError` object containing a map
        │       │      of ValidatorError instances for every failed path.
        │       ├── 4. The Promise returned by .save() is rejected with the ValidationError.
        │       └── 5. Control passes to the controller's `catch(error)` block.
        │
        ▼
Controller invokes `next(error)`
        │
        ▼
Centralized `errorHandler` Middleware
        │
        ├── Inspects `err.name === 'ValidationError'`
        ├── Extracts field names, messages, and rejected values
        └── Sends clean, structured HTTP 400 Bad Request JSON response to client
```

**Where is the request stopped?**  
The request is stopped **inside the Node.js process at the Mongoose validation layer**. No write operation (`insertOne` or `update`) is ever issued to the MongoDB server, saving database CPU cycles and network bandwidth while keeping the database pristine.

---

## 🛠️ Schema Definition (`models/Task.js`)

```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required and cannot be empty'],
      minlength: [3, 'Task title must be at least 3 characters long'],
      maxlength: [100, 'Task title cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    completed: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '`{VALUE}` is not a valid priority. Allowed values are: low, medium, high'
      },
      default: 'medium',
      lowercase: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Supplementary 2: Pre-save hook for automatic whitespace trimming
taskSchema.pre('save', function (next) {
  if (this.title && typeof this.title === 'string') {
    this.title = this.title.trim();
  }
  if (this.description && typeof this.description === 'string') {
    this.description = this.description.trim();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
```

---

## 🔄 Transition: Practical 4 (In-Memory) vs Practical 5 (Mongoose)

| Operation | Practical 4 (In-Memory Array) | Practical 5 (Mongoose Model) |
|---|---|---|
| **Storage Engine** | `let tasks = [...]` (RAM only, lost on restart) | MongoDB Database (Persistent disk / BSON documents) |
| **Identifiers** | Manual auto-increment integer `id: nextId++` | 24-character hexadecimal `_id` (`ObjectId`) |
| **Create Task** | `tasks.push(newTask)` | `const task = new Task(data); await task.save();` |
| **Get All** | `res.json(tasks)` | `await Task.find(filters).sort({ createdAt: -1 })` |
| **Get by ID** | `tasks.find(t => t.id === id)` | `await Task.findById(id)` |
| **Update Task** | Array index lookup and in-place replacement | `await Task.findById(id)` + `.save()` (or `findByIdAndUpdate`) |
| **Delete Task** | `tasks.splice(index, 1)` | `await Task.findByIdAndDelete(id)` |
| **Validation** | Custom manual `if (!title) ...` middleware | Schema-level validation, enum check & pre-save trimming |

---

## 🛡️ Structured Validation Error Handling (`middleware/errorHandler.js`)

When raw Mongoose validation errors occur, sending raw error objects exposes internal library internals. Our centralized middleware intercepts `err.name === 'ValidationError'` and converts it into a clean, human-readable structure:

### Sample Raw Mongoose Error (What we avoid):
```json
{
  "errors": {
    "title": {
      "name": "ValidatorError",
      "message": "Task title is required and cannot be empty",
      "properties": { "message": "...", "type": "required", "path": "title" },
      "kind": "required",
      "path": "title"
    }
  },
  "_message": "Task validation failed",
  "name": "ValidationError"
}
```

### Clean Structured JSON Response (What our API returns):
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Validation Error",
  "message": "Validation failed for Task input",
  "errors": [
    {
      "field": "title",
      "message": "Task title is required and cannot be empty",
      "value": null
    },
    {
      "field": "priority",
      "message": "`urgent` is not a valid priority. Allowed values are: low, medium, high",
      "value": "urgent"
    }
  ]
}
```

---

## 🧪 Postman API Testing Guide

### 🚀 1-Click Import Option
Import `postman_collection.json` located in the root directory directly into Postman. It includes pre-configured collection variables (`{{baseUrl}}` and `{{taskId}}`) and automated tests.

---

### Step-by-Step Manual Requests in Postman

#### 1. Server & Database Health Check
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/health`
- **Expected Status:** `200 OK`
- **Response:**
```json
{
  "success": true,
  "status": "Server is healthy and operational",
  "database": {
    "status": "Connected",
    "readyState": 1,
    "name": "taskmanager_practical5"
  }
}
```

---

#### 2. Create Task with Priority (POST /tasks)
- **Method:** `POST`
- **URL:** `http://localhost:5000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "title": "Build Mongoose Task API",
  "description": "Implement schemas, hooks, and validations",
  "priority": "high",
  "completed": false
}
```
- **Expected Status:** `201 Created`
- **Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "6718d09f7a9f8162d1a3c7b2",
    "title": "Build Mongoose Task API",
    "description": "Implement schemas, hooks, and validations",
    "completed": false,
    "priority": "high",
    "createdAt": "2026-10-23T11:00:00.000Z",
    "updatedAt": "2026-10-23T11:00:00.000Z"
  }
}
```

---

#### 3. Test Pre-Save Trim Hook (Supplementary 2)
- **Method:** `POST`
- **URL:** `http://localhost:5000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "title": "   Backend with Mongoose   ",
  "description": "   Notice leading/trailing spaces   ",
  "priority": "medium"
}
```
- **Expected Status:** `201 Created`
- **Verification:** Observe that `data.title` in the response is trimmed to `"Backend with Mongoose"`.

---

#### 4. Test Missing Title Validation Error (400 Bad Request)
- **Method:** `POST`
- **URL:** `http://localhost:5000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "description": "Missing title test"
}
```
- **Expected Status:** `400 Bad Request`
- **Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Validation Error",
  "message": "Validation failed for Task input",
  "errors": [
    {
      "field": "title",
      "message": "Task title is required and cannot be empty",
      "value": null
    }
  ]
}
```

---

#### 5. Test Invalid Priority Enum (Supplementary 1 - 400 Bad Request)
- **Method:** `POST`
- **URL:** `http://localhost:5000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "title": "Resolve critical incident",
  "priority": "critical"
}
```
- **Expected Status:** `400 Bad Request`
- **Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Validation Error",
  "message": "Validation failed for Task input",
  "errors": [
    {
      "field": "priority",
      "message": "`critical` is not a valid priority. Allowed values are: low, medium, high",
      "value": "critical"
    }
  ]
}
```

---

#### 6. Get All Tasks (GET /tasks)
- **Method:** `GET`
- **URL:** `http://localhost:5000/tasks`
- **Optional Query Params:** `?completed=false&priority=high&search=backend`
- **Expected Status:** `200 OK`
- **Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [ ... ]
}
```

---

#### 7. Get Single Task by ID (GET /tasks/:id)
- **Method:** `GET`
- **URL:** `http://localhost:5000/tasks/<COPIED_TASK_ID>`
- **Expected Status:** `200 OK`
- **Response:**
```json
{
  "success": true,
  "data": {
    "_id": "<COPIED_TASK_ID>",
    "title": "Build Mongoose Task API",
    "completed": false,
    "priority": "high"
  }
}
```

---

#### 8. Test Non-Existent ID 404 Response (Supplementary 3)
- **Method:** `GET`
- **URL:** `http://localhost:5000/tasks/507f1f77bcf86cd799439011`
- **Expected Status:** `404 Not Found`
- **Response:**
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Task with ID '507f1f77bcf86cd799439011' not found in database"
}
```

---

#### 9. Test Malformed ObjectId CastError (400 Bad Request)
- **Method:** `GET`
- **URL:** `http://localhost:5000/tasks/invalid-id-xyz`
- **Expected Status:** `400 Bad Request`
- **Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Invalid ID Format",
  "message": "Invalid format for '_id': 'invalid-id-xyz' is not a valid 24-character hexadecimal MongoDB ObjectId"
}
```

---

#### 10. Update Task (PUT /tasks/:id)
- **Method:** `PUT`
- **URL:** `http://localhost:5000/tasks/<COPIED_TASK_ID>`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "title": "Build Mongoose Task API (Completed)",
  "completed": true,
  "priority": "low"
}
```
- **Expected Status:** `200 OK`
- **Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "_id": "<COPIED_TASK_ID>",
    "title": "Build Mongoose Task API (Completed)",
    "completed": true,
    "priority": "low"
  }
}
```

---

#### 11. Delete Task (DELETE /tasks/:id)
- **Method:** `DELETE`
- **URL:** `http://localhost:5000/tasks/<COPIED_TASK_ID>`
- **Expected Status:** `200 OK`
- **Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": {
    "id": "<COPIED_TASK_ID>",
    "title": "Build Mongoose Task API (Completed)"
  }
}
```

---

## ⚡ How to Run the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager_practical5
```
*(If local MongoDB is not running, the application automatically boots an in-memory MongoDB instance with zero configuration).*

### 3. Start the Server
```bash
npm start
```
- **Web UI & Live Tester:** `http://localhost:5000`
- **REST API Endpoint:** `http://localhost:5000/tasks`
- **Health Check Endpoint:** `http://localhost:5000/api/health`

### 4. Run Automated Tests
```bash
npm test
```
The automated test suite runs 13 end-to-end integration tests validating all CRUD routes, pre-save hooks, enums, CastErrors, and 404 responses.

---

## 📁 Project Structure

```
Practical5/
├── config/
│   └── db.js                    # Mongoose database connection with memory fallback
├── controllers/
│   └── taskController.js        # Mongoose CRUD operations & business logic
├── middleware/
│   ├── errorHandler.js          # Centralized structured JSON error handler
│   └── notFound.js              # 404 route middleware
├── models/
│   └── Task.js                  # Mongoose Schema, priority enum & pre-save hook
├── public/                      # Interactive Web Client & Live Tester
│   ├── app.js                   # Client-side dynamic interactivity
│   ├── index.html               # Semantic HTML5 UI layout
│   └── style.css                # Glassmorphism dark mode design system
├── routes/
│   └── taskRoutes.js            # Express router mapping /tasks endpoints
├── tests/
│   └── test-api.js              # Automated test suite
├── .env                         # Environment variables
├── .env.example                 # Example configuration
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies & scripts
├── postman_collection.json      # Ready-to-import Postman collection
└── README.md                    # Practical 5 documentation & analysis
```
