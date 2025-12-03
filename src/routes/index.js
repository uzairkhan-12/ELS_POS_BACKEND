const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const categoriesRoutes = require('./categories.routes');
const itemsRoutes = require('./items.routes');
const staffRoutes = require('./staff.routes');

// Health check routes
router.use('/', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

// Categories routes
router.use('/categories', categoriesRoutes);

// Items routes
router.use('/items', itemsRoutes);

// Staff routes
router.use('/staff', staffRoutes);

module.exports = router;