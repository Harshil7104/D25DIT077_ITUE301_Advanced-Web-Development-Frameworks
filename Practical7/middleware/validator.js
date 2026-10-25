/**
 * Server-Side Input Validation Middleware for Practical 7
 * 
 * Requirement:
 * "Add server-side input validation that rejects malformed requests
 *  (e.g., missing title) before they reach the database."
 */

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Validates registration input payload
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  // 1. Validate Name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required and cannot be empty' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  } else if (name.trim().length > 50) {
    errors.push({ field: 'name', message: 'Name cannot exceed 50 characters' });
  }

  // 2. Validate Email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email address is required' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address (e.g. user@example.com)' });
  }

  // 3. Validate Password
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Input Validation Error',
      message: errors[0].message,
      errors
    });
  }

  next();
};

/**
 * Validates login input payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email address is required' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Input Validation Error',
      message: errors[0].message,
      errors
    });
  }

  next();
};

/**
 * Validates task creation payload before reaching database
 */
const validateTask = (req, res, next) => {
  const { title, description, priority, completed } = req.body || {};
  const errors = [];

  // Title validation (Required, min 3, max 100)
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Task title is required and cannot be empty' });
  } else if (title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Task title must be at least 3 characters long' });
  } else if (title.trim().length > 100) {
    errors.push({ field: 'title', message: 'Task title cannot exceed 100 characters' });
  }

  // Description validation (Optional, max 500)
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (description.trim().length > 500) {
      errors.push({ field: 'description', message: 'Description cannot exceed 500 characters' });
    }
  }

  // Priority validation (Optional, enum: low, medium, high)
  if (priority !== undefined && priority !== null) {
    const validPriorities = ['low', 'medium', 'high'];
    if (typeof priority !== 'string' || !validPriorities.includes(priority.toLowerCase().trim())) {
      errors.push({
        field: 'priority',
        message: `'${priority}' is not a valid priority. Allowed values: low, medium, high`
      });
    }
  }

  // Completed validation (Optional, boolean)
  if (completed !== undefined && completed !== null) {
    if (typeof completed !== 'boolean' && completed !== 'true' && completed !== 'false') {
      errors.push({ field: 'completed', message: 'Completed status must be a boolean (true/false)' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Input Validation Error',
      message: errors[0].message,
      errors
    });
  }

  next();
};

/**
 * Validates task update payload before reaching database
 */
const validateTaskUpdate = (req, res, next) => {
  const { title, description, priority, completed } = req.body || {};
  const errors = [];

  // Ensure request body is not completely empty
  if (
    title === undefined &&
    description === undefined &&
    priority === undefined &&
    completed === undefined
  ) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Input Validation Error',
      message: 'At least one field (title, description, priority, completed) must be provided for update'
    });
  }

  // Title validation if present
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Task title cannot be empty' });
    } else if (title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Task title must be at least 3 characters long' });
    } else if (title.trim().length > 100) {
      errors.push({ field: 'title', message: 'Task title cannot exceed 100 characters' });
    }
  }

  // Description validation if present
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (description.trim().length > 500) {
      errors.push({ field: 'description', message: 'Description cannot exceed 500 characters' });
    }
  }

  // Priority validation if present
  if (priority !== undefined && priority !== null) {
    const validPriorities = ['low', 'medium', 'high'];
    if (typeof priority !== 'string' || !validPriorities.includes(priority.toLowerCase().trim())) {
      errors.push({
        field: 'priority',
        message: `'${priority}' is not a valid priority. Allowed values: low, medium, high`
      });
    }
  }

  // Completed validation if present
  if (completed !== undefined && completed !== null) {
    if (typeof completed !== 'boolean' && completed !== 'true' && completed !== 'false') {
      errors.push({ field: 'completed', message: 'Completed status must be a boolean' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Input Validation Error',
      message: errors[0].message,
      errors
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateTaskUpdate
};
