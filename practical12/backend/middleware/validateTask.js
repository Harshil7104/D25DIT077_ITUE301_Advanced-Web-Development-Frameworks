// Request Validation Middleware
// Validates that the task title is present and is a non-empty string.
const validateTask = (req, res, next) => {
  const { title } = req.body;

  if (title === undefined || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Title is required and must be a non-empty string'
    });
  }

  next(); // Title is valid, proceed to the controller
};

module.exports = validateTask;
