# Practical 10: Background Notification System using Node.js EventEmitter

**Student Name:** Harshil  
**Student ID:** D25DIT077  
**Course:** ITUE301 - Advanced Web Development Frameworks  
**Technology Stack:** Node.js (v24), Express, EventEmitter, Mongoose / MongoDB (with MongoMemoryServer fallback), Vanilla CSS Glassmorphism  

---

## 📌 Executive Summary & Problem Overview

In high-concurrency web applications, API response latency directly dictates user experience. Secondary actions such as sending emails, dispatching SMS alerts, logging audit events, or notifying third-party webhooks should never block the primary HTTP request-response cycle.

This project implements a production-grade **Background Notification System** using Node.js's built-in `EventEmitter` module:
- When a task is created (`POST /api/tasks`), a `task-created` event is emitted.
- The event handler runs **asynchronously in the background**, simulating a slow external service (e.g., 2000ms delay via `setTimeout`).
- The HTTP response (`201 Created`) is returned **immediately** to the client before the background handler finishes executing.
- Both points log precise ISO timestamps with millisecond accuracy, conclusively proving the non-blocking nature of the event loop.

---

## 🚀 Key Features & Supplementary Solutions

| Feature / Problem | Requirement | Implementation Details |
| :--- | :--- | :--- |
| **Primary Requirement** | EventEmitter Background System | Subclassed `EventEmitter` in `events/notificationEmitter.js` to dispatch non-blocking notifications. |
| **Non-Blocking API** | Immediate Response | API responds in ~5–15ms, while simulated 2000ms background notification completes independently. |
| **Timing Telemetry** | Timestamp Logging | Logs ISO timestamps with millisecond precision at both API response (`T1`) and event execution (`T2`). |
| **Supplementary 1** | `task-deleted` Event | Listens for task deletions via `DELETE /api/tasks/:id` and logs a distinct background removal audit message. |
| **Supplementary 2** | `error` Event Listener | Registered dedicated `error` event listener to catch and log any error thrown inside handlers without crashing Node. |
| **Supplementary 3** | Slow Handler Simulation | Configurable delay slider (0ms – 5000ms, default 2000ms) with `setTimeout` simulating real-world slow network latency. |
| **Comparative Benchmark** | Sync vs Async Demo | In-engine comparison demonstrating the severe impact of synchronous thread blocking vs asynchronous yielding. |

---

## 🏛️ Architecture & Node.js Event Loop Model

```
                    ┌────────────────────────────┐
                    │     HTTP Client Request    │
                    │      (POST /api/tasks)     │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │    taskController.js       │
                    │  - Save Task to Database   │
                    │  - Capture T1 (Response)   │
                    │  - Emit 'task-created'     │
                    └───────┬────────────┬───────┘
                            │            │
            (Instant Return)│            │ (Asynchronous Event Dispatch)
                            ▼            ▼
             ┌─────────────────────┐   ┌──────────────────────────────┐
             │ HTTP 201 Response   │   │  notificationEmitter.js      │
             │ Returned in ~8ms    │   │  - Schedules Handler via     │
             │ Client is Unblocked │   │    setTimeout(..., 2000ms)   │
             └─────────────────────┘   └──────────────┬───────────────┘
                                                      │
                                                      ▼ (Event Loop Timer Phase)
                                       ┌──────────────────────────────┐
                                       │ Background Handler Executed  │
                                       │ - Logs Task Title & Assigned │
                                       │ - Captures T2 (Execution)    │
                                       │ - Elapsed Delta: +2,008 ms   │
                                       └──────────────────────────────┘
```

### Why EventEmitter Needs Asynchronous Handlers in Node.js
By default, Node.js `emitter.emit()` executes all registered listeners **synchronously in the current call stack**. If a listener performs CPU-intensive tasks or synchronous blocking code, it freezes the main thread. To achieve non-blocking behavior:
1. The listener wraps processing in asynchronous APIs (`setTimeout`, `setImmediate`, or `process.nextTick`).
2. Execution yields to libuv's event loop, allowing the Express route handler to finish and send the HTTP response immediately.

---

## ⏱️ Sample Execution Timestamps & Proof of Non-Blocking Behavior

Below is actual recorded log output from the application:

```bash
======================================================
⚡ [API CONTROLLER - ASYNC MODE] HTTP 201 Response returned IMMEDIATELY.
⏱️ Response Timestamp: 2026-10-25T15:53:37.363Z | Duration: 11ms.
🔔 Background handler will complete independently.
======================================================

======================================================
📢 [EVENT NOTIFICATION - task-created (ASYNCHRONOUS BACKGROUND)]
📋 Task Title      : Deploy microservices to Kubernetes
👤 Assigned User   : Harshil (D25DIT077)
🆔 Task ID         : 671bc9d75b31f00a294b011e
⚡ API Response At : 2026-10-25T15:53:37.363Z
🚀 Handler Exec At : 2026-10-25T15:53:39.371Z
⏱️ Elapsed Delta   : +2008 ms (Handler completed after response)
⚙️ Mode            : Asynchronous (Non-Blocking)
======================================================
```

### Analysis of Timestamps:
- **API Response Point (`T1`):** `15:53:37.363Z` (Responded in **11 ms**).
- **Handler Execution Point (`T2`):** `15:53:39.371Z` (Completed **2,008 ms** later).
- **Proof:** `T1 < T2`. The client received the HTTP 201 status code more than 2 full seconds **before** the notification handler executed!

---

## 🧪 Synchronous vs Asynchronous Handling Comparison

| Metric | Synchronous Handling (Blocking) | Asynchronous Handling (Node.js EventEmitter) |
| :--- | :--- | :--- |
| **Event Loop Thread** | Frozen / Blocked for 2000ms | Free to accept new HTTP connections |
| **API Response Time** | ~2,015 ms (Client waits) | ~8 – 15 ms (Instantaneous) |
| **Concurrency Impact**| Halts all incoming requests | Zero impact on other users |
| **Fault Isolation**   | An unhandled throw crashes API | Caught cleanly by `'error'` event listener |

---

## 🛠️ API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and registered event names. |
| `POST` | `/api/tasks` | Create task and asynchronously emit `'task-created'`. |
| `GET` | `/api/tasks` | Retrieve all tasks. |
| `DELETE`| `/api/tasks/:id` | Delete task and asynchronously emit `'task-deleted'`. |
| `GET` | `/api/events/telemetry` | Retrieve audit history and caught error logs. |
| `POST` | `/api/events/delay` | Configure simulated background delay (`{ "delayMs": 2000 }`). |
| `POST` | `/api/events/test-error` | Deliberate fault injection to test the `'error'` listener. |
| `GET` | `/api/events/benchmark` | Automated in-engine Synchronous vs Asynchronous benchmark. |

---

## 💻 How to Run the Application

### 1. Start the Server
```bash
npm start
```
*The server starts on `http://localhost:5001`. Access the web dashboard in any browser.*

### 2. Run the Automated Verification Suite
```bash
npm test
```
*Validates non-blocking response speed (<50ms), timestamp delta (+2000ms), `task-deleted` event, and the `error` event listener.*

### 3. Run the Standalone Benchmark
```bash
npm run benchmark
```
*Prints comparative timing tables demonstrating synchronous blocking vs asynchronous non-blocking execution.*
