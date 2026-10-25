/**
 * Practical 10 - Synchronous vs Asynchronous Handling Benchmark
 * 
 * Demonstrates:
 * 1. Synchronous handling: The listener is called synchronously by EventEmitter,
 *    blocking the calling thread until the handler returns.
 * 2. Asynchronous handling: The handler delegates work to libuv's timer/event queue
 *    (setTimeout/setImmediate), enabling the calling execution to return immediately.
 */

const { EventEmitter } = require('events');

function runBenchmark() {
  console.log('\n=============================================================================');
  console.log('⚡ BENCHMARK: SYNCHRONOUS VS ASYNCHRONOUS EVENT HANDLING IN NODE.JS');
  console.log('   Author: Harshil (D25DIT077) • ITUE301 Advanced Web Development Frameworks');
  console.log('=============================================================================\n');

  const emitter = new EventEmitter();
  const simulatedWorkloadMs = 1500; // 1.5 seconds simulated notification dispatch

  // Register Synchronous Handler
  emitter.on('sync-event', (data) => {
    const start = Date.now();
    data.handlerStartTime = new Date().toISOString();
    // Synchronously block the Node.js main thread
    while (Date.now() - start < simulatedWorkloadMs) {
      // Busy wait blocking single-threaded event loop
    }
    data.handlerEndTime = new Date().toISOString();
  });

  // Register Asynchronous Handler
  emitter.on('async-event', (data) => {
    data.handlerScheduledTime = new Date().toISOString();
    setTimeout(() => {
      data.handlerExecutionTime = new Date().toISOString();
      data.completedDeltaMs = Date.now() - data.callerDispatchedMs;
      console.log(`\n🔔 [ASYNC BACKGROUND HANDLER FINISHED]`);
      console.log(`   Task             : "${data.title}"`);
      console.log(`   Caller Dispatched: ${data.callerDispatchedIso}`);
      console.log(`   Caller Returned  : ${data.callerReturnedIso} (Response unblocked!)`);
      console.log(`   Handler Executed : ${data.handlerExecutionTime} (+${data.completedDeltaMs}ms later)`);
      console.log('=============================================================================\n');
    }, simulatedWorkloadMs);
  });

  // 1. RUN SYNCHRONOUS TEST
  console.log('--- TEST 1: Synchronous Event Handling (Blocking) ---');
  const syncData = { title: 'Synchronous Urgent Task' };
  const syncStart = Date.now();
  const syncDispatchedIso = new Date().toISOString();
  console.log(`[Caller] Emitting 'sync-event' at ${syncDispatchedIso}...`);

  emitter.emit('sync-event', syncData);

  const syncEnd = Date.now();
  const syncReturnedIso = new Date().toISOString();
  const syncElapsedMs = syncEnd - syncStart;

  console.log(`[Caller] Resumed execution at ${syncReturnedIso}`);
  console.log(`[Caller] Total time caller was BLOCKED: ${syncElapsedMs}ms`);
  console.log(`[Handler] Started at: ${syncData.handlerStartTime}`);
  console.log(`[Handler] Finished at: ${syncData.handlerEndTime}\n`);

  // 2. RUN ASYNCHRONOUS TEST
  console.log('--- TEST 2: Asynchronous Event Handling (Non-Blocking) ---');
  const asyncStart = Date.now();
  const asyncData = {
    title: 'Asynchronous Background Task',
    callerDispatchedMs: asyncStart,
    callerDispatchedIso: new Date().toISOString()
  };
  console.log(`[Caller] Emitting 'async-event' at ${asyncData.callerDispatchedIso}...`);

  emitter.emit('async-event', asyncData);

  const asyncEnd = Date.now();
  asyncData.callerReturnedIso = new Date().toISOString();
  const asyncElapsedMs = asyncEnd - asyncStart;

  console.log(`[Caller] Resumed execution at ${asyncData.callerReturnedIso}`);
  console.log(`[Caller] Total time caller was blocked: ${asyncElapsedMs}ms (Virtually Instantaneous!)`);
  console.log(`[Caller] API response can be returned NOW, while handler continues in background.`);

  // 3. COMPARATIVE TABLE
  console.log('\n=============================================================================');
  console.log('📊 TIMING COMPARISON MATRIX');
  console.log('=============================================================================');
  console.table([
    {
      'Execution Mode': 'Synchronous Handling',
      'Caller Blocked Time': `${syncElapsedMs} ms`,
      'API Response Speed': 'BLOCKED / UNRESPONSIVE',
      'Non-Blocking': 'NO ❌'
    },
    {
      'Execution Mode': 'Asynchronous Handling (Node.js)',
      'Caller Blocked Time': `${asyncElapsedMs} ms`,
      'API Response Speed': 'INSTANTANEOUS (< 5ms)',
      'Non-Blocking': 'YES ✅'
    }
  ]);

  console.log(`⚡ Speedup Factor: ${(syncElapsedMs / Math.max(1, asyncElapsedMs)).toFixed(1)}x faster main thread response!\n`);
  console.log('⏳ Waiting for asynchronous timer to finish background notification logging...');
}

if (require.main === module) {
  runBenchmark();
}

module.exports = runBenchmark;
