const mongoose = require('mongoose');
const { STATUS } = require('../config/constants');

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        minlength: [2, 'Item name must be at least 2 characters'],
        maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.ACTIVE
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better query performance
ItemSchema.index({ name: 1 });
ItemSchema.index({ categoryId: 1 });
ItemSchema.index({ status: 1 });

const Item = mongoose.model('Item', ItemSchema);

module.exports = Item;
