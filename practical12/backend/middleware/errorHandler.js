// Global Error Handling Middleware
// Catches any unhandled errors in the middleware pipeline.
// Returns a generic JSON response and hides internal details/stack traces.
const errorHandler = (err, req, res, next) => {
  // Log the actual error stack trace to the server console for debugging
  console.error('Unhandled Error:', err.message || err);

  // Return a generic JSON error response with status 500
  res.status(500).json({
    error: 'Something went wrong'
  });
};

module.exports = errorHandler;
