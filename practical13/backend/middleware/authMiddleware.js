const jwt = require('jsonwebtoken');

// Authentication Middleware to verify JWT tokens on protected routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header is present and properly formatted with Bearer prefix
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  // 2. Extract JWT token from header
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  // 3. Verify JWT token using secret
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'practical13_jwt_secret_key');
    req.user = decoded; // Attach authenticated user payload to request
    next(); // Proceed to next middleware or route controller
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;
