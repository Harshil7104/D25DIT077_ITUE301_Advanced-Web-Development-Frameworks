const Task = require('../models/Task');

/**
 * @desc    Get all tasks for the authenticated user
 * @route   GET /tasks or GET /api/tasks
 * @access  Private (JWT protected)
 */
const getTasks = async (req, res, next) => {
  try {
    const { completed, priority, search, sort } = req.query;

    // Isolate tasks exclusively to the authenticated user
    const filter = { user: req.user._id };

    // Filter by completed status
    if (completed !== undefined) {
      filter.completed = completed === 'true' || completed === true;
    }

    // Filter by priority
    if (priority && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      filter.priority = priority.toLowerCase();
    }

    // Search query in title or description
    if (search) {
      filter.$and = [
        { user: req.user._id },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete filter.user;
    }

    // Build query with sorting
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
 * @desc    Get single task by ID for authenticated user
 * @route   GET /tasks/:id or GET /api/tasks/:id
 * @access  Private (JWT protected)
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${req.params.id}' not found for authenticated user`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new task for authenticated user
 * @route   POST /tasks or POST /api/tasks
 * @access  Private (JWT protected)
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const task = new Task({
      user: req.user._id,
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
    next(error);
  }
};

/**
 * @desc    Update task by ID for authenticated user
 * @route   PUT /tasks/:id or PUT /api/tasks/:id
 * @access  Private (JWT protected)
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${req.params.id}' not found or unauthorized`
      });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;
    if (priority !== undefined) task.priority = priority;

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
 * @desc    Delete task by ID for authenticated user
 * @route   DELETE /tasks/:id or DELETE /api/tasks/:id
 * @access  Private (JWT protected)
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: `Task with ID '${req.params.id}' not found or unauthorized`
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
