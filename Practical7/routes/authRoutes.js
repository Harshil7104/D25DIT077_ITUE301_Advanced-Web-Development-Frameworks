const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validator');

// Authentication Endpoints
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

// Supplementary Problem 1: /me endpoint protected by JWT authMiddleware
router.get('/me', protect, getMe);

// Supplementary Problem 3: Server logout acknowledgment
router.post('/logout', logoutUser);

module.exports = router;
