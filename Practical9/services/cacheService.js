const { cache, updateCacheTTL, getCurrentTTL, DEFAULT_TTL } = require('../config/cache');

// Custom tracking counters to supplement NodeCache native stats
const statsTracker = {
  customHits: 0,
  customMisses: 0,
  sets: 0,
  deletes: 0,
  invalidations: 0,
  flushes: 0,
  lastInvalidation: null,
  history: [] // Keep last 15 cache events for debug inspection
};

/**
 * Log recent cache activity event
 */
const logEvent = (type, key, details = {}) => {
  const event = {
    type,
    key,
    timestamp: new Date().toISOString(),
    ...details
  };
  statsTracker.history.unshift(event);
  if (statsTracker.history.length > 20) {
    statsTracker.history.pop();
  }
};

/**
 * Generate normalized cache key for all-tasks endpoint
 * Handles query strings so filtered queries are cached distinctly
 * e.g., 'tasks:all' or 'tasks:all?completed=true&priority=high'
 */
const generateAllTasksKey = (query = {}) => {
  const keys = Object.keys(query).sort();
  if (keys.length === 0) {
    return 'tasks:all';
  }
  const serialized = keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join('&');
  return `tasks:all?${serialized}`;
};

/**
 * Generate normalized cache key for single-task endpoint (Supplementary Problem 1)
 */
const generateSingleTaskKey = (id) => {
  return `task:${id}`;
};

/**
 * Retrieve value from cache and update hit/miss counters
 */
const get = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    statsTracker.customHits++;
    logEvent('HIT', key);
    return { hit: true, data: value, ttlRemaining: getTtlRemaining(key) };
  }
  statsTracker.customMisses++;
  logEvent('MISS', key);
  return { hit: false, data: null, ttlRemaining: 0 };
};

/**
 * Store value in cache with standard or custom TTL
 */
const set = (key, value, ttl = undefined) => {
  const effectiveTTL = ttl !== undefined ? ttl : getCurrentTTL();
  const success = cache.set(key, value, effectiveTTL);
  if (success) {
    statsTracker.sets++;
    logEvent('SET', key, { ttl: effectiveTTL });
  }
  return success;
};

/**
 * Delete a specific key from cache
 */
const del = (key) => {
  const deletedCount = cache.del(key);
  if (deletedCount > 0) {
    statsTracker.deletes += deletedCount;
    logEvent('DELETE', key, { deletedCount });
  }
  return deletedCount;
};

/**
 * Calculate remaining TTL in seconds for a key
 */
const getTtlRemaining = (key) => {
  const expTimestamp = cache.getTtl(key);
  if (!expTimestamp) return 0;
  const remainingMs = expTimestamp - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
};

/**
 * Requirement:
 * "Invalidate the cache on any write operation POST, PUT, or DELETE so stale data is never served."
 * 
 * Clears all cached 'all tasks' responses (including query-filtered variations)
 */
const invalidateAllTasks = () => {
  const allKeys = cache.keys();
  const targetKeys = allKeys.filter((k) => k.startsWith('tasks:all'));
  if (targetKeys.length > 0) {
    cache.del(targetKeys);
    statsTracker.deletes += targetKeys.length;
    statsTracker.invalidations++;
    statsTracker.lastInvalidation = {
      scope: 'ALL_TASKS',
      clearedKeys: targetKeys,
      timestamp: new Date().toISOString()
    };
    logEvent('INVALIDATE_ALL_TASKS', 'tasks:all*', { count: targetKeys.length, clearedKeys: targetKeys });
  }
  return targetKeys;
};

/**
 * Supplementary Problem 1:
 * Invalidate a single task cache entry when that specific task is modified or deleted
 */
const invalidateSingleTask = (id) => {
  const singleKey = generateSingleTaskKey(id);
  const deleted = cache.del(singleKey);
  if (deleted > 0) {
    statsTracker.deletes++;
    statsTracker.invalidations++;
    logEvent('INVALIDATE_SINGLE_TASK', singleKey);
  }
  return deleted > 0;
};

/**
 * Invalidate both all-tasks and the modified single task
 * Called on PUT and DELETE write operations
 */
const invalidateOnTaskWrite = (id = null) => {
  const clearedAll = invalidateAllTasks();
  let clearedSingle = false;
  if (id) {
    clearedSingle = invalidateSingleTask(id);
  }
  return {
    clearedAllKeys: clearedAll,
    clearedSingleKey: id ? generateSingleTaskKey(id) : null,
    clearedSingleSuccess: clearedSingle
  };
};

/**
 * Flush all cache entries
 */
const flush = () => {
  cache.flushAll();
  statsTracker.flushes++;
  logEvent('FLUSH_ALL', '*');
  return true;
};

/**
 * Supplementary Problem 2:
 * "Add a cache-hit/cache-miss counter and expose it via a debug endpoint."
 * 
 * Aggregates both node-cache internal stats and custom tracking metrics
 */
const getStats = () => {
  const nativeStats = cache.getStats();
  const keys = cache.keys();

  const totalHits = statsTracker.customHits;
  const totalMisses = statsTracker.customMisses;
  const totalRequests = totalHits + totalMisses;
  const hitRatio = totalRequests > 0 ? ((totalHits / totalRequests) * 100).toFixed(2) : '0.00';

  return {
    success: true,
    summary: {
      totalRequests,
      hits: totalHits,
      misses: totalMisses,
      hitRatio: `${hitRatio}%`,
      hitRatioNumeric: parseFloat(hitRatio),
      currentActiveKeys: keys.length,
      currentTTL: getCurrentTTL(),
      defaultTTL: DEFAULT_TTL
    },
    operations: {
      sets: statsTracker.sets,
      deletes: statsTracker.deletes,
      invalidations: statsTracker.invalidations,
      flushes: statsTracker.flushes,
      lastInvalidation: statsTracker.lastInvalidation
    },
    nativeNodeCache: {
      keys: nativeStats.keys,
      hits: nativeStats.hits,
      misses: nativeStats.misses,
      ksize: nativeStats.ksize,
      vsize: nativeStats.vsize
    },
    recentEvents: statsTracker.history.slice(0, 10)
  };
};

/**
 * Return detailed information for all currently cached keys
 */
const getKeysDetails = () => {
  const keys = cache.keys();
  return keys.map((key) => {
    const ttlRemaining = getTtlRemaining(key);
    const ttlTimestamp = cache.getTtl(key);
    let category = 'other';
    if (key.startsWith('tasks:all')) category = 'all-tasks';
    else if (key.startsWith('task:')) category = 'single-task';

    return {
      key,
      category,
      ttlRemainingSeconds: ttlRemaining,
      expiresAt: ttlTimestamp ? new Date(ttlTimestamp).toISOString() : null
    };
  });
};

/**
 * Reset stats counters for clean test / benchmark runs
 */
const resetStats = () => {
  statsTracker.customHits = 0;
  statsTracker.customMisses = 0;
  statsTracker.sets = 0;
  statsTracker.deletes = 0;
  statsTracker.invalidations = 0;
  statsTracker.flushes = 0;
  statsTracker.history = [];
  cache.flushStats();
  return true;
};

module.exports = {
  cache,
  get,
  set,
  del,
  flush,
  getStats,
  resetStats,
  getKeysDetails,
  getTtlRemaining,
  generateAllTasksKey,
  generateSingleTaskKey,
  invalidateAllTasks,
  invalidateSingleTask,
  invalidateOnTaskWrite,
  updateCacheTTL,
  getCurrentTTL,
  DEFAULT_TTL
};
