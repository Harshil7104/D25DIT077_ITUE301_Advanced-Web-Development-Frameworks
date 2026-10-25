const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { validateTask, validateTaskUpdate } = require('../middleware/validator');

/**
 * Requirement:
 * "Protect all task routes using an authentication middleware that verifies the JWT."
 * 
 * Applying `protect` middleware to all routes on this router ensures that ANY
 * request to /tasks (GET, POST, PUT, DELETE) must provide a valid JWT Bearer token.
 */
router.use(protect);

// Routes for /tasks
router.route('/')
  .get(getTasks)
  .post(validateTask, createTask);

// Routes for /tasks/:id (GET, PUT, DELETE)
router.route('/:id')
  .get(getTaskById)
  .put(validateTaskUpdate, updateTask)
  .delete(deleteTask);

module.exports = router;
