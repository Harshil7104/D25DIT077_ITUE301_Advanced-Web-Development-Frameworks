const express = require('express');
const router = express.Router();
const {
  getEventTelemetry,
  setSimulatedDelay,
  clearEventLogs,
  triggerSimulatedError,
  runSyncVsAsyncBenchmark
} = require('../controllers/eventController');

/**
 * Event & Telemetry Routes
 * GET  /api/events/telemetry  - Retrieve notification audit logs and error logs
 * POST /api/events/delay      - Configure simulated notification delay in ms
 * POST /api/events/clear      - Clear in-memory notification and error logs
 * POST /api/events/test-error - Trigger simulated error caught by 'error' listener
 * GET  /api/events/benchmark  - Run automated Sync vs Async comparison
 */

router.get('/telemetry', getEventTelemetry);
router.post('/delay', setSimulatedDelay);
router.post('/clear', clearEventLogs);
router.post('/test-error', triggerSimulatedError);
router.get('/benchmark', runSyncVsAsyncBenchmark);

module.exports = router;
