const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, toggleUserStatus } = require('../controllers/auth.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');

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

// @route   PATCH /api/auth/users/:id/toggle-status
// @desc    Toggle user status (active/inactive)
// @access  Private (Admin)
router.patch('/users/:id/toggle-status', authMiddleware, authorize([USER_ROLES.ADMIN]), toggleUserStatus);

module.exports = router;