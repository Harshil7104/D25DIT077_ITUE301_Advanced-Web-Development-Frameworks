const NodeCache = require('node-cache');

// Load default TTL from environment or fallback to 60 seconds (as required by Practical 9)
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL, 10) || 60;
const CHECK_PERIOD = parseInt(process.env.CACHE_CHECK_PERIOD, 10) || 120;

/**
 * Initialize NodeCache instance
 * 
 * Options:
 *  - stdTTL: Standard time to live in seconds. Default: 60s
 *  - checkperiod: Automatic delete check interval in seconds. Default: 120s
 *  - useClones: Clones stored objects so mutations by reference do not corrupt cache
 *  - deleteOnExpire: Automatically deletes expired keys on checkperiod
 */
let currentTTL = DEFAULT_TTL;

const cache = new NodeCache({
  stdTTL: currentTTL,
  checkperiod: CHECK_PERIOD,
  useClones: true,
  deleteOnExpire: true
});

console.log(`📦 NodeCache Initialized [Standard TTL: ${currentTTL}s, Check Period: ${CHECK_PERIOD}s]`);

// Track dynamic TTL changes
const updateCacheTTL = (newTTL) => {
  const parsed = parseInt(newTTL, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error('TTL must be a positive integer in seconds');
  }
  currentTTL = parsed;
  cache.options.stdTTL = parsed;
  console.log(`⏱️ Cache default TTL updated to: ${currentTTL}s`);
  return currentTTL;
};

const getCurrentTTL = () => currentTTL;

module.exports = {
  cache,
  updateCacheTTL,
  getCurrentTTL,
  DEFAULT_TTL
};
