const express = require('express');
const router = express.Router();
const {
    getEmployees,
    getAllEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleStatus,
    getEmployeesByDepartment,
    getEmployeeStats
} = require('../controllers/employees.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Get employee statistics (admin/manager only)
router.get('/stats', authorize(['admin', 'manager']), getEmployeeStats);

// Get ALL employees (admin/manager only) - must come before /:id
router.get('/all', authorize(['admin', 'manager']), getAllEmployees);

// Get employees by department
router.get('/department/:department', getEmployeesByDepartment);

// Get active employees (default)
router.get('/', getEmployees);

// Get single employee
router.get('/:id', getEmployee);

// Create new employee (admin/manager only)
router.post('/', authorize(['admin', 'manager']), createEmployee);

// Update employee (admin/manager only)
router.put('/:id', authorize(['admin', 'manager']), updateEmployee);

// Toggle employee status (admin/manager only)
router.patch('/:id/toggle-status', authorize(['admin', 'manager']), toggleStatus);

// Delete employee (admin only)
router.delete('/:id', authorize(['admin']), deleteEmployee);

module.exports = router;