/**
 * Automated Verification & Test Suite for Practical 7
 * 
 * Verifies:
 *  1. User Registration (Name, Email, Password) & Duplicate Email rejection
 *  2. Bcrypt Password Hashing before saving to MongoDB
 *  3. User Login & JWT Token generation with 1-hour expiry
 *  4. Supplementary Problem 1: /me endpoint with decoded JWT
 *  5. Route Protection: Protected task routes reject missing/invalid tokens (HTTP 401)
 *  6. Server-Side Input Validation: Malformed requests rejected before DB (HTTP 400)
 *  7. Protected Task CRUD & User Data Isolation
 *  8. Supplementary Problem 3: Logout endpoint
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const User = require('../models/User');
const Task = require('../models/Task');
const app = require('../server');

const TEST_PORT = 5055;
let serverInstance;
let BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Colors for clean CLI output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ${colors.green}✓ PASS:${colors.reset} ${message}`);
    passed++;
  } else {
    console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}🧪 PRACTICAL 7: COMPREHENSIVE AUTOMATED TEST SUITE${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  try {
    // Start isolated test server
    serverInstance = app.listen(TEST_PORT);
    // Allow DB connection to settle
    await new Promise(r => setTimeout(r, 1000));

    // Clear test collections
    await User.deleteMany({});
    await Task.deleteMany({});

    // -------------------------------------------------------------
    // Test Group 1: Server-Side Input Validation (Pre-Database)
    // -------------------------------------------------------------
    console.log(`${colors.bold}Test Group 1: Server-Side Input Validation (Rejection before DB)${colors.reset}`);

    // 1.1 Reject registration with invalid email
    const regBadEmail = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'invalid-email-format', password: 'password123' })
    });
    const regBadEmailData = await regBadEmail.json();
    assert(regBadEmail.status === 400, 'Rejects registration with invalid email format (HTTP 400)');
    assert(regBadEmailData.error === 'Input Validation Error', 'Returns "Input Validation Error" type');

    // 1.2 Reject registration with short password (< 6 chars)
    const regShortPass = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', password: '123' })
    });
    assert(regShortPass.status === 400, 'Rejects registration with password shorter than 6 characters (HTTP 400)');

    // -------------------------------------------------------------
    // Test Group 2: User Registration & Bcrypt Password Hashing
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}Test Group 2: User Registration & Bcrypt Hashing${colors.reset}`);

    const user1Payload = {
      name: 'Harshil Student',
      email: 'harshil@example.com',
      password: 'SecurePassword123!'
    };

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user1Payload)
    });
    const regData = await regRes.json();

    assert(regRes.status === 201, 'User registered successfully (HTTP 201)');
    assert(regData.success === true, 'Response indicates success = true');
    assert(!!regData.token, 'Registration issues a valid JWT token');
    assert(regData.user.email === 'harshil@example.com', 'User email returned accurately');
    assert(regData.user.password === undefined, 'Password is NOT exposed in API response');

    // 2.2 Verify bcrypt hashing in MongoDB
    const dbUser = await User.findOne({ email: 'harshil@example.com' });
    assert(!!dbUser, 'User document exists in MongoDB');
    assert(dbUser.password !== user1Payload.password, 'Password in MongoDB is NOT plaintext');
    assert(dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$'), 'Password is encrypted using standard bcrypt hash ($2a$/$2b$)');

    // 2.3 Reject duplicate email registration
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user1Payload)
    });
    assert(dupRes.status === 409, 'Rejects registration with duplicate email (HTTP 409)');

    // -------------------------------------------------------------
    // Test Group 3: User Login & JWT Generation
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}Test Group 3: User Login & JWT Generation (1-hour expiry)${colors.reset}`);

    // 3.1 Bad password rejection
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'harshil@example.com', password: 'WrongPassword' })
    });
    assert(badLoginRes.status === 401, 'Rejects invalid credentials with HTTP 401 Unauthorized');

    // 3.2 Successful login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'harshil@example.com', password: 'SecurePassword123!' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'User logged in successfully (HTTP 200)');
    assert(!!loginData.token, 'Login returns JWT token');

    const token = loginData.token;

    // Decode token and verify 1-hour expiry
    const payloadBase64 = token.split('.')[1];
    const payloadJson = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    const lifespanSeconds = payloadJson.exp - payloadJson.iat;
    assert(lifespanSeconds === 3600, `JWT expiry is exactly 1 hour (3600s), actual: ${lifespanSeconds}s`);
    assert(payloadJson.email === 'harshil@example.com', 'JWT payload contains user email');

    // -------------------------------------------------------------
    // Test Group 4: Supplementary Problem 1 (/me endpoint)
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}Test Group 4: Supplementary Problem 1 (/me Endpoint)${colors.reset}`);

    // 4.1 Unauthorized without token
    const meNoToken = await fetch(`${BASE_URL}/api/auth/me`);
    assert(meNoToken.status === 401, 'Accessing /me without token returns HTTP 401 Unauthorized');

    // 4.2 Authorized with JWT
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'Accessing /me with valid token returns HTTP 200');
    assert(meData.data.email === 'harshil@example.com', 'Returns logged-in user details from decoded JWT');
    assert(!!meData.tokenDetails.expiresInSeconds, 'Returns token expiration metadata');

    // -------------------------------------------------------------
    // Test Group 5: Route Protection on Tasks (Authentication Middleware)
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}Test Group 5: Route Protection on Tasks (Auth Middleware)${colors.reset}`);

    // 5.1 GET /tasks without token
    const tasksNoToken = await fetch(`${BASE_URL}/tasks`);
    assert(tasksNoToken.status === 401, 'GET /tasks without token returns HTTP 401 Unauthorized');

    // 5.2 POST /tasks without token
    const postNoToken = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Task' })
    });
    assert(postNoToken.status === 401, 'POST /tasks without token returns HTTP 401 Unauthorized');

    // 5.3 GET /tasks with forged / invalid token
    const forgedToken = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: 'Bearer forged.token.signature' }
    });
    assert(forgedToken.status === 401, 'Rejects invalid/malformed JWT with HTTP 401');

    // -------------------------------------------------------------
    // Test Group 6: Task Creation Input Validation (before DB)
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}Test Group 6: Task Validation (Rejection before reaching DB)${colors.reset}`);

    // 6.1 Missing title
    const missingTitleRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ description: 'A task with no title' })
    });
    const missingTitleData = await missingTitleRes.json();
    assert(missingTitleRes.status === 400, 'Rejects task creation with missing title (HTTP 400)');
    assert(missingTitleData.message.includes('Task title is required'), 'Returns descriptive error message for missing title');

    // 6.2 Invalid priority enum
    const badPriorityRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: 'Valid Title', priority: 'ultra-high' })
    });
    assert(badPriorityRes.status === 400, 'Rejects task creation with invalid priority (HTTP 400)');

    // -------------------------------------------------------------
    // Test Group 7: Protected Task CRUD & User Isolation
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}Test Group 7: Protected Task CRUD & User Data Isolation${colors.reset}`);

    // 7.1 Create Task for User 1
    const createRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Study Advanced Web Development',
        description: 'Complete Practical 7 with JWT authentication',
        priority: 'high'
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Task created successfully under authenticated user (HTTP 201)');
    const taskId = createData.data._id;

    // 7.2 Register User 2
    const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Second', email: 'bob@example.com', password: 'PasswordBob456!' })
    });
    const reg2Data = await reg2Res.json();
    const tokenUser2 = reg2Data.token;

    // 7.3 User 2 queries tasks -> should be 0 (cannot see User 1's task)
    const user2TasksRes = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${tokenUser2}` }
    });
    const user2Tasks = await user2TasksRes.json();
    assert(user2Tasks.count === 0, 'User 2 cannot see User 1 tasks (User Isolation active)');

    // 7.4 User 2 tries to update User 1's task -> 404
    const user2Update = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUser2}`
      },
      body: JSON.stringify({ title: 'Hacked by Bob' })
    });
    assert(user2Update.status === 404, 'User 2 cannot modify User 1 task (HTTP 404 / Unauthorized)');

    // 7.5 User 1 updates own task
    const user1Update = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ completed: true })
    });
    const user1UpdateData = await user1Update.json();
    assert(user1Update.status === 200, 'User 1 successfully updates own task (HTTP 200)');
    assert(user1UpdateData.data.completed === true, 'Task completed status updated in DB');

    // 7.6 User 1 deletes own task
    const user1Delete = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(user1Delete.status === 200, 'User 1 successfully deletes own task (HTTP 200)');

    // -------------------------------------------------------------
    // Test Group 8: Supplementary Problem 3 (Logout endpoint)
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}Test Group 8: Supplementary Problem 3 (Logout Endpoint)${colors.reset}`);
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    const logoutData = await logoutRes.json();
    assert(logoutRes.status === 200, 'Logout acknowledgment endpoint returns HTTP 200');
    assert(logoutData.success === true, 'Logout acknowledgment returns success = true');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
    console.log(`${colors.bold}Test Summary:${colors.reset} Total Passed: ${colors.green}${passed}${colors.reset} | Failed: ${failed > 0 ? colors.red + failed + colors.reset : '0'}`);
    console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await disconnectDB();
    process.exit(process.exitCode || 0);
  }
}

runTests();
