const mongoose = require('mongoose');
const { STATUS } = require('../config/constants');

const OrderItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: [true, 'Item ID is required']
    },
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number'
        }
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    subtotal: {
        type: Number,
        required: [true, 'Subtotal is required'],
        min: [0, 'Subtotal cannot be negative']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [200, 'Notes cannot exceed 200 characters']
    }
});

const OrderStaffSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: [true, 'Staff ID is required']
    },
    name: {
        type: String,
        required: [true, 'Staff name is required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Staff role is required'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Staff quantity is required'],
        min: [1, 'Staff quantity must be at least 1'],
        default: 1
    },
    bonus: {
        type: Number,
        required: [true, 'Staff bonus is required'],
        min: [0, 'Staff bonus cannot be negative']
    },
    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'Staff subtotal cannot be negative']
    }
});

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: [true, 'Order number is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: [true, 'Table ID is required']
    },
    tableNumber: {
        type: Number,
        required: [true, 'Table number is required']
    },
    items: {
        type: [OrderItemSchema],
        required: [true, 'At least one item is required'],
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'Order must contain at least one item'
        }
    },
    staff: {
        type: [OrderStaffSchema],
        required: [true, 'At least one staff member is required'],
        validate: {
            validator: function(staff) {
                return staff && staff.length > 0;
            },
            message: 'Order must have at least one staff member assigned'
        }
    },
    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'Subtotal cannot be negative']
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    },
    taxRate: {
        type: Number,
        default: 0, // 8% tax rate
        min: [0, 'Tax rate cannot be negative'],
        max: [1, 'Tax rate cannot exceed 100%']
    },
    total: {
        type: Number,
        default: 0,
        min: [0, 'Total cannot be negative']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    customerCount: {
        type: Number,
        min: [1, 'Customer count must be at least 1'],
        default: 1
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for better performance
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ tableId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: 1 });
OrderSchema.index({ paymentStatus: 1 });

// Virtual for total items count
OrderSchema.virtual('totalItems').get(function() {
    if (!this.items) return 0;
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Pre-validate middleware to calculate totals before validation
OrderSchema.pre('validate', function() {
    let itemsSubtotal = 0;
    let staffSubtotal = 0;
    
    // Calculate subtotal from items
    if (this.items && this.items.length > 0) {
        itemsSubtotal = this.items.reduce((total, item) => {
            item.subtotal = item.quantity * item.price;
            return total + item.subtotal;
        }, 0);
    }
    
    // Calculate subtotal from staff
    if (this.staff && this.staff.length > 0) {
        staffSubtotal = this.staff.reduce((total, staff) => {
            staff.subtotal = staff.quantity * staff.bonus;
            return total + staff.subtotal;
        }, 0);
    }
    
    // Set overall subtotal (items + staff)
    this.subtotal = itemsSubtotal + staffSubtotal;
    
    // Calculate tax (on total subtotal)
    this.tax = this.subtotal * this.taxRate;
    
    // Calculate final total
    this.total = this.subtotal + this.tax;
});

// Static method to generate order number
OrderSchema.statics.generateOrderNumber = async function() {
    const today = new Date();
    const dateStr = today.getFullYear().toString().slice(-2) + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    const count = await this.countDocuments({
        orderNumber: { $regex: `^ORD${dateStr}` }
    });
    
    return `ORD${dateStr}${(count + 1).toString().padStart(3, '0')}`;
};

module.exports = mongoose.model('Order', OrderSchema);