const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const categoriesRoutes = require('./categories.routes');

// Health check routes
router.use('/', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

// Categories routes
router.use('/categories', categoriesRoutes);

module.exports = router;