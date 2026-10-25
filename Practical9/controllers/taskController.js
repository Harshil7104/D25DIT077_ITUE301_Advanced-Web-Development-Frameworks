const Task = require('../models/Task');
const cacheService = require('../services/cacheService');

/**
 * Helper to compute high-resolution response duration in milliseconds
 */
const getDurationMs = (startHrTime) => {
  const diff = process.hrtime(startHrTime);
  return parseFloat(((diff[0] * 1e3 + diff[1] * 1e-6)).toFixed(3));
};

/**
 * Check if the request explicitly asks to bypass cache
 * Supported mechanisms:
 *  - Header: Cache-Control: no-cache
 *  - Header: X-No-Cache: true
 *  - Query param: ?cache=false or ?bypass=true
 */
const shouldBypassCache = (req) => {
  const headerBypass =
    req.headers['x-no-cache'] === 'true' ||
    req.headers['cache-control'] === 'no-cache';
  const queryBypass =
    req.query.cache === 'false' ||
    req.query.bypass === 'true';
  return headerBypass || queryBypass;
};

/**
 * @desc    Get all tasks (with in-memory caching and optional filtering)
 * @route   GET /tasks
 * @access  Public
 * 
 * Requirement:
 * "Cache the response of GET /tasks (all tasks) with a reasonable TTL (e.g., 60 seconds)."
 */
