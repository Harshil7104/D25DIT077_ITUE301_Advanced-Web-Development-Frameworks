const cacheService = require('../services/cacheService');

/**
 * @desc    Get cache statistics (Hit, Miss, Hit Ratio, Memory)
 * @route   GET /api/cache/stats
 * @access  Public
 * 
 * Supplementary Problem 2:
 * "Add a cache-hit/cache-miss counter and expose it via a debug endpoint."
 */
const getCacheStats = (req, res) => {
  const stats = cacheService.getStats();
  res.status(200).json(stats);
};

/**
 * @desc    Get detailed list of currently active cached keys
 * @route   GET /api/cache/keys
 * @access  Public
 */
const getCacheKeys = (req, res) => {
  const keys = cacheService.getKeysDetails();
  res.status(200).json({
    success: true,
    count: keys.length,
    keys
  });
};

/**
 * @desc    Flush all cache entries
 * @route   POST /api/cache/flush or DELETE /api/cache
 * @access  Public
 */
const flushCache = (req, res) => {
  cacheService.flush();
  res.status(200).json({
    success: true,
    message: 'Cache flushed successfully. All cached data removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * @desc    Update cache standard TTL dynamically
 * @route   POST /api/cache/ttl
 * @access  Public
 * 
 * Supplementary Problem 3:
 * "Experiment with different TTL values and document how it affects perceived staleness versus performance."
 */
const updateTTL = (req, res) => {
  const { ttl } = req.body;

  if (!ttl || isNaN(parseInt(ttl, 10)) || parseInt(ttl, 10) <= 0) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Invalid TTL',
      message: 'TTL must be provided as a positive integer representing seconds (e.g., 5, 30, 60, 300)'
    });
  }

  try {
    const updated = cacheService.updateCacheTTL(parseInt(ttl, 10));
    res.status(200).json({
      success: true,
      message: `Default cache TTL successfully updated to ${updated} seconds`,
      currentTTL: updated,
      note: 'Newly cached keys will use this TTL. Existing cached keys retain their original expiration.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      error: error.message
    });
  }
};

/**
 * @desc    Reset cache hits, misses, and operation counters
 * @route   POST /api/cache/reset-stats
 * @access  Public
 */
const resetStats = (req, res) => {
  cacheService.resetStats();
  res.status(200).json({
    success: true,
    message: 'Cache hit/miss counters reset to zero',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getCacheStats,
  getCacheKeys,
  flushCache,
  updateTTL,
  resetStats
};
