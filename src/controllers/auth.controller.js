const User = require('../models/User');
const logger = require('../utils/logger');
const { generateToken } = require('../utils/jwt');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Username and password are required',
                data: null
            });
        }

        // Find user by username and include password field
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid username or password',
                data: null
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User account is inactive',
                data: null
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid username or password',
                data: null
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id.toString(), user.email || user.username, user.role);

        // Return response
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt
                }
            }
        });

        logger.success(`User logged in: ${user.username}`);
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Get current user info
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'User info retrieved',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        logger.error(`Get current user error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get user info',
            error: error.message
        });
    }
};

/**
 * Register is not needed for now as per requirements
 */
const register = async (req, res) => {
    return res.status(400).json({
        success: false,
        message: 'Registration endpoint not available. Please contact administrator.',
        data: null
    });
};

/**
 * Toggle user status (active/inactive)
 * @route   PATCH /api/auth/users/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        // Cannot toggle own status
        if (user._id.toString() === req.user.userId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Cannot toggle your own status',
                data: null
            });
        }

        // Toggle status between active and inactive
        user.status = user.status === 'active' ? 'inactive' : 'active';
        await user.save();

        logger.success(`User status toggled: ${user.username} -> ${user.status}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `User ${user.status} successfully`,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }
            }
        });
    } catch (error) {
        logger.error(`Toggle user status error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle user status',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    toggleUserStatus
};