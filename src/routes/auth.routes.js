const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authMiddleware, getCurrentUser);

// @route   POST /api/auth/register
// @desc    Register a new user (disabled for now)
// @access  Public
router.post('/register', register);

module.exports = router;