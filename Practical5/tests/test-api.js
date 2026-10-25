/**
 * Practical 5 Automated CRUD and Schema Validation Test Suite
 * Tests all requirements, validation error formats, and supplementary problems.
 * 
 * Run with: npm test
 */

const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Practical 5: Automated CRUD & Schema Validation Tests');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Server Health & DB Status (/api/health)...');
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200, 'GET /api/health returned HTTP 200');
    assert(health.data.success === true, 'Health check reported success: true');
    assert(health.data.database && health.data.database.readyState === 1, 'Database connected (readyState: 1)');

    // 2. Schema Validation: Missing Required Field
    console.log('\n2️⃣ Testing Validation: Missing Required Title...');
    const noTitle = await makeRequest('POST', '/tasks', { description: 'Missing title test' });
    assert(noTitle.status === 400, 'POST /tasks without title returned HTTP 400 Bad Request');
    assert(noTitle.data.success === false, 'Error response format has success: false');
    assert(noTitle.data.error === 'Validation Error', 'Error type is "Validation Error"');
    assert(Array.isArray(noTitle.data.errors) && noTitle.data.errors.some(e => e.field === 'title'), 'Contains structured error for "title" field');

    // 3. Schema Validation: Title Under Minimum Length (< 3 chars)
    console.log('\n3️⃣ Testing Validation: Title Under Minimum Length...');
    const shortTitle = await makeRequest('POST', '/tasks', { title: 'Go' });
    assert(shortTitle.status === 400, 'POST /tasks with title < 3 chars returned HTTP 400');
    assert(shortTitle.data.errors[0].message.includes('at least 3 characters'), 'Contains minimum length error message');

    // 4. Supplementary 1: Priority Enum Validation
    console.log('\n4️⃣ Testing Supplementary 1: Priority Enum Validation (invalid: "critical")...');
    const invalidPriority = await makeRequest('POST', '/tasks', {
      title: 'Fix server bug',
      priority: 'critical'
    });
    assert(invalidPriority.status === 400, 'POST /tasks with invalid priority returned HTTP 400');
    assert(invalidPriority.data.errors.some(e => e.field === 'priority'), 'Structured error identifies invalid "priority" field');

    // 5. Supplementary 2: Pre-save Whitespace Trimming Hook
    console.log('\n5️⃣ Testing Supplementary 2: Pre-save Whitespace Trimming Hook...');
    const untrimmedTask = await makeRequest('POST', '/tasks', {
      title: '   Build Backend with Mongoose   ',
      description: '   Testing pre-save trim hook   ',
      priority: 'high'
    });
    assert(untrimmedTask.status === 201, 'POST /tasks returned HTTP 201 Created');
    assert(untrimmedTask.data.data.title === 'Build Backend with Mongoose', 'Pre-save hook successfully trimmed leading and trailing spaces from title');
    assert(untrimmedTask.data.data.description === 'Testing pre-save trim hook', 'Pre-save hook successfully trimmed spaces from description');
    assert(untrimmedTask.data.data.priority === 'high', 'Priority set to "high"');
    assert(untrimmedTask.data.data.completed === false, 'Default value for completed is false');
    assert(Boolean(untrimmedTask.data.data.createdAt), 'Default createdAt timestamp generated');

    const createdId = untrimmedTask.data.data._id;
    assert(typeof createdId === 'string' && createdId.length === 24, 'Generated valid 24-character MongoDB ObjectId');

    // 6. Default Priority
    console.log('\n6️⃣ Testing Default Priority Field (Supplementary 1)...');
    const defaultPriorityTask = await makeRequest('POST', '/tasks', {
      title: 'Review Unit Tests'
    });
    assert(defaultPriorityTask.status === 201, 'POST /tasks returned HTTP 201');
    assert(defaultPriorityTask.data.data.priority === 'medium', 'Default priority set to "medium"');

    // 7. GET /tasks - Fetch All
    console.log('\n7️⃣ Testing Fetch All Tasks (GET /tasks)...');
    const allTasks = await makeRequest('GET', '/tasks');
    assert(allTasks.status === 200, 'GET /tasks returned HTTP 200 OK');
    assert(Array.isArray(allTasks.data.data), 'Returns array of tasks');
    assert(allTasks.data.count >= 2, `Task count is ${allTasks.data.count}`);

    // 8. GET /tasks/:id - Fetch Single Task
    console.log(`\n8️⃣ Testing Fetch Single Task (GET /tasks/${createdId})...`);
    const singleTask = await makeRequest('GET', `/tasks/${createdId}`);
    assert(singleTask.status === 200, 'GET /tasks/:id returned HTTP 200 OK');
    assert(singleTask.data.data._id === createdId, 'Fetched task matches requested ID');

    // 9. Supplementary 3: Non-existent ID returns 404 JSON
    console.log('\n9️⃣ Testing Supplementary 3: Non-existent Task ID returns 404 JSON...');
    const nonExistentId = '507f1f77bcf86cd799439011';
    const notFoundRes = await makeRequest('GET', `/tasks/${nonExistentId}`);
    assert(notFoundRes.status === 404, 'GET /tasks/:id for missing ID returns HTTP 404');
    assert(notFoundRes.data.success === false, 'Error response has success: false');
    assert(notFoundRes.data.error === 'Not Found', 'Error type is "Not Found"');

    // 10. CastError Handling (Invalid format ObjectId)
    console.log('\n🔟 Testing CastError Handling (Malformed ObjectId in URL)...');
    const malformedIdRes = await makeRequest('GET', '/tasks/invalid-id-xyz');
    assert(malformedIdRes.status === 400, 'Malformed ID returned HTTP 400 Bad Request');
    assert(malformedIdRes.data.error === 'Invalid ID Format', 'Error type is "Invalid ID Format"');

    // 11. PUT /tasks/:id - Update Task
    console.log(`\n1️⃣1️⃣ Testing Update Task (PUT /tasks/${createdId})...`);
    const updateRes = await makeRequest('PUT', `/tasks/${createdId}`, {
      title: '   Build Backend with Mongoose (Completed)   ',
      completed: true,
      priority: 'low'
    });
    assert(updateRes.status === 200, 'PUT /tasks/:id returned HTTP 200');
    assert(updateRes.data.data.title === 'Build Backend with Mongoose (Completed)', 'Pre-save hook ran and trimmed updated title');
    assert(updateRes.data.data.completed === true, 'Completed flag updated to true');
    assert(updateRes.data.data.priority === 'low', 'Priority updated to "low"');

    // 12. DELETE /tasks/:id - Delete Task
    console.log(`\n1️⃣2️⃣ Testing Delete Task (DELETE /tasks/${createdId})...`);
    const deleteRes = await makeRequest('DELETE', `/tasks/${createdId}`);
    assert(deleteRes.status === 200, 'DELETE /tasks/:id returned HTTP 200');
    assert(deleteRes.data.success === true, 'Delete response reports success: true');

    // 13. Verify Deleted Task Returns 404
    console.log(`\n1️⃣3️⃣ Verifying Deleted Task Returns 404...`);
    const verifyDeleted = await makeRequest('GET', `/tasks/${createdId}`);
    assert(verifyDeleted.status === 404, 'Deleted task now returns HTTP 404 Not Found');

    console.log('\n========================================================');
    console.log(`🎉 Automated Test Suite Completed!`);
    console.log(`📊 Summary: ${passed} Passed, ${failed} Failed`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('⚠️ Test suite encountered error:', err.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runTests();
}

module.exports = runTests;
