const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const validateTask = require('../middleware/validateTask');
const validateTaskId = require('../middleware/validateTaskId');
const taskEvents = require('../events/taskEvents');

// Initialize in-memory cache with standard 60-second TTL
const taskCache = new NodeCache({ stdTTL: 60 });
const CACHE_KEY = 'all_tasks';

// Cache Hit / Miss Tracker for Debug and Analytics
const cacheStats = {
  hits: 0,
  misses: 0
};

// Protect all task routes with authentication middleware (verifies JWT)
router.use(authMiddleware);

// Helper function to handle Mongoose validation errors
const handleValidationError = (err, res) => {
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation failed',
      details: details
    });
  }
  return res.status(500).json({ error: 'Internal server error' });
};

// 1. GET /tasks/debug/cache - Expose Cache Hit/Miss Counter & Diagnostics
router.get('/debug/cache', (req, res) => {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRatio = total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) + '%' : '0%';

  res.status(200).json({
    message: 'Node-Cache In-Memory Cache Debug Statistics',
    stats: {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      totalRequests: total,
      hitRatio: hitRatio
    },
    activeKeys: taskCache.keys(),
    currentTTLSeconds: taskCache.options.stdTTL,
    internalNodeCacheStats: taskCache.getStats()
  });
});

// 2. POST /tasks/debug/cache/ttl - Dynamic TTL Experimentation Endpoint
router.post('/debug/cache/ttl', (req, res) => {
  const { ttl } = req.body;
  if (!ttl || isNaN(ttl) || ttl <= 0) {
    return res.status(400).json({ error: 'Please provide a valid positive number for ttl (in seconds)' });
  }

  taskCache.options.stdTTL = Number(ttl);
  taskCache.flushAll(); // Flush old cache entries to apply new TTL immediately

  console.log(`[Cache Config] TTL updated to ${ttl} seconds and cache flushed.`);
  res.status(200).json({
    message: `Cache TTL updated to ${ttl} seconds. Cache cleared for experiment.`,
    newTTLSeconds: Number(ttl)
  });
});

