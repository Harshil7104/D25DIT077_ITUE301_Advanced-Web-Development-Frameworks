/**
 * 404 Route Not Found Middleware
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: 'Not Found',
    message: `Resource not found: cannot ${req.method} ${req.originalUrl}`
  });
};

module.exports = notFound;
