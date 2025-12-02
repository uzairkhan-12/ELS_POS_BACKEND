const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/health.controller');

// @route   GET /api/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', healthCheck);

module.exports = router;