const getTasks = async (req, res, next) => {
  const start = process.hrtime();
  try {
    const bypass = shouldBypassCache(req);
    const { completed, priority, search, sort, cache: _c, bypass: _b, ...cleanQuery } = req.query;
    const cacheKey = cacheService.generateAllTasksKey(cleanQuery);

    // 1. Check in-memory cache if not bypassed
    if (!bypass) {
      const cachedResult = cacheService.get(cacheKey);

      if (cachedResult.hit) {
        const responseTimeMs = getDurationMs(start);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.setHeader('X-Cache-TTL-Remaining', `${cachedResult.ttlRemaining}s`);
        res.setHeader('X-Response-Time', `${responseTimeMs}ms`);
        res.setHeader('X-Data-Source', 'Memory-Cache (node-cache)');

        return res.status(200).json({
          ...cachedResult.data,
          cached: true,
          cacheStatus: 'HIT',
          cacheKey,
          ttlRemainingSeconds: cachedResult.ttlRemaining,
          responseTimeMs,
          dataSource: 'In-Memory Cache (node-cache)'
        });
      }
    }

    // 2. Cache MISS or BYPASS: Fetch from MongoDB
    const filter = {};

    if (completed !== undefined) {
      filter.completed = completed === 'true' || completed === true;
    }

    if (priority && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      filter.priority = priority.toLowerCase();
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let query = Task.find(filter);
    if (sort === 'oldest') {
      query = query.sort({ createdAt: 1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const tasks = await query;
    const responseTimeMs = getDurationMs(start);

    const payloadToCache = {
      success: true,
      count: tasks.length,
      data: tasks,
      timestamp: new Date().toISOString()
    };

    // 3. Store in cache if not bypassed
    if (!bypass) {
      cacheService.set(cacheKey, payloadToCache);
    }

    res.setHeader('X-Cache', bypass ? 'BYPASS' : 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);
    res.setHeader('X-Cache-TTL-Remaining', `${cacheService.getCurrentTTL()}s`);
    res.setHeader('X-Response-Time', `${responseTimeMs}ms`);
    res.setHeader('X-Data-Source', 'MongoDB Database');

    res.status(200).json({
      ...payloadToCache,
      cached: false,
      cacheStatus: bypass ? 'BYPASS' : 'MISS',
      cacheKey,
      ttlRemainingSeconds: cacheService.getCurrentTTL(),
      responseTimeMs,
      dataSource: 'MongoDB Database'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /tasks/:id
 * @access  Public
 * 
 * Supplementary Problem 1:
 * "Cache the GET /tasks/:id single-task endpoint separately from the all-tasks endpoint."
 */
const getTaskById = async (req, res, next) => {
  const start = process.hrtime();
  try {
    const { id } = req.params;
    const bypass = shouldBypassCache(req);
    const cacheKey = cacheService.generateSingleTaskKey(id);

    // 1. Check in-memory cache if not bypassed
    if (!bypass) {
      const cachedResult = cacheService.get(cacheKey);

      if (cachedResult.hit) {
        const responseTimeMs = getDurationMs(start);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.setHeader('X-Cache-TTL-Remaining', `${cachedResult.ttlRemaining}s`);
        res.setHeader('X-Response-Time', `${responseTimeMs}ms`);
        res.setHeader('X-Data-Source', 'Memory-Cache (node-cache)');

        return res.status(200).json({
          ...cachedResult.data,
          cached: true,
          cacheStatus: 'HIT',
          cacheKey,
          ttlRemainingSeconds: cachedResult.ttlRemaining,
          responseTimeMs,
          dataSource: 'In-Memory Cache (node-cache)'
        });
      }
    }

    // 2. Cache MISS or BYPASS: Fetch from MongoDB
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${id}' not found in database`
      });
    }

    const responseTimeMs = getDurationMs(start);
    const payloadToCache = {
      success: true,
      data: task,
      timestamp: new Date().toISOString()
    };

    // 3. Store in single-task cache
    if (!bypass) {
      cacheService.set(cacheKey, payloadToCache);
    }

    res.setHeader('X-Cache', bypass ? 'BYPASS' : 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);
    res.setHeader('X-Cache-TTL-Remaining', `${cacheService.getCurrentTTL()}s`);
    res.setHeader('X-Response-Time', `${responseTimeMs}ms`);
    res.setHeader('X-Data-Source', 'MongoDB Database');

    res.status(200).json({
      ...payloadToCache,
      cached: false,
      cacheStatus: bypass ? 'BYPASS' : 'MISS',
      cacheKey,
      ttlRemainingSeconds: cacheService.getCurrentTTL(),
      responseTimeMs,
      dataSource: 'MongoDB Database'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /tasks
 * @access  Public
 * 
 * Requirement:
 * "Invalidate the cache on any write operation POST, PUT, or DELETE so stale data is never served."
 */
const createTask = async (req, res, next) => {
  const start = process.hrtime();
  try {
    const { title, description, completed, priority } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Validation Error',
        message: 'Task title is required and cannot be empty'
      });
    }

    const task = new Task({
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: completed === true || completed === 'true',
      priority: priority ? priority.toLowerCase() : 'medium'
    });

    const savedTask = await task.save();

    // Cache Invalidation on POST: Invalidate all-tasks cache
    const clearedKeys = cacheService.invalidateAllTasks();

    const responseTimeMs = getDurationMs(start);
    res.setHeader('X-Cache-Invalidated', 'tasks:all*');
    res.setHeader('X-Response-Time', `${responseTimeMs}ms`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask,
      cacheInvalidated: true,
      invalidatedCacheKeys: clearedKeys,
      responseTimeMs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing task
 * @route   PUT /tasks/:id
 * @access  Public
 * 
 * Requirement & Supplementary Problem 1:
 * Invalidate both all-tasks cache and the specific single-task cache
 */
const updateTask = async (req, res, next) => {
  const start = process.hrtime();
  try {
    const { id } = req.params;
    const { title, description, completed, priority } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${id}' not found in database`
      });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (completed !== undefined) task.completed = completed === true || completed === 'true';
    if (priority !== undefined) task.priority = priority.toLowerCase();

    const updatedTask = await task.save();

    // Invalidate both all-tasks cache and this specific single-task cache
    const invalidationReport = cacheService.invalidateOnTaskWrite(id);

    const responseTimeMs = getDurationMs(start);
    res.setHeader('X-Cache-Invalidated', `tasks:all*, task:${id}`);
    res.setHeader('X-Response-Time', `${responseTimeMs}ms`);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
      cacheInvalidated: true,
      invalidationReport,
      responseTimeMs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /tasks/:id
 * @access  Public
 * 
 * Requirement & Supplementary Problem 1:
 * Invalidate both all-tasks cache and the specific single-task cache
 */
const deleteTask = async (req, res, next) => {
  const start = process.hrtime();
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${id}' not found in database`
      });
    }

    // Invalidate both all-tasks cache and this specific single-task cache
    const invalidationReport = cacheService.invalidateOnTaskWrite(id);

    const responseTimeMs = getDurationMs(start);
    res.setHeader('X-Cache-Invalidated', `tasks:all*, task:${id}`);
    res.setHeader('X-Response-Time', `${responseTimeMs}ms`);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: {
        id,
        title: task.title
      },
      cacheInvalidated: true,
      invalidationReport,
      responseTimeMs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
