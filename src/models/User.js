const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { STATUS, USER_ROLES } = require('../config/constants');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        lowercase: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
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
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
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
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better query performance
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

// Hash password before saving
UserSchema.pre('save', async function() {
    // Only hash password if it's new or modified
    if (!this.isModified('password')) {
        return;
    }

    try {
        // Generate salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Method to compare password with hashed password
UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get user data without password
UserSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;