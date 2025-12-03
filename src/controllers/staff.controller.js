const Staff = require('../models/Staff');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Get all staff (active only by default)
 * @route   GET /api/staff
 * @access  Public
 */
const getStaff = async (req, res) => {
    try {
        const { status = 'active', role, limit = 100, skip = 0 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (role) filter.role = role;

        const staff = await Staff.find(filter)
            .sort({ name: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Staff.countDocuments(filter);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Staff retrieved successfully',
            data: {
                staff,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        logger.error(`Get staff error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve staff',
            error: error.message
        });
    }
};

/**
 * Get all staff (active and inactive)
 * @route   GET /api/staff/all
 * @access  Public
 */
const getAllStaff = async (req, res) => {
    try {
        const { role, limit = 100, skip = 0 } = req.query;

        const filter = {};
        if (role) filter.role = role;

        const staff = await Staff.find(filter)
            .sort({ name: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Staff.countDocuments(filter);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Staff retrieved successfully',
            data: {
                staff,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        logger.error(`Get staff error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve staff',
            error: error.message
        });
    }
};

/**
 * Get single staff member by ID
 * @route   GET /api/staff/:id
 * @access  Public
 */
const getStaffMember = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Staff member not found',
                data: null
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Staff member retrieved successfully',
            data: { staff }
        });
    } catch (error) {
        logger.error(`Get staff member error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve staff member',
            error: error.message
        });
    }
};

/**
 * Create new staff member
 * @route   POST /api/staff
 * @access  Private (Admin/Manager)
 */
const createStaff = async (req, res) => {
    try {
        const { name, email, phone, role, bonus } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Staff name is required',
                data: null
            });
        }

        const staff = new Staff({
            name: name.trim(),
            email: email?.trim() || '',
            phone: phone?.trim() || '',
            role: role || 'cashier',
            bonus: bonus || 0
        });

        await staff.save();

        logger.success(`Staff member created: ${staff.name}`);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Staff member created successfully',
            data: { staff }
        });
    } catch (error) {
        logger.error(`Create staff error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create staff member',
            error: error.message
        });
    }
};

/**
 * Update staff member
 * @route   PUT /api/staff/:id
 * @access  Private (Admin/Manager)
 */
const updateStaff = async (req, res) => {
    try {
        const { name, email, phone, role, bonus, status } = req.body;

        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Staff member not found',
                data: null
            });
        }

        // Update fields
        if (name) staff.name = name.trim();
        if (email !== undefined) staff.email = email?.trim() || '';
        if (phone !== undefined) staff.phone = phone?.trim() || '';
        if (role) staff.role = role;
        if (bonus !== undefined) {
            if (bonus < 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Bonus cannot be negative',
                    data: null
                });
            }
            staff.bonus = bonus;
        }
        if (status) staff.status = status;

        await staff.save();

        logger.success(`Staff member updated: ${staff.name}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Staff member updated successfully',
            data: { staff }
        });
    } catch (error) {
        logger.error(`Update staff error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update staff member',
            error: error.message
        });
    }
};

/**
 * Delete staff member
 * @route   DELETE /api/staff/:id
 * @access  Private (Admin)
 */
const deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);

        if (!staff) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Staff member not found',
                data: null
            });
        }

        logger.success(`Staff member deleted: ${staff.name}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Staff member deleted successfully',
            data: { staff }
        });
    } catch (error) {
        logger.error(`Delete staff error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete staff member',
            error: error.message
        });
    }
};

/**
 * Toggle staff member status (active/inactive)
 * @route   PATCH /api/staff/:id/toggle-status
 * @access  Private (Admin/Manager)
 */
const toggleStatus = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Staff member not found',
                data: null
            });
        }

        // Toggle status between active and inactive
        staff.status = staff.status === 'active' ? 'inactive' : 'active';
        await staff.save();

        logger.success(`Staff member status toggled: ${staff.name} -> ${staff.status}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Staff member ${staff.status} successfully`,
            data: { staff }
        });
    } catch (error) {
        logger.error(`Toggle staff status error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle staff member status',
            error: error.message
        });
    }
};

module.exports = {
    getStaff,
    getAllStaff,
    getStaffMember,
    createStaff,
    updateStaff,
    deleteStaff,
    toggleStatus
};
