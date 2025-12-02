const mongoose = require('mongoose');
const { STATUS } = require('../config/constants');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters'],
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.ACTIVE
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better query performance
CategorySchema.index({ name: 1 });
CategorySchema.index({ status: 1 });
CategorySchema.index({ displayOrder: 1 });

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
