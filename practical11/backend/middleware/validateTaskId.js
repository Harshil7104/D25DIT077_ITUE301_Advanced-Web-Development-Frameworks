// Task ID Validation Middleware
// Validates that the ':id' parameter is a valid 24-character hexadecimal MongoDB ObjectId before reaching the controller.
const validateTaskId = (req, res, next) => {
  const id = req.params.id;

  // Check if id matches 24-character hex ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      error: 'Invalid task ID format'
    });
  }

  next(); // ID is valid, proceed
};

module.exports = validateTaskId;
