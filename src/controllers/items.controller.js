const Item = require('../models/Item');
const Category = require('../models/Category');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Get all items
 * @route   GET /api/items
 * @access  Public
 */
const getItems = async (req, res) => {
    try {
        const { categoryId, status = 'active', limit = 100, skip = 0 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (categoryId) filter.categoryId = categoryId;

        const items = await Item.find(filter)
            .populate('categoryId', 'name')
            .sort({ name: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Item.countDocuments(filter);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Items retrieved successfully',
            data: {
                items,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        logger.error(`Get items error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve items',
            error: error.message
        });
    }
};

/**
 * Get all items (active and inactive)
 * @route   GET /api/items/all
 * @access  Public
 */
const getAllItems = async (req, res) => {
    try {
        const { categoryId, limit = 100, skip = 0 } = req.query;

        const filter = {};
        if (categoryId) filter.categoryId = categoryId;

        const items = await Item.find(filter)
            .populate('categoryId', 'name')
            .sort({ name: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Item.countDocuments(filter);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Items retrieved successfully',
            data: {
                items,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        logger.error(`Get items error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve items',
            error: error.message
        });
    }
};

/**
 * Get single item by ID
 * @route   GET /api/items/:id
 * @access  Public
 */
const getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('categoryId', 'name');

        if (!item) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Item not found',
                data: null
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Item retrieved successfully',
            data: { item }
        });
    } catch (error) {
        logger.error(`Get item error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve item',
            error: error.message
        });
    }
};

/**
 * Create new item
 * @route   POST /api/items
 * @access  Private (Admin/Manager)
 */
const createItem = async (req, res) => {
    try {
        const { name, description, categoryId, price } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Item name is required',
                data: null
            });
        }

        if (!categoryId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Category is required',
                data: null
            });
        }

        if (price === undefined || price === null) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Price is required',
                data: null
            });
        }

        if (price < 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Price cannot be negative',
                data: null
            });
        }

        // Verify category exists
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Category does not exist',
                data: null
            });
        }

        const item = new Item({
            name: name.trim(),
            description: description?.trim() || '',
            categoryId,
            price
        });

        await item.save();
        await item.populate('categoryId', 'name');

        logger.success(`Item created: ${item.name}`);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Item created successfully',
            data: { item }
        });
    } catch (error) {
        logger.error(`Create item error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create item',
            error: error.message
        });
    }
};

/**
 * Update item
 * @route   PUT /api/items/:id
 * @access  Private (Admin/Manager)
 */
const updateItem = async (req, res) => {
    try {
        const { name, description, categoryId, price, status } = req.body;

        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Item not found',
                data: null
            });
        }

        // Verify category exists if being changed
        if (categoryId && categoryId !== item.categoryId.toString()) {
            const categoryExists = await Category.findById(categoryId);
            if (!categoryExists) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Category does not exist',
                    data: null
                });
            }
        }

        // Update fields
        if (name) item.name = name.trim();
        if (description !== undefined) item.description = description.trim();
        if (categoryId) item.categoryId = categoryId;
        if (price !== undefined) {
            if (price < 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Price cannot be negative',
                    data: null
                });
            }
            item.price = price;
        }
        if (status) item.status = status;

        await item.save();
        await item.populate('categoryId', 'name');

        logger.success(`Item updated: ${item.name}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Item updated successfully',
            data: { item }
        });
    } catch (error) {
        logger.error(`Update item error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update item',
            error: error.message
        });
    }
};

/**
 * Delete item
 * @route   DELETE /api/items/:id
 * @access  Private (Admin)
 */
const deleteItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Item not found',
                data: null
            });
        }

        logger.success(`Item deleted: ${item.name}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Item deleted successfully',
            data: { item }
        });
    } catch (error) {
        logger.error(`Delete item error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete item',
            error: error.message
        });
    }
};

/**
 * Toggle item status (active/inactive)
 * @route   PATCH /api/items/:id/toggle-status
 * @access  Private (Admin/Manager)
 */
const toggleStatus = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Item not found',
                data: null
            });
        }

        // Toggle status between active and inactive
        item.status = item.status === 'active' ? 'inactive' : 'active';
        await item.save();
        await item.populate('categoryId', 'name');

        logger.success(`Item status toggled: ${item.name} -> ${item.status}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Item ${item.status} successfully`,
            data: { item }
        });
    } catch (error) {
        logger.error(`Toggle item status error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle item status',
            error: error.message
        });
    }
};

module.exports = {
    getItems,
    getAllItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus
};
