const express = require('express');
const router = express.Router();
const {
    getOrders,
    getOrder,
    createOrder,
    updateOrder,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    getOrdersByTable,
    getOrderStats
} = require('../controllers/orders.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Get order statistics (admin/manager only)
router.get('/stats', authorize(['admin', 'manager']), getOrderStats);

// Get orders by table
router.get('/table/:tableId', getOrdersByTable);

// Get all orders
router.get('/', getOrders);

// Get single order
router.get('/:id', getOrder);

// Create new order
router.post('/', createOrder);

// Update order
router.put('/:id', authorize(['admin', 'manager', 'waiter']), updateOrder);

// Update order status
router.patch('/:id/status', updateOrderStatus);

// Update payment status
router.patch('/:id/payment', authorize(['admin', 'manager', 'cashier']), updatePaymentStatus);

// Delete order (admin/manager only)
router.delete('/:id', authorize(['admin', 'manager']), deleteOrder);

module.exports = router;