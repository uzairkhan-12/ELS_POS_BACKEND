const Table = require('../models/Table');
const { HTTP_STATUS, STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Get all tables (active only by default)
 * @route   GET /api/tables
 * @access  Public
 */
const getTables = async (req, res) => {
    try {
        const { limit = 100, skip = 0, status = STATUS.ACTIVE } = req.query;

        const query = { status };
        const tables = await Table.find(query)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ tableNumber: 1 });

        const total = await Table.countDocuments(query);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Tables retrieved successfully',
            data: { tables, total }
        });
    } catch (error) {
        logger.error(`Get tables error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve tables',
            error: error.message
        });
    }
};

/**
 * Get all tables (active and inactive)
 * @route   GET /api/tables/all
 * @access  Public
 */
const getAllTables = async (req, res) => {
    try {
        const { limit = 100, skip = 0 } = req.query;

        const tables = await Table.find()
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ tableNumber: 1 });

        const total = await Table.countDocuments();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'All tables retrieved successfully',
            data: { tables, total }
        });
    } catch (error) {
        logger.error(`Get all tables error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve tables',
            error: error.message
        });
    }
};

/**
 * Get single table by ID
 * @route   GET /api/tables/:id
 * @access  Public
 */
const getTable = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Table not found',
                data: null
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Table retrieved successfully',
            data: { table }
        });
    } catch (error) {
        logger.error(`Get table error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve table',
            error: error.message
        });
    }
};

/**
 * Create new table
 * @route   POST /api/tables
 * @access  Private (Admin/Manager)
 */
const createTable = async (req, res) => {
    try {
        const { tableNumber, capacity, occupied, notes } = req.body;

        // Validation
        if (!tableNumber) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Table number is required',
                data: null
            });
        }

        if (!capacity) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Table capacity is required',
                data: null
            });
        }

        // Check if table number already exists
        const existingTable = await Table.findOne({ tableNumber });
        if (existingTable) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Table with this number already exists',
                data: null
            });
        }

        const table = new Table({
            tableNumber: parseInt(tableNumber),
            capacity: parseInt(capacity),
            occupied: occupied || false,
            notes: notes || ''
        });

        await table.save();

        logger.success(`Table created: Table #${table.tableNumber}`);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Table created successfully',
            data: { table }
        });
    } catch (error) {
        logger.error(`Create table error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create table',
            error: error.message
        });
    }
};

/**
 * Update table
 * @route   PUT /api/tables/:id
 * @access  Private (Admin/Manager)
 */
const updateTable = async (req, res) => {
    try {
        const { tableNumber, capacity, occupied, status, position, notes } = req.body;

        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Table not found',
                data: null
            });
        }

        // Check if new table number is already taken by another table
        if (tableNumber && tableNumber !== table.tableNumber) {
            const existingTable = await Table.findOne({ tableNumber });
            if (existingTable) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Table with this number already exists',
                    data: null
                });
            }
            table.tableNumber = parseInt(tableNumber);
        }

        if (capacity) table.capacity = parseInt(capacity);
        if (occupied !== undefined) table.occupied = occupied;
        if (status) table.status = status;
        if (position) table.position = position;
        if (notes !== undefined) table.notes = notes;

        await table.save();

        logger.success(`Table updated: Table #${table.tableNumber}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Table updated successfully',
            data: { table }
        });
    } catch (error) {
        logger.error(`Update table error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update table',
            error: error.message
        });
    }
};

/**
 * Delete table
 * @route   DELETE /api/tables/:id
 * @access  Private (Admin)
 */
const deleteTable = async (req, res) => {
    try {
        const table = await Table.findByIdAndDelete(req.params.id);

        if (!table) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Table not found',
                data: null
            });
        }

        logger.success(`Table deleted: Table #${table.tableNumber}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Table deleted successfully',
            data: { table }
        });
    } catch (error) {
        logger.error(`Delete table error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete table',
            error: error.message
        });
    }
};

/**
 * Toggle table status (active/inactive)
 * @route   PATCH /api/tables/:id/toggle-status
 * @access  Private (Admin/Manager)
 */
const toggleStatus = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Table not found',
                data: null
            });
        }

        table.status = table.status === STATUS.ACTIVE ? STATUS.INACTIVE : STATUS.ACTIVE;
        await table.save();

        logger.success(`Table status toggled: Table #${table.tableNumber} is now ${table.status}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Table status updated to ${table.status}`,
            data: { table }
        });
    } catch (error) {
        logger.error(`Toggle table status error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle table status',
            error: error.message
        });
    }
};

/**
 * Toggle table occupied status
 * @route   PATCH /api/tables/:id/toggle-occupied
 * @access  Private
 */
const toggleOccupied = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Table not found',
                data: null
            });
        }

        table.occupied = !table.occupied;
        await table.save();

        logger.success(`Table occupied status toggled: Table #${table.tableNumber} is now ${table.occupied ? 'occupied' : 'empty'}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Table is now ${table.occupied ? 'occupied' : 'empty'}`,
            data: { table }
        });
    } catch (error) {
        logger.error(`Toggle table occupied error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle table occupied status',
            error: error.message
        });
    }
};

/**
 * Set table occupied status
 * @route   PATCH /api/tables/:id/occupied
 * @access  Private
 */
const setOccupied = async (req, res) => {
    try {
        const { occupied } = req.body;
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Table not found',
                data: null
            });
        }

        table.occupied = occupied;
        await table.save();

        logger.success(`Table occupied status set: Table #${table.tableNumber} is now ${table.occupied ? 'occupied' : 'empty'}`);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Table is now ${table.occupied ? 'occupied' : 'empty'}`,
            data: { table }
        });
    } catch (error) {
        logger.error(`Set table occupied error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to set table occupied status',
            error: error.message
        });
    }
};

/**
 * Update table positions (for drag and drop)
 * @route   PATCH /api/tables/positions
 * @access  Private (Admin/Manager)
 */
const updatePositions = async (req, res) => {
    try {
        const { positions } = req.body; // Array of { id, position: { x, y } }

        if (!Array.isArray(positions)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Positions must be an array',
                data: null
            });
        }

        const updatePromises = positions.map(({ id, position }) =>
            Table.findByIdAndUpdate(
                id,
                { position },
                { new: true }
            )
        );

        const updatedTables = await Promise.all(updatePromises);

        logger.success('Table positions updated');

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Table positions updated successfully',
            data: { tables: updatedTables }
        });
    } catch (error) {
        logger.error(`Update table positions error: ${error.message}`);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update table positions',
            error: error.message
        });
    }
};

module.exports = {
    getTables,
    getAllTables,
    getTable,
    createTable,
    updateTable,
    deleteTable,
    toggleStatus,
    toggleOccupied,
    setOccupied,
    updatePositions
};