// 3. GET /tasks - Get all tasks with in-memory caching (node-cache)
router.get('/', async (req, res, next) => {
  const startTime = Date.now();

  try {
    // Optional bypass parameter (?cache=false or Header: x-cache-bypass: true) for benchmark comparisons
    const isBypass = req.query.cache === 'false' || req.headers['x-cache-bypass'] === 'true';

    // Check if 'all_tasks' is cached (Cache HIT)
    if (!isBypass && taskCache.has(CACHE_KEY)) {
      cacheStats.hits++;
      const cachedTasks = taskCache.get(CACHE_KEY);
      const duration = Date.now() - startTime;

      console.log(`Cache HIT: ${CACHE_KEY}`);
      console.log(`GET /tasks completed in ${duration} ms (Cache HIT)`);

      res.set('X-Cache', 'HIT');
      res.set('X-Response-Time', `${duration}ms`);
      return res.status(200).json(cachedTasks);
    }

    // Cache MISS (or Bypass): Fetch tasks directly from MongoDB
    cacheStats.misses++;
    if (isBypass) {
      console.log(`Cache BYPASS: ${CACHE_KEY} (queried MongoDB directly)`);
    } else {
      console.log(`Cache MISS: ${CACHE_KEY}`);
    }

    const tasks = await Task.find().sort({ createdAt: -1 });

    // Store in cache for subsequent requests (only if not bypassed)
    if (!isBypass) {
      taskCache.set(CACHE_KEY, tasks);
    }

    const duration = Date.now() - startTime;
    const statusLabel = isBypass ? 'Cache Bypass' : 'Cache MISS';
    console.log(`GET /tasks completed in ${duration} ms (${statusLabel})`);

    res.set('X-Cache', isBypass ? 'BYPASS' : 'MISS');
    res.set('X-Response-Time', `${duration}ms`);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// 4. GET /tasks/error-test - Simulated route to trigger global error handler
router.get('/error-test', (req, res, next) => {
  next(new Error('This is a simulated internal server error!'));
});

// 5. GET /tasks/:id - Get a single task by ID with individual caching
router.get('/:id', validateTaskId, async (req, res, next) => {
  const startTime = Date.now();
  const singleCacheKey = `task_${req.params.id}`;
  const isBypass = req.query.cache === 'false' || req.headers['x-cache-bypass'] === 'true';

  try {
    // Check if single task is cached (Cache HIT)
    if (!isBypass && taskCache.has(singleCacheKey)) {
      cacheStats.hits++;
      const cachedTask = taskCache.get(singleCacheKey);
      const duration = Date.now() - startTime;

      console.log(`Cache HIT: ${singleCacheKey}`);
      console.log(`GET /tasks/${req.params.id} completed in ${duration} ms (Cache HIT)`);

      res.set('X-Cache', 'HIT');
      res.set('X-Response-Time', `${duration}ms`);
      return res.status(200).json(cachedTask);
    }

    // Cache MISS (or Bypass): Fetch single task from MongoDB
    cacheStats.misses++;
    if (isBypass) {
      console.log(`Cache BYPASS: ${singleCacheKey} (queried MongoDB directly)`);
    } else {
      console.log(`Cache MISS: ${singleCacheKey}`);
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Store single task in cache if not bypassed
    if (!isBypass) {
      taskCache.set(singleCacheKey, task);
    }

    const duration = Date.now() - startTime;
    const statusLabel = isBypass ? 'Cache Bypass' : 'Cache MISS';
    console.log(`GET /tasks/${req.params.id} completed in ${duration} ms (${statusLabel})`);

    res.set('X-Cache', isBypass ? 'BYPASS' : 'MISS');
    res.set('X-Response-Time', `${duration}ms`);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// 6. POST /tasks - Create a new task in MongoDB
router.post('/', validateTask, async (req, res, next) => {
  const requestReceivedTime = new Date().toISOString();
  console.log(`[API] Request received at: ${requestReceivedTime}`);

  try {
    const { title, description, completed, priority } = req.body;

    const newTask = await Task.create({
      title,
      description,
      completed: completed || false,
      priority: priority || 'medium'
    });

    const taskSavedTime = new Date().toISOString();
    console.log(`[API] Task saved at: ${taskSavedTime}`);

    // Invalidate cached task list only after successful database write
    taskCache.del(CACHE_KEY);
    console.log(`Cache invalidated: ${CACHE_KEY} (POST /tasks)`);

    // Emit task-created event with task details and authenticated user info
    const assignedUser = (req.user && req.user.email) ? req.user.email : 'Unknown User';
    const eventEmittedTime = new Date().toISOString();
    console.log(`[API] Emitting task-created event at: ${eventEmittedTime}`);

    taskEvents.emit('task-created', {
      title: newTask.title,
      timestamp: newTask.createdAt.toISOString(),
      user: assignedUser
    });

    // Return HTTP 201 response immediately (does not block for background notification)
    const responseSentTime = new Date().toISOString();
    console.log(`[API] Response sent at: ${responseSentTime}`);
    res.status(201).json(newTask);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return handleValidationError(err, res);
    }
    next(err);
  }
});

// 7. PUT /tasks/:id - Update an existing task in MongoDB
router.put('/:id', validateTaskId, validateTask, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const updateData = {
      title: typeof title === 'string' ? title.trim() : title,
      description,
      completed,
      priority
    };

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Invalidate BOTH the all-tasks collection cache AND the individual task cache
    taskCache.del(CACHE_KEY);
    taskCache.del(`task_${req.params.id}`);
    console.log(`Cache invalidated: ${CACHE_KEY} & task_${req.params.id} (PUT /tasks/:id)`);

    res.status(200).json(updatedTask);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return handleValidationError(err, res);
    }
    next(err);
  }
});

// 8. DELETE /tasks/:id - Delete a task from MongoDB
router.delete('/:id', validateTaskId, async (req, res, next) => {
  const requestReceivedTime = new Date().toISOString();
  console.log(`[API] DELETE Request received at: ${requestReceivedTime}`);

  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Invalidate BOTH the all-tasks collection cache AND the individual task cache
    taskCache.del(CACHE_KEY);
    taskCache.del(`task_${req.params.id}`);
    console.log(`Cache invalidated: ${CACHE_KEY} & task_${req.params.id} (DELETE /tasks/:id)`);

    // Emit task-deleted event with task details and authenticated user info
    const assignedUser = (req.user && req.user.email) ? req.user.email : 'Unknown User';
    const eventEmittedTime = new Date().toISOString();
    console.log(`[API] Emitting task-deleted event at: ${eventEmittedTime}`);

    taskEvents.emit('task-deleted', {
      id: deletedTask._id,
      title: deletedTask.title,
      timestamp: new Date().toISOString(),
      user: assignedUser
    });

    const responseSentTime = new Date().toISOString();
    console.log(`[API] DELETE Response sent at: ${responseSentTime}`);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
