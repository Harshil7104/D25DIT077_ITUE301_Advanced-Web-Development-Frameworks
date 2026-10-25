const http = require('http');
const app = require('../server');
const { disconnectDB } = require('../config/db');

let serverInstance;
let BASE_URL;

// Helper to make HTTP requests
const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
};

const runTests = async () => {
  console.log(`================================================================`);
  console.log(`🧪 PRACTICAL 9: AUTOMATED IN-MEMORY CACHING TEST SUITE`);
  console.log(`================================================================\n`);

  // Start test server on random open port
  await new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      const port = serverInstance.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      console.log(`🚀 Test Server running at ${BASE_URL}\n`);
      resolve();
    });
  });

  // Wait for database connection and seeding to complete
  console.log('⏳ Awaiting database connection and initial seeding...');
  await app.initPromise;
  await sleep(500);

  try {
    // -------------------------------------------------------------
    // Test Group 0: Reset Cache & Verify Initial State
    // -------------------------------------------------------------
    console.log('Test Group 0: Cache Reset & Initialization');
    await request('POST', '/api/cache/flush');
    await request('POST', '/api/cache/reset-stats');

    const initStats = await request('GET', '/api/cache/stats');
    assert(initStats.statusCode === 200, 'GET /api/cache/stats returns HTTP 200');
    assert(initStats.data.summary.hits === 0, 'Initial cache hits equal 0');
    assert(initStats.data.summary.misses === 0, 'Initial cache misses equal 0');
    assert(initStats.data.summary.currentTTL === 60, 'Initial standard TTL is 60 seconds (requirement)');

    // -------------------------------------------------------------
    // Test Group 1: All-Tasks GET /tasks Caching (Hit vs Miss)
    // -------------------------------------------------------------
    console.log('\nTest Group 1: Requirement - Caching GET /tasks with 60s TTL');
    // First request should be a MISS
    const firstGet = await request('GET', '/tasks');
    assert(firstGet.statusCode === 200, 'GET /tasks returns HTTP 200');
    assert(firstGet.headers['x-cache'] === 'MISS', 'First request has header X-Cache: MISS');
    assert(firstGet.data.cacheStatus === 'MISS', 'Response body indicates cacheStatus = MISS');
    assert(firstGet.data.count > 0, 'Tasks retrieved successfully from MongoDB');

    // Second request should be a HIT
    const secondGet = await request('GET', '/tasks');
    assert(secondGet.statusCode === 200, 'Second GET /tasks returns HTTP 200');
    assert(secondGet.headers['x-cache'] === 'HIT', 'Second request has header X-Cache: HIT');
    assert(secondGet.data.cacheStatus === 'HIT', 'Response body indicates cacheStatus = HIT');
    assert(secondGet.data.cached === true, 'Response body indicates cached = true');
    assert(secondGet.data.ttlRemainingSeconds <= 60 && secondGet.data.ttlRemainingSeconds > 0, 'TTL remaining is within 60 seconds');

    // -------------------------------------------------------------
    // Test Group 2: Supplementary 1 - Single-Task GET /tasks/:id Caching
    // -------------------------------------------------------------
    console.log('\nTest Group 2: Supplementary 1 - Independent Single-Task Caching (GET /tasks/:id)');
    const sampleTaskId = firstGet.data.data[0]._id;

    // First request to single task: MISS
    const singleMiss = await request('GET', `/tasks/${sampleTaskId}`);
    assert(singleMiss.statusCode === 200, `GET /tasks/:id returns HTTP 200`);
    assert(singleMiss.headers['x-cache'] === 'MISS', 'First single-task request is X-Cache: MISS');
    assert(singleMiss.data.cacheKey === `task:${sampleTaskId}`, `Cache key follows single-task pattern 'task:${sampleTaskId}'`);

    // Second request to single task: HIT
    const singleHit = await request('GET', `/tasks/${sampleTaskId}`);
    assert(singleHit.statusCode === 200, 'Second single-task request returns HTTP 200');
    assert(singleHit.headers['x-cache'] === 'HIT', 'Second single-task request is X-Cache: HIT');
    assert(singleHit.data.cached === true, 'Response indicates cached = true');

    // Check keys in cache: should have both all-tasks and single-task
    const keysRes = await request('GET', '/api/cache/keys');
    const keyNames = keysRes.data.keys.map((k) => k.key);
    assert(keyNames.includes('tasks:all'), 'Cache contains "tasks:all" key');
    assert(keyNames.includes(`task:${sampleTaskId}`), `Cache contains independent "task:${sampleTaskId}" key`);

    // -------------------------------------------------------------
    // Test Group 3: Requirement - Cache Invalidation on POST (Write)
    // -------------------------------------------------------------
    console.log('\nTest Group 3: Requirement - Cache Invalidation on POST');
    const newPost = await request('POST', '/tasks', {
      title: 'New Dynamic Task for Invalidation Test',
      description: 'Testing automatic cache clearing upon creation',
      priority: 'high'
    });
    assert(newPost.statusCode === 201, 'POST /tasks creates task successfully (HTTP 201)');
    assert(newPost.data.cacheInvalidated === true, 'POST response confirms cacheInvalidated: true');

    // Subsequent GET /tasks MUST be a MISS (stale data never served)
    const postGet1 = await request('GET', '/tasks');
    assert(postGet1.headers['x-cache'] === 'MISS', 'Subsequent GET /tasks is MISS after POST');
    const createdFound = postGet1.data.data.some((t) => t.title === 'New Dynamic Task for Invalidation Test');
    assert(createdFound === true, 'New task is immediately visible in fresh response (no stale data)');

    // And the next GET /tasks is a HIT with the new data
    const postGet2 = await request('GET', '/tasks');
    assert(postGet2.headers['x-cache'] === 'HIT', 'Next GET /tasks is cached HIT with updated task list');

    const createdTaskId = newPost.data.data._id;

    // -------------------------------------------------------------
    // Test Group 4: Requirement - Cache Invalidation on PUT (Write)
    // -------------------------------------------------------------
    console.log('\nTest Group 4: Requirement - Cache Invalidation on PUT');
    // Pre-cache the single task
    await request('GET', `/tasks/${createdTaskId}`); // MISS
    const singleCachedBefore = await request('GET', `/tasks/${createdTaskId}`); // HIT
    assert(singleCachedBefore.headers['x-cache'] === 'HIT', 'Single task confirmed cached before update');

    // Now update task via PUT
    const putRes = await request('PUT', `/tasks/${createdTaskId}`, {
      title: 'Updated Task Title via PUT',
      completed: true
    });
    assert(putRes.statusCode === 200, 'PUT /tasks/:id updates task (HTTP 200)');
    assert(putRes.data.cacheInvalidated === true, 'PUT response confirms cacheInvalidated = true');

    // Subsequent GET /tasks/:id MUST be a MISS and have updated data
    const singleAfterPut = await request('GET', `/tasks/${createdTaskId}`);
    assert(singleAfterPut.headers['x-cache'] === 'MISS', 'GET /tasks/:id is MISS after PUT update');
    assert(singleAfterPut.data.data.title === 'Updated Task Title via PUT', 'Updated title served immediately');
    assert(singleAfterPut.data.data.completed === true, 'Updated completion status served immediately');

    // Subsequent GET /tasks (all) MUST ALSO be a MISS
    const allAfterPut = await request('GET', '/tasks');
    assert(allAfterPut.headers['x-cache'] === 'MISS', 'GET /tasks (all) is MISS after PUT update');

    // -------------------------------------------------------------
    // Test Group 5: Requirement - Cache Invalidation on DELETE (Write)
    // -------------------------------------------------------------
    console.log('\nTest Group 5: Requirement - Cache Invalidation on DELETE');
    // Ensure both are cached first
    await request('GET', `/tasks/${createdTaskId}`); // Cache single
    await request('GET', '/tasks'); // Cache all

    // Delete task
    const delRes = await request('DELETE', `/tasks/${createdTaskId}`);
    assert(delRes.statusCode === 200, 'DELETE /tasks/:id deletes task (HTTP 200)');
    assert(delRes.data.cacheInvalidated === true, 'DELETE response confirms cacheInvalidated = true');

    // Requesting deleted task must return 404, NEVER stale cached data
    const getDeletedRes = await request('GET', `/tasks/${createdTaskId}`);
    assert(getDeletedRes.statusCode === 404, 'GET /tasks/:id for deleted task returns 404 Not Found (no stale data)');

    // GET /tasks (all) must be a MISS and omit the deleted task
    const allAfterDel = await request('GET', '/tasks');
    assert(allAfterDel.headers['x-cache'] === 'MISS', 'GET /tasks is MISS after DELETE');
    const stillExists = allAfterDel.data.data.some((t) => t._id === createdTaskId);
    assert(stillExists === false, 'Deleted task is completely absent from all tasks response');

    // -------------------------------------------------------------
    // Test Group 6: Supplementary 2 - Hit/Miss Counter & Debug Endpoint
    // -------------------------------------------------------------
    console.log('\nTest Group 6: Supplementary 2 - Cache Hit/Miss Counter & Debug Endpoint');
    const statsRes = await request('GET', '/api/cache/stats');
    assert(statsRes.statusCode === 200, 'GET /api/cache/stats returns HTTP 200');
    assert(typeof statsRes.data.summary.hits === 'number' && statsRes.data.summary.hits > 0, 'Hits counter is tracked (> 0)');
    assert(typeof statsRes.data.summary.misses === 'number' && statsRes.data.summary.misses > 0, 'Misses counter is tracked (> 0)');
    assert(statsRes.data.summary.totalRequests === statsRes.data.summary.hits + statsRes.data.summary.misses, 'Total requests = hits + misses');
    assert(statsRes.data.summary.hitRatio.includes('%'), 'Hit ratio formatted with percentage');
    assert(Array.isArray(statsRes.data.recentEvents), 'Recent cache activity events exposed in debug stats');

    // -------------------------------------------------------------
    // Test Group 7: Supplementary 3 - Dynamic TTL Experimentation
    // -------------------------------------------------------------
    console.log('\nTest Group 7: Supplementary 3 - Dynamic TTL Experimentation');
    const ttlUpdate = await request('POST', '/api/cache/ttl', { ttl: 5 });
    assert(ttlUpdate.statusCode === 200, 'POST /api/cache/ttl with 5s returns HTTP 200');
    assert(ttlUpdate.data.currentTTL === 5, 'Current TTL updated to 5 seconds');

    // Flush and cache a fresh entry under 5s TTL
    await request('POST', '/api/cache/flush');
    const freshGet = await request('GET', '/tasks');
    assert(freshGet.headers['x-cache-ttl-remaining'] === '5s', 'Newly cached item uses 5s TTL');

    // Restore standard 60s TTL
    await request('POST', '/api/cache/ttl', { ttl: 60 });
    const restoreRes = await request('GET', '/api/cache/stats');
    assert(restoreRes.data.summary.currentTTL === 60, 'Standard TTL successfully restored to 60s');

    // -------------------------------------------------------------
    // Test Group 8: Cache Bypass Options
    // -------------------------------------------------------------
    console.log('\nTest Group 8: Cache Bypass Verification');
    await request('GET', '/tasks'); // Ensure cached
    const bypassHeader = await request('GET', '/tasks', null, { 'X-No-Cache': 'true' });
    assert(bypassHeader.headers['x-cache'] === 'BYPASS', 'X-No-Cache header bypasses cache (X-Cache: BYPASS)');

    const bypassQuery = await request('GET', '/tasks?cache=false');
    assert(bypassQuery.headers['x-cache'] === 'BYPASS', '?cache=false query parameter bypasses cache');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    console.log(`\n================================================================`);
    console.log(`Test Summary: Total Passed: ${passed} | Failed: ${failed}`);
    console.log(`================================================================\n`);

    if (serverInstance) {
      serverInstance.close();
    }
    await disconnectDB();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
