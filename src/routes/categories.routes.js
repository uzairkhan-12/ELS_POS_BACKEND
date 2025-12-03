const express = require('express');
const router = express.Router();
const {
    getCategories,
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleStatus
} = require('../controllers/categories.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', getCategories);

// @route   GET /api/categories/all
// @desc    Get all categories (active and inactive)
// @access  Public
router.get('/all', getAllCategories);

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', getCategory);

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Admin/Manager)
router.post('/', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin/Manager)
router.put('/:id', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), updateCategory);

// @route   PATCH /api/categories/:id/toggle-status
// @desc    Toggle category status (active/inactive)
// @access  Private (Admin/Manager)
router.patch('/:id/toggle-status', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), toggleStatus);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin)
router.delete('/:id', authMiddleware, authorize([USER_ROLES.ADMIN]), deleteCategory);

module.exports = router;
