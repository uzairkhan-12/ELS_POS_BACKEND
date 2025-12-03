const Category = require('../models/Category');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
    try {
        const { status = 'active', limit = 100, skip = 0 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const categories = await Category.find(filter)
            .sort({ displayOrder: 1, name: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Category.countDocuments(filter);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Categories retrieved successfully',
            data: {
                categories,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        logger.error(`Get categories error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve categories',
            error: error.message
        });
    }
};
const getAllCategories = async (req, res) => {
    try {
        const { limit = 100, skip = 0 } = req.query;

        const filter = {};

        const categories = await Category.find(filter)
            .sort({ displayOrder: 1, name: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Category.countDocuments(filter);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Categories retrieved successfully',
            data: {
                categories,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        logger.error(`Get categories error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve categories',
            error: error.message
        });
    }
};

/**
 * Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Category not found',
                data: null
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Category retrieved successfully',
            data: { category }
        });
    } catch (error) {
        logger.error(`Get category error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve category',
            error: error.message
        });
    }
};

/**
 * Create new category
 * @route   POST /api/categories
 * @access  Private (Admin/Manager)
 */
const createCategory = async (req, res) => {
    try {
        const { name, description, displayOrder } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Category name is required',
                data: null
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ name: name.toLowerCase() });
        if (existingCategory) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Category with this name already exists',
                data: null
            });
        }

        const category = new Category({
            name: name.trim(),
            description: description?.trim() || '',
            displayOrder: displayOrder || 0
        });

        await category.save();

        logger.success(`Category created: ${category.name}`);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });
    } catch (error) {
        logger.error(`Create category error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        });
    }
};

/**
 * Update category
 * @route   PUT /api/categories/:id
 * @access  Private (Admin/Manager)
 */
const updateCategory = async (req, res) => {
    try {
        const { name, description, displayOrder, status } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Category not found',
                data: null
            });
        }

        // Check if name is being changed and if new name already exists
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ name: name.toLowerCase(), _id: { $ne: req.params.id } });
            if (existingCategory) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Category with this name already exists',
                    data: null
                });
            }
        }

        // Update fields
        if (name) category.name = name.trim();
        if (description !== undefined) category.description = description.trim();
        if (displayOrder !== undefined) category.displayOrder = displayOrder;
        if (status) category.status = status;

        await category.save();

        logger.success(`Category updated: ${category.name}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Category updated successfully',
            data: { category }
        });
    } catch (error) {
        logger.error(`Update category error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        });
    }
};

/**
 * Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin)
 */
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Category not found',
                data: null
            });
        }

        logger.success(`Category deleted: ${category.name}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Category deleted successfully',
            data: { category }
        });
    } catch (error) {
        logger.error(`Delete category error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete category',
            error: error.message
        });
    }
};

/**
 * Toggle category status (active/inactive)
 * @route   PATCH /api/categories/:id/toggle-status
 * @access  Private (Admin/Manager)
 */
const toggleStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Category not found',
                data: null
            });
        }

        // Toggle status between active and inactive
        category.status = category.status === 'active' ? 'inactive' : 'active';
        await category.save();

        logger.success(`Category status toggled: ${category.name} -> ${category.status}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Category ${category.status} successfully`,
            data: { category }
        });
    } catch (error) {
        logger.error(`Toggle category status error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle category status',
            error: error.message
        });
    }
};

module.exports = {
    getCategories,
    getCategory,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleStatus
};
