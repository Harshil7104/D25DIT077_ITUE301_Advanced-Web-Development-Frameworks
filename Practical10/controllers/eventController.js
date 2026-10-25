const notificationEmitter = require('../events/notificationEmitter');

/**
 * Controller: Get background notification audit logs and error logs
 */
const getEventTelemetry = (req, res) => {
  return res.status(200).json({
    success: true,
    config: {
      simulatedDelayMs: notificationEmitter.simulatedDelayMs,
      listenerCounts: {
        'task-created': notificationEmitter.listenerCount('task-created'),
        'task-deleted': notificationEmitter.listenerCount('task-deleted'),
        'error': notificationEmitter.listenerCount('error')
      }
    },
    counts: {
      auditLogsCount: notificationEmitter.auditLogs.length,
      errorLogsCount: notificationEmitter.errorLogs.length
    },
    auditLogs: notificationEmitter.auditLogs,
    errorLogs: notificationEmitter.errorLogs
  });
};

/**
 * Controller: Configure simulated delay in milliseconds (Supplementary 3)
 */
const setSimulatedDelay = (req, res) => {
  const { delayMs } = req.body;
  if (delayMs === undefined || isNaN(delayMs) || delayMs < 0) {
    return res.status(400).json({
      success: false,
      error: 'delayMs must be a positive integer.'
    });
  }

  notificationEmitter.setSimulatedDelay(delayMs);

  return res.status(200).json({
    success: true,
    message: `Simulated notification delay set to ${delayMs}ms.`,
    simulatedDelayMs: notificationEmitter.simulatedDelayMs
  });
};

/**
 * Controller: Clear audit logs and error logs
 */
const clearEventLogs = (req, res) => {
  notificationEmitter.auditLogs = [];
  notificationEmitter.errorLogs = [];
  return res.status(200).json({
    success: true,
    message: 'Event telemetry and error logs cleared successfully.'
  });
};

/**
 * Controller: Trigger simulated error to demonstrate 'error' listener (Supplementary 2)
 */
const triggerSimulatedError = (req, res) => {
  const simulatedTask = {
    _id: 'err-test-' + Date.now(),
    title: req.body.title || 'Simulated Failure Task (Fault Injection)',
    assignedUser: req.body.assignedUser || 'Harshil (D25DIT077)'
  };

  const emittedAt = new Date().toISOString();
  const apiResponseTime = new Date().toISOString();

  // Emit 'task-created' with simulateError: true
  // The handler's try/catch will intercept it and route to the 'error' listener!
  notificationEmitter.emit('task-created', {
    task: simulatedTask,
    emittedAt,
    apiResponseTime,
    delayMs: 100, // Trigger quickly for testing
    simulateError: true,
    isSync: false
  });

  return res.status(200).json({
    success: true,
    message: 'Simulated task with failure flag dispatched. The event handler will throw an error caught safely by the EventEmitter "error" listener.',
    apiResponseTime,
    simulatedTask
  });
};

/**
 * Controller: Automated Benchmark comparing Synchronous vs Asynchronous handling
 * 
 * Demonstrates:
 * Synchronous emission: Blocks the thread during event loop execution.
 * Asynchronous emission: Yields to next tick/macrotask, returning immediate response.
 */
const runSyncVsAsyncBenchmark = (req, res) => {
  const testDelayMs = 500; // 500ms sleep for quick demo without hanging tests

  // 1. Measure Synchronous Handler Execution
  const syncStart = Date.now();
  const syncTask = {
    _id: 'sync-demo-' + Date.now(),
    title: 'Benchmark Synchronous Task',
    assignedUser: 'Tester (Sync)'
  };

  notificationEmitter.emit('task-created', {
    task: syncTask,
    emittedAt: new Date().toISOString(),
    apiResponseTime: null,
    delayMs: testDelayMs,
    simulateError: false,
    isSync: true
  });
  const syncTotalMs = Date.now() - syncStart;

  // 2. Measure Asynchronous Handler Dispatch
  const asyncStart = Date.now();
  const asyncTask = {
    _id: 'async-demo-' + Date.now(),
    title: 'Benchmark Asynchronous Task',
    assignedUser: 'Tester (Async)'
  };

  notificationEmitter.emit('task-created', {
    task: asyncTask,
    emittedAt: new Date().toISOString(),
    apiResponseTime: new Date().toISOString(),
    delayMs: testDelayMs,
    simulateError: false,
    isSync: false
  });
  const asyncTotalMs = Date.now() - asyncStart;

  return res.status(200).json({
    success: true,
    testDelayMs,
    comparison: {
      synchronous: {
        mode: 'Synchronous Handling',
        apiBlockedTimeMs: syncTotalMs,
        behavior: 'Caller execution was frozen until handler finished execution.'
      },
      asynchronous: {
        mode: 'Asynchronous Handling (Node.js EventEmitter + Timer/Immediate)',
        apiBlockedTimeMs: asyncTotalMs,
        behavior: 'Caller returned immediately in milliseconds while handler executes independently in background.'
      },
      speedupFactor: (syncTotalMs / Math.max(1, asyncTotalMs)).toFixed(1) + 'x faster API response'
    }
  });
};

module.exports = {
  getEventTelemetry,
  setSimulatedDelay,
  clearEventLogs,
  triggerSimulatedError,
  runSyncVsAsyncBenchmark
};
