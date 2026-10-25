const Task = require('../models/Task');

/**
 * @desc    Get all tasks with optional filters (completed, priority, search, sort)
 * @route   GET /tasks
 * @access  Public
 */
const getTasks = async (req, res, next) => {
  try {
    const { completed, priority, search, sort } = req.query;
    const filter = {};

    // Filter by completion status
    if (completed !== undefined) {
      filter.completed = completed === 'true' || completed === true;
    }

    // Filter by priority enum (Supplementary Problem 1)
    if (priority && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      filter.priority = priority.toLowerCase();
    }

    // Search keyword in title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build query with sorting (default: newest first)
    let query = Task.find(filter);
    if (sort === 'oldest') {
      query = query.sort({ createdAt: 1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const tasks = await query;

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by its MongoDB _id
 * @route   GET /tasks/:id
 * @access  Public
 * 
 * Supplementary Problem 3:
 * Returns HTTP 404 JSON response if the task ID does not exist in MongoDB.
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    // If ID is syntactically valid but does not match any document:
    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${req.params.id}' not found in database`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    // Invalid ObjectId format triggers Mongoose CastError, caught by errorHandler
    next(error);
  }
};

/**
 * @desc    Create a new task in MongoDB
 * @route   POST /tasks
 * @access  Public
 * 
 * Uses Mongoose schema validation & executes the pre-save hook for title trimming.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    // Instantiate Mongoose document and save (triggers pre-save hook and schema validators)
    const task = new Task({
      title,
      description,
      completed,
      priority
    });

    const savedTask = await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask
    });
  } catch (error) {
    // Mongoose ValidationError triggers and is forwarded to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Update an existing task by ID
 * @route   PUT /tasks/:id
 * @access  Public
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    // Retrieve document to ensure it exists and trigger pre-save hook & schema validators
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${req.params.id}' not found in database`
      });
    }

    // Update fields conditionally
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;
    if (priority !== undefined) task.priority = priority;

    // .save() executes schema validation and the pre-save trim hook
    const updatedTask = await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task by ID from MongoDB
 * @route   DELETE /tasks/:id
 * @access  Public
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${req.params.id}' not found in database`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: {
        id: req.params.id,
        title: task.title
      }
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
