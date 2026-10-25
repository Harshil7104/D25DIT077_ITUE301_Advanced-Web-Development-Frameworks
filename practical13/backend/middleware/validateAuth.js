// Server-side input validation middleware for Authentication routes

// Validate User Registration Input
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Name is required'
    });
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({
      error: 'Email is required'
    });
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({
      error: 'Password is required'
    });
  }

  next();
};

// Validate User Login Input
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({
      error: 'Email is required'
    });
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({
      error: 'Password is required'
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin
};
