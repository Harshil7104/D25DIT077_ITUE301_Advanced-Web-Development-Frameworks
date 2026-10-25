/**
 * Centralized Global Error Handling Middleware
 * 
 * Intercepts all unhandled errors in Express and converts Mongoose error
 * objects (ValidationErrors, CastErrors, DuplicateKeyErrors) into clean,
 * structured JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let errorType = 'Internal Server Error';
  let message = err.message || 'An unexpected error occurred on the server';
  let errors = null;

  // 1. Mongoose Validation Error (Schema constraints, required fields, enums)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'Validation Error';
    message = 'Validation failed for Task input';

    // Format individual field validation errors cleanly
    errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value !== undefined ? val.value : null
    }));
  }

  // 2. Mongoose CastError (e.g. invalid MongoDB ObjectId format in URL parameter)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorType = 'Invalid ID Format';
    message = `Invalid format for '${err.path}': '${err.value}' is not a valid 24-character hexadecimal MongoDB ObjectId`;
  }

  // 3. MongoDB Duplicate Key Error (Code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    errorType = 'Duplicate Key Error';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value: A task with that ${field} already exists`;
  }

  // 4. Express / Body-Parser Malformed JSON SyntaxError
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorType = 'Malformed JSON';
    message = 'Request body contains invalid or malformed JSON';
  }

  // Log error details for server diagnostics
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${errorType} (${statusCode}):`, message);
  }

  // Send structured JSON response
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
