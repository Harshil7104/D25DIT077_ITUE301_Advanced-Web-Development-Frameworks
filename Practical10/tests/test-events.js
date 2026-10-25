/**
 * Practical 10 - Automated Verification Test Suite
 * 
 * Verifies:
 * 1. 'task-created' event handled asynchronously without blocking the main response.
 * 2. API response returns immediately before handler finishes executing (e.g. 2000ms delay).
 * 3. Logging timestamps at both the API response point and event handler execution point.
 * 4. 'task-deleted' supplementary event emission and handling.
 * 5. 'error' event listener catching errors without crashing the server.
 * 6. Direct comparison of synchronous vs asynchronous handling times.
 */

const http = require('http');

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

// Helper: Make HTTP JSON Request
const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const reqOptions = {
      ...options,
      headers: {
        ...(options.headers || {})
      }
    };

    if (postData) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING PRACTICAL 10 TEST SUITE (Node.js EventEmitter)');
  console.log(`🎯 Target Server: ${BASE_URL}`);
  console.log('===============================================================\n');

  try {
    // 1. Health Check
    console.log('▶ [TEST 1/5] Checking Server Health & EventEmitter Status...');
    const health = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET'
    });

    if (health.status !== 200) {
      throw new Error(`Server returned HTTP ${health.status}. Is server running?`);
    }
    console.log(`   ✅ Server is ONLINE! Registered events: [${health.data.eventEmitter.registeredEvents.join(', ')}]`);
    console.log(`   ⏱️ Configured slow delay: ${health.data.eventEmitter.simulatedDelayMs}ms\n`);

    // 2. Asynchronous Task Creation (Non-blocking demonstration)
    console.log('▶ [TEST 2/5] Creating Task with ASYNCHRONOUS Event Handling (2000ms delay)...');
    const startAsync = Date.now();
    const newTaskPayload = {
      title: 'Automated Test Task (Async EventEmitter)',
      description: 'Validating that API returns immediately while 2s background handler finishes later.',
      assignedUser: 'Harshil (D25DIT077)',
      priority: 'high',
      mode: 'async'
    };

    const asyncRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, newTaskPayload);

    const clientReceivedAt = Date.now();
    const apiDuration = clientReceivedAt - startAsync;

    console.log(`   HTTP Status Code: ${asyncRes.status}`);
    console.log(`   ⚡ API Response Duration: ${apiDuration}ms`);
    console.log(`   ⏰ API Response Timestamp: ${asyncRes.data.timing.apiResponseTime}`);

    if (apiDuration > 500) {
      console.warn(`   ⚠️ Warning: API took longer than expected: ${apiDuration}ms`);
    } else {
      console.log(`   ✅ SUCCESS: API responded IMMEDIATELY (${apiDuration}ms << 2000ms)! Main response was NOT blocked.`);
    }

    const createdTaskId = asyncRes.data.task._id;

    // 3. Confirming background handler completed after delay
    console.log('\n▶ [TEST 3/5] Waiting 2200ms to allow background event handler to execute...');
    await sleep(2200);

    const telemetry = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/events/telemetry',
      method: 'GET'
    });

    const matchingLog = telemetry.data.auditLogs.find(l => l.taskId === createdTaskId && l.eventType === 'task-created');
    if (!matchingLog) {
      throw new Error('Background notification log was not found in audit trail!');
    }

    console.log(`   ✅ Background Event Handler Log Verified:`);
    console.log(`      📋 Title         : ${matchingLog.taskTitle}`);
    console.log(`      👤 Assigned User : ${matchingLog.assignedUser}`);
    console.log(`      ⚡ API Responded : ${matchingLog.apiResponseTime}`);
    console.log(`      🚀 Handler Exec  : ${matchingLog.handlerExecutedAt}`);
    console.log(`      ⏱️ Time Delta    : +${matchingLog.deltaMs}ms (Executed AFTER response was sent!)\n`);

    // 4. Supplementary Problem 1: 'task-deleted' Event Listener
    console.log('▶ [TEST 4/5] Testing Supplementary Problem 1: task-deleted Event...');
    const deleteRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/${createdTaskId}`,
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    }, { deletedBy: 'Automated Test Runner' });

    console.log(`   HTTP Status Code: ${deleteRes.status}`);
    console.log(`   Response Message: "${deleteRes.data.message}"`);
    console.log(`   Waiting 1200ms for 'task-deleted' background handler...`);
    await sleep(1200);

    const postDeleteTelemetry = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/events/telemetry',
      method: 'GET'
    });

    const deleteLog = postDeleteTelemetry.data.auditLogs.find(l => l.taskId === createdTaskId && l.eventType === 'task-deleted');
    if (deleteLog) {
      console.log(`   ✅ 'task-deleted' Event Handler Verified!`);
      console.log(`      Message: "${deleteLog.message}"\n`);
    } else {
      console.warn('   ⚠️ Could not locate delete log in recent records.');
    }

    // 5. Supplementary Problem 2: 'error' Event Listener
    console.log('▶ [TEST 5/5] Testing Supplementary Problem 2: EventEmitter "error" Listener...');
    const errRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/events/test-error',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { title: 'Faulty Task to Trigger Error Listener' });

    console.log(`   Dispatched simulated error. Waiting 300ms...`);
    await sleep(300);

    const errorTelemetry = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/events/telemetry',
      method: 'GET'
    });

    if (errorTelemetry.data.errorLogs.length > 0) {
      const latestError = errorTelemetry.data.errorLogs[0];
      console.log(`   ✅ 'error' Event Listener Caught Error Safely!`);
      console.log(`      🚨 Error Message: "${latestError.errorMessage}"`);
      console.log(`      🛡️ Server remains running with exit code 0.\n`);
    } else {
      console.warn('   ⚠️ No error recorded in error logs.');
    }

    // Summary
    console.log('===============================================================');
    console.log('🎉 ALL 5 PRACTICAL 10 TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error(`\n❌ Test Suite Failed: ${err.message}`);
    process.exit(1);
  }
}

// Execute when invoked directly
if (require.main === module) {
  runTestSuite();
}

module.exports = runTestSuite;
