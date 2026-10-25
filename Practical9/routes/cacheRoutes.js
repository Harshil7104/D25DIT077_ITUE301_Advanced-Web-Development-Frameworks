const express = require('express');
const router = express.Router();
const {
  getCacheStats,
  getCacheKeys,
  flushCache,
  updateTTL,
  resetStats
} = require('../controllers/cacheController');

// Debug and management endpoints for cache
router.get('/stats', getCacheStats);
router.get('/keys', getCacheKeys);
router.post('/flush', flushCache);
router.delete('/', flushCache);
router.post('/ttl', updateTTL);
router.post('/reset-stats', resetStats);

module.exports = router;
