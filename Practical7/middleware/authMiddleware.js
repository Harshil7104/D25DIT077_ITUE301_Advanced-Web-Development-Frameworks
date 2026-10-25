const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_practical7_d25dit077_itue301_2026';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

/**
 * Generate a Signed JSON Web Token (JWT)
 * @param {Object} user - User document
 * @returns {string} - Signed JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE
    }
  );
};

/**
 * Authentication Middleware: Protects private routes by verifying JWT in the Authorization header.
 * 
 * Verifies:
 *  1. Presence of Authorization header with 'Bearer <token>' format
 *  2. JWT token validity and expiration
 *  3. Verifies that the user still exists in MongoDB
 * 
 * Sets:
 *  - req.user: Populated with user document (excluding password)
 *  - req.token: Raw JWT string
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication token missing from Bearer authorization header'
        });
      }

      // 2. Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // 3. Attach user to request (exclude password)
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          error: 'Unauthorized',
          message: 'The user belonging to this token no longer exists'
        });
      }

      req.user = user;
      req.tokenPayload = decoded;
      req.token = token;

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          error: 'Token Expired',
          message: 'Session token has expired. Please log in again.',
          expiredAt: error.expiredAt
        });
      }

      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'Invalid Token',
        message: 'Not authorized, token verification failed'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Not authorized, no token provided. Please include Bearer token in Authorization header.'
    });
  }
};

module.exports = {
  protect,
  generateToken,
  JWT_SECRET,
  JWT_EXPIRE
};
