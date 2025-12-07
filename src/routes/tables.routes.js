const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/tables.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Public routes (no auth required for viewing)
router.get('/', getTables);
router.get('/all', getAllTables);

// Protected special routes (must come before /:id)
router.patch('/positions', authMiddleware, authorize(['admin', 'manager']), updatePositions);

// ID-based routes
router.get('/:id', getTable);
router.post('/', authMiddleware, authorize(['admin', 'manager']), createTable);
router.put('/:id', authMiddleware, authorize(['admin', 'manager']), updateTable);
router.patch('/:id/toggle-status', authMiddleware, authorize(['admin', 'manager']), toggleStatus);
router.patch('/:id/toggle-occupied', authMiddleware, toggleOccupied);
router.patch('/:id/occupied', authMiddleware, setOccupied);
router.delete('/:id', authMiddleware, authorize(['admin']), deleteTable);

module.exports = router;
