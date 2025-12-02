const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, email, role) => {
    try {
        const token = jwt.sign(
            { userId, email, role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );
        return token;
    } catch (error) {
        logger.error(`Error generating token: ${error.message}`);
        throw new Error('Failed to generate authentication token');
    }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        logger.error(`Error verifying token: ${error.message}`);
        throw new Error('Invalid or expired token');
    }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        logger.error(`Error decoding token: ${error.message}`);
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
};
