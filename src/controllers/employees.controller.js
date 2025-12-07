const Employee = require('../models/Employee');
const { STATUS } = require('../config/constants');

// Get active employees (default view)
exports.getEmployees = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 100, 
            search = '', 
            department = '',
            sortBy = 'name',
            sortOrder = 'asc' 
        } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        
        // Build query for active employees
        let query = { status: STATUS.ACTIVE };
        
        // Add search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Add department filter
        if (department) {
            query.department = department;
        }
        
        const employees = await Employee.find(query)
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Employee.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                employees,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get ALL employees (active and inactive)
exports.getAllEmployees = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 100, 
            search = '', 
            department = '',
            status = '',
            sortBy = 'name',
            sortOrder = 'asc' 
        } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        
        // Build query for all employees
        let query = {};
        
        // Add search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Add department filter
        if (department) {
            query.department = department;
        }
        
        // Add status filter
        if (status) {
            query.status = status;
        }
        
        const employees = await Employee.find(query)
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Employee.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                employees,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single employee
exports.getEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const employee = await Employee.findById(id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.json({
            success: true,
            data: { employee }
        });
    } catch (error) {
        next(error);
    }
};

// Create new employee
exports.createEmployee = async (req, res, next) => {
    try {
        const { employeeId, name, email, phone, department, position, salary, hireDate, address } = req.body;
        
        // Check if employeeId already exists
        const existingEmployee = await Employee.findOne({ employeeId: employeeId.toUpperCase() });
        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID already exists'
            });
        }
        
        // Check if email already exists
        const existingEmail = await Employee.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        const employee = new Employee({
            employeeId: employeeId.toUpperCase(),
            name,
            email: email.toLowerCase(),
            phone,
            department,
            position,
            salary,
            hireDate: hireDate ? new Date(hireDate) : new Date(),
            address
        });
        
        await employee.save();
        
        res.status(201).json({
            success: true,
            data: { employee },
            message: 'Employee created successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }
        next(error);
    }
};

// Update employee
exports.updateEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Handle employeeId update
        if (updateData.employeeId) {
            updateData.employeeId = updateData.employeeId.toUpperCase();
            
            // Check if new employeeId conflicts with existing one
            const existingEmployee = await Employee.findOne({ 
                employeeId: updateData.employeeId,
                _id: { $ne: id }
            });
            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID already exists'
                });
            }
        }
        
        // Handle email update
        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase();
            
            // Check if new email conflicts with existing one
            const existingEmail = await Employee.findOne({ 
                email: updateData.email,
                _id: { $ne: id }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        // Handle hire date update
        if (updateData.hireDate) {
            updateData.hireDate = new Date(updateData.hireDate);
        }
        
        const employee = await Employee.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.json({
            success: true,
            data: { employee },
            message: 'Employee updated successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }
        next(error);
    }
};

// Delete employee
exports.deleteEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const employee = await Employee.findByIdAndDelete(id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Toggle employee status
exports.toggleStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const employee = await Employee.findById(id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        employee.status = employee.status === STATUS.ACTIVE ? STATUS.INACTIVE : STATUS.ACTIVE;
        await employee.save();
        
        res.json({
            success: true,
            data: { employee },
            message: `Employee ${employee.status === STATUS.ACTIVE ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        next(error);
    }
};

// Get employees by department
exports.getEmployeesByDepartment = async (req, res, next) => {
    try {
        const { department } = req.params;
        const { status = STATUS.ACTIVE } = req.query;
        
        const employees = await Employee.find({ 
            department,
            status 
        }).sort({ name: 1 });
        
        res.json({
            success: true,
            data: { employees }
        });
    } catch (error) {
        next(error);
    }
};

// Get employee statistics
exports.getEmployeeStats = async (req, res, next) => {
    try {
        const stats = await Employee.aggregate([
            {
                $group: {
                    _id: null,
                    totalEmployees: { $sum: 1 },
                    activeEmployees: { 
                        $sum: { $cond: [{ $eq: ['$status', STATUS.ACTIVE] }, 1, 0] } 
                    },
                    inactiveEmployees: { 
                        $sum: { $cond: [{ $eq: ['$status', STATUS.INACTIVE] }, 1, 0] } 
                    },
                    averageSalary: { $avg: '$salary' },
                    totalSalaryBudget: { $sum: '$salary' }
                }
            }
        ]);
        
        const departmentStats = await Employee.aggregate([
            {
                $match: { status: STATUS.ACTIVE }
            },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    averageSalary: { $avg: '$salary' },
                    totalSalary: { $sum: '$salary' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    totalEmployees: 0,
                    activeEmployees: 0,
                    inactiveEmployees: 0,
                    averageSalary: 0,
                    totalSalaryBudget: 0
                },
                departmentBreakdown: departmentStats
            }
        });
    } catch (error) {
        next(error);
    }
};