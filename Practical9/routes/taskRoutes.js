const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// Routes for /tasks
router.route('/')
  .get(getTasks)
  .post(createTask);

// Routes for /tasks/:id (GET, PUT, DELETE)
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
