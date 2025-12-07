const mongoose = require('mongoose');
const { STATUS } = require('../config/constants');

const EmployeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [3, 'Employee ID must be at least 3 characters'],
        maxlength: [20, 'Employee ID cannot exceed 20 characters']
    },
    name: {
        type: String,
        required: [true, 'Employee name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email'
        }
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^[\d\s\-\+\(\)]+$/.test(v) && v.length >= 10;
            },
            message: 'Please enter a valid phone number (minimum 10 digits)'
        }
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['Kitchen', 'Service', 'Management', 'Maintenance', 'Security', 'Accounting'],
        trim: true
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true,
        minlength: [2, 'Position must be at least 2 characters'],
        maxlength: [50, 'Position cannot exceed 50 characters']
    },
    salary: {
        type: Number,
        required: [true, 'Salary is required'],
        min: [0, 'Salary cannot be negative']
    },
    hireDate: {
        type: Date,
        required: [true, 'Hire date is required'],
        default: Date.now
    },
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.ACTIVE
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for better performance
EmployeeSchema.index({ employeeId: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ email: 1 });

// Virtual for years of service
EmployeeSchema.virtual('yearsOfService').get(function() {
    if (!this.hireDate) return 0;
    const now = new Date();
    const diffTime = Math.abs(now - this.hireDate);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
});

module.exports = mongoose.model('Employee', EmployeeSchema);