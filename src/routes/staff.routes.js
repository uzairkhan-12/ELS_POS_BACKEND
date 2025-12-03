const express = require('express');
const router = express.Router();
const {
    getStaff,
    getAllStaff,
    getStaffMember,
    createStaff,
    updateStaff,
    deleteStaff,
    toggleStatus
} = require('../controllers/staff.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');

// @route   GET /api/staff
// @desc    Get all staff (active only by default)
// @access  Public
router.get('/', getStaff);

// @route   GET /api/staff/all
// @desc    Get all staff (active and inactive)
// @access  Public
router.get('/all', getAllStaff);

// @route   GET /api/staff/:id
// @desc    Get staff member by ID
// @access  Public
router.get('/:id', getStaffMember);

// @route   POST /api/staff
// @desc    Create new staff member
// @access  Private (Admin/Manager)
router.post('/', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), createStaff);

// @route   PUT /api/staff/:id
// @desc    Update staff member
// @access  Private (Admin/Manager)
router.put('/:id', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), updateStaff);

// @route   PATCH /api/staff/:id/toggle-status
// @desc    Toggle staff member status (active/inactive)
// @access  Private (Admin/Manager)
router.patch('/:id/toggle-status', authMiddleware, authorize([USER_ROLES.ADMIN, USER_ROLES.MANAGER]), toggleStatus);

// @route   DELETE /api/staff/:id
// @desc    Delete staff member
// @access  Private (Admin)
router.delete('/:id', authMiddleware, authorize([USER_ROLES.ADMIN]), deleteStaff);

module.exports = router;
