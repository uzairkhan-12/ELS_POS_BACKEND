const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization denied.',
                data: null
            });
        }

        // Verify token
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message
        });
    }
};

/**
 * Middleware to check if user has required role
 */
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    authorize
};
