/**
 * Centralized Global Error Handling Middleware for Practical 7
 * 
 * Intercepts errors and formats standard JSON responses.
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
    message = 'Validation failed';

    errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value !== undefined ? val.value : null
    }));
  }

  // 2. Mongoose CastError (invalid ObjectId format)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorType = 'Invalid ID Format';
    message = `Invalid format for '${err.path}': '${err.value}' is not a valid 24-character hexadecimal MongoDB ObjectId`;
  }

  // 3. MongoDB Duplicate Key Error (Code 11000) - e.g. Email already registered
  else if (err.code === 11000) {
    statusCode = 409;
    errorType = 'Conflict / Duplicate Entry';
    const field = Object.keys(err.keyValue || {})[0] || 'email';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `An account with ${field} '${val}' already exists. Please login or use a different ${field}.`;
  }

  // 4. JWT Token Expired Error
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = 'Token Expired';
    message = 'Your session has expired. Please log in again.';
  }

  // 5. JWT Invalid Token Error
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorType = 'Invalid Token';
    message = 'Authentication token is invalid or malformed';
  }

  // 6. Malformed JSON SyntaxError from body-parser
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorType = 'Malformed JSON';
    message = 'Request body contains invalid or malformed JSON';
  }

  // Log error for server diagnostics
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${errorType} (${statusCode}):`, message);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: errorType,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
