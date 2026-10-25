// 404 Not Found Middleware
// Handles requests to undefined routes and returns a structured JSON response.
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Route not found'
  });
};

module.exports = notFoundHandler;
