// Task ID Validation Middleware
// Validates that the ':id' parameter is numeric (contains only digits) before reaching the controller.
const validateTaskId = (req, res, next) => {
  const id = req.params.id;

  // Check if id matches numeric format (only digits)
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      error: 'Invalid task ID'
    });
  }

  next(); // ID is valid, proceed
};

module.exports = validateTaskId;
