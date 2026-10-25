const express = require('express');
const router = express.Router();
const {
  createTask,
  deleteTask,
  getTasks,
  getTaskById,
  updateTask
} = require('../controllers/taskController');

/**
 * Task Routes
 * POST   /api/tasks        - Create task and emit 'task-created' event asynchronously
 * GET    /api/tasks        - Get all tasks
 * GET    /api/tasks/:id    - Get single task by ID
 * PUT    /api/tasks/:id    - Update task
 * DELETE /api/tasks/:id    - Delete task and emit 'task-deleted' event asynchronously
 */

router.route('/')
  .post(createTask)
  .get(getTasks);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
