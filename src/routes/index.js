const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const categoriesRoutes = require('./categories.routes');
const itemsRoutes = require('./items.routes');
const staffRoutes = require('./staff.routes');
const tablesRoutes = require('./tables.routes');
const employeesRoutes = require('./employees.routes');
const ordersRoutes = require('./orders.routes');

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

// Tables routes
router.use('/tables', tablesRoutes);

// Employees routes
router.use('/employees', employeesRoutes);

// Orders routes
router.use('/orders', ordersRoutes);

module.exports = router;