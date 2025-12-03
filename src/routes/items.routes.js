const express = require('express');
const router = express.Router();
const {
    getItems,
    getAllItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus
} = require('../controllers/items.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');

// @route   GET /api/items
// @desc    Get all items
// @access  Public
router.get('/', getItems);

// @route   GET /api/items/all
// @desc    Get all items (active and inactive)
// @access  Public
router.get('/all', getAllItems);

// @route   GET /api/items/:id
// @desc    Get item by ID
// @access  Public
router.get('/:id', getItem);

// @route   POST /api/items
// @desc    Create new item
// @access  Private (Admin/Manager)
router.post('/', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), createItem);

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private (Admin/Manager)
router.put('/:id', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), updateItem);

// @route   PATCH /api/items/:id/toggle-status
// @desc    Toggle item status (active/inactive)
// @access  Private (Admin/Manager)
router.patch('/:id/toggle-status', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), toggleStatus);

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (Admin)
router.delete('/:id', authMiddleware, authorize([USER_ROLES.ADMIN]), deleteItem);

module.exports = router;
