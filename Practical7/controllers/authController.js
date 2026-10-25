const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register (or /auth/register)
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        error: 'Conflict',
        message: 'A user with this email address is already registered'
      });
    }

    // Create new user (pre-save hook hashes password with bcrypt)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    // Generate JWT token with 1-hour expiry
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login (or /auth/login)
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Validate user existence and password comparison via bcrypt
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token with 1-hour expiry
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user details using decoded JWT
 * @route   GET /api/auth/me (or /auth/me)
 * @access  Private (Protected by authMiddleware)
 * 
 * Supplementary Problem 1:
 * "Add a /me endpoint that returns the currently logged-in user's details
 *  using the decoded JWT."
 */
const getMe = async (req, res, next) => {
  try {
    // req.user and req.tokenPayload are populated by protect middleware
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      },
      tokenDetails: {
        token: req.token,
        issuedAt: new Date(req.tokenPayload.iat * 1000).toISOString(),
        expiresAt: new Date(req.tokenPayload.exp * 1000).toISOString(),
        expiresInSeconds: Math.max(0, req.tokenPayload.exp - Math.floor(Date.now() / 1000))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (acknowledgment endpoint)
 * @route   POST /api/auth/logout (or /auth/logout)
 * @access  Public / Private
 * 
 * Supplementary Problem 3:
 * "Add a logout mechanism that clears the token from the client."
 */
const logoutUser = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your client-side authentication token.'
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser
};
