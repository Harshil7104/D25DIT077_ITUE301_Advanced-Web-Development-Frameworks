const Task = require('../models/Task');
const notificationEmitter = require('../events/notificationEmitter');

/**
 * Controller: Create a new Task and emit 'task-created' event
 * 
 * Demonstrates:
 * 1. Immediate HTTP 201 response in Asynchronous mode before handler finishes.
 * 2. Logging timestamps at both the API response point and event handler execution point.
 * 3. Support for synchronous vs asynchronous mode comparison.
 * 4. Support for simulating slow notification handler (Supplementary 3).
 * 5. Support for simulating handler error (Supplementary 2).
 */
const createTask = async (req, res, next) => {
  const reqStart = Date.now();
  const requestReceivedAt = new Date().toISOString();

  try {
    const {
      title,
      description,
      assignedUser,
      priority,
      simulateError,
      delayMs,
      mode // 'sync' or 'async' (default: 'async')
    } = req.body;

    const isSyncMode = mode === 'sync' || req.query.mode === 'sync';

    // 1. Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Task title is required.'
      });
    }

    // 2. Persist Task in Database
    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      assignedUser: assignedUser && assignedUser.trim() ? assignedUser.trim() : 'Harshil (D25DIT077)',
      priority: priority || 'medium'
    });

    const emittedAt = new Date().toISOString();

    if (isSyncMode) {
      // -------------------------------------------------------------
      // SYNCHRONOUS DEMONSTRATION MODE
      // -------------------------------------------------------------
      // The event handler will block the event loop thread before
      // the API response is sent!
      notificationEmitter.emit('task-created', {
        task,
        emittedAt,
        apiResponseTime: null, // calculated after sync execution
        delayMs: delayMs !== undefined ? parseInt(delayMs, 10) : 2000,
        simulateError: !!simulateError,
        isSync: true
      });

      const apiResponseTime = new Date().toISOString();
      const elapsedTotalMs = Date.now() - reqStart;

      console.log(`\n⚡ [API CONTROLLER - SYNC MODE] HTTP 201 Response dispatched.`);
      console.log(`⏱️ Response Timestamp: ${apiResponseTime} | Total Elapsed: ${elapsedTotalMs}ms (Blocked by handler!)\n`);

      return res.status(201).json({
        success: true,
        message: 'Task created in SYNCHRONOUS mode (API response was blocked by event handler).',
        mode: 'synchronous',
        timing: {
          requestReceivedAt,
          emittedAt,
          apiResponseTime,
          totalElapsedMs: elapsedTotalMs
        },
        task
      });
    }

    // ---------------------------------------------------------------
    // ASYNCHRONOUS BACKGROUND MODE (Default Requirement)
    // ---------------------------------------------------------------
    const apiResponseTime = new Date().toISOString();
    const elapsedBeforeEmit = Date.now() - reqStart;

    // Emit event asynchronously; do NOT wait for handler to finish!
    notificationEmitter.emit('task-created', {
      task,
      emittedAt,
      apiResponseTime,
      delayMs: delayMs !== undefined ? parseInt(delayMs, 10) : undefined,
      simulateError: !!simulateError,
      isSync: false
    });

    console.log(`\n⚡ [API CONTROLLER - ASYNC MODE] HTTP 201 Response returned IMMEDIATELY.`);
    console.log(`⏱️ Response Timestamp: ${apiResponseTime} | Duration: ${elapsedBeforeEmit}ms.`);
    console.log(`🔔 Background handler will complete independently.\n`);

    // Return response immediately to client
    return res.status(201).json({
      success: true,
      message: 'Task created successfully! Background notification queued via EventEmitter.',
      mode: 'asynchronous',
      timing: {
        requestReceivedAt,
        emittedAt,
        apiResponseTime,
        elapsedApiDurationMs: elapsedBeforeEmit
      },
      simulatedDelayMs: notificationEmitter.simulatedDelayMs,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete a Task and emit 'task-deleted' event (Supplementary 1)
 */
const deleteTask = async (req, res, next) => {
  const reqStart = Date.now();
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${id} not found.`
      });
    }

    // Delete task from DB
    await Task.findByIdAndDelete(id);

    const apiResponseTime = new Date().toISOString();
    const emittedAt = new Date().toISOString();

    // Emit 'task-deleted' event to background notification listener
    notificationEmitter.emit('task-deleted', {
      task,
      emittedAt,
      apiResponseTime,
      deletedBy: req.body.deletedBy || 'Harshil (D25DIT077)'
    });

    return res.status(200).json({
      success: true,
      message: `Task "${task.title}" deleted successfully. 'task-deleted' background event emitted.`,
      timing: {
        emittedAt,
        apiResponseTime,
        durationMs: Date.now() - reqStart
      },
      deletedTask: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get single task by ID
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found.`
      });
    }
    return res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update task completion or fields
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found.`
      });
    }
    return res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  deleteTask,
  getTasks,
  getTaskById,
  updateTask
};
