/**
 * Centralized Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let errorType = 'Internal Server Error';
  let message = err.message || 'An unexpected error occurred on the server';
  let errors = null;

  // 1. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'Validation Error';
    message = 'Validation failed for Task input';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
      value: val.value !== undefined ? val.value : null
    }));
  }

  // 2. Mongoose CastError (e.g. invalid MongoDB ObjectId format)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorType = 'Invalid ID Format';
    message = `Invalid format for '${err.path}': '${err.value}' is not a valid 24-character hexadecimal MongoDB ObjectId`;
  }

  // 3. SyntaxError (Malformed JSON in request body)
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorType = 'Malformed JSON';
    message = 'Request body contains invalid or malformed JSON';
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${errorType} (${statusCode}):`, message);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: errorType,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
