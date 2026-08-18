const express = require('express');
const router = express.Router();
const validateTask = require('../middleware/validateTask');
const validateTaskId = require('../middleware/validateTaskId');

// In-memory array for storing tasks.
// Initialized with a couple of default tasks to make testing easier.
let tasks = [
  { id: 1, title: 'Learn Node.js', completed: true },
  { id: 2, title: 'Build Express REST API', completed: false }
];

// Counter to auto-increment task IDs
let nextId = 3;

// 1. GET /tasks - Get all tasks
router.get('/', (req, res) => {
  res.status(200).json(tasks);
});

// 2. GET /tasks/error-test - Simulated route to trigger the global error handler
router.get('/error-test', (req, res) => {
  throw new Error('This is a simulated internal server error!');
});

// 3. GET /tasks/:id - Get a task by its ID (Validates ID format first)
router.get('/:id', validateTaskId, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.status(200).json(task);
});

// 4. POST /tasks - Create a new task (Validates title first)
router.post('/', validateTask, (req, res) => {
  const { title, completed } = req.body;

  const newTask = {
    id: nextId++,
    title: title.trim(),
    completed: completed === true || completed === 'true' ? true : false
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// 5. PUT /tasks/:id - Update an existing task (Validates ID format and title first)
router.put('/:id', validateTaskId, validateTask, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, completed } = req.body;

  tasks[taskIndex] = {
    id: id,
    title: title.trim(),
    completed: completed === true || completed === 'true' ? true : false
  };

  res.status(200).json(tasks[taskIndex]);
});

// 6. DELETE /tasks/:id - Delete a task by its ID (Validates ID format first)
router.delete('/:id', validateTaskId, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Remove task from array
  tasks.splice(taskIndex, 1);
  res.status(200).json({ message: 'Task deleted successfully' });
});

module.exports = router;
