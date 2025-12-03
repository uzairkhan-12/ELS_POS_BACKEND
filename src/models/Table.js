const mongoose = require('mongoose');
const { STATUS } = require('../config/constants');

const TableSchema = new mongoose.Schema({
    tableNumber: {
        type: Number,
        required: [true, 'Table number is required'],
        unique: true,
        min: [1, 'Table number must be at least 1']
    },
    capacity: {
        type: Number,
        required: [true, 'Table capacity is required'],
        min: [1, 'Capacity must be at least 1'],
        max: [20, 'Capacity cannot exceed 20']
    },
    occupied: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.ACTIVE
    },
    position: {
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        }
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better query performance
TableSchema.index({ tableNumber: 1 });
TableSchema.index({ status: 1 });
TableSchema.index({ occupied: 1 });

const Table = mongoose.model('Table', TableSchema);

module.exports = Table;
