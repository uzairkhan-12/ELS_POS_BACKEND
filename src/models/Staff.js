const mongoose = require('mongoose');
const { STATUS, USER_ROLES } = require('../config/constants');

const StaffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Staff name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                // Allow null/undefined
                if (!v) return true;
                // If provided, validate format
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email'
        },
        sparse: true // Allow null but unique if provided
    },
    phone: {
        type: String,
        trim: true,
        default: '',
        validate: {
            validator: function(v) {
                // Allow empty or valid phone format
                if (!v) return true;
                return /^[\d\s\-\+\(\)]+$/.test(v);
            },
            message: 'Please enter a valid phone number'
        }
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.CASHIER
    },
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.ACTIVE
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    salary: {
        type: Number,
        min: [0, 'Salary cannot be negative'],
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better query performance
StaffSchema.index({ name: 1 });
StaffSchema.index({ email: 1 });
StaffSchema.index({ role: 1 });
StaffSchema.index({ status: 1 });

const Staff = mongoose.model('Staff', StaffSchema);

module.exports = Staff;
