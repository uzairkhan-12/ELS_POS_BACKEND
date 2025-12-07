const Order = require('../models/Order');
const Item = require('../models/Item');
const Staff = require('../models/Staff');
const Table = require('../models/Table');
const { STATUS } = require('../config/constants');

// Get all orders with pagination and filters
exports.getOrders = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            status = '',
            paymentStatus = '',
            tableId = '',
            startDate = '',
            endDate = '',
            sortBy = 'createdAt',
            sortOrder = 'desc' 
        } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        
        // Build query
        let query = {};
        
        // Add status filter
        if (status) {
            query.status = status;
        }
        
        // Add payment status filter
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        
        // Add table filter
        if (tableId) {
            query.tableId = tableId;
        }
        
        // Add date range filter
        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) {
                query.orderDate.$gte = new Date(startDate);
            }
            if (endDate) {
                query.orderDate.$lte = new Date(endDate);
            }
        }
        
        const orders = await Order.find(query)
            .populate('tableId', 'tableNumber capacity')
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                orders,
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

// Get single order
exports.getOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id)
            .populate('tableId', 'tableNumber capacity status')
            .populate('items.itemId', 'name description categoryId')
            .populate('staff.staffId', 'name email phone role');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

// Create new order
exports.createOrder = async (req, res, next) => {
    try {
        const { tableId, items, staff, notes, customerCount, taxRate, paymentStatus } = req.body;
        
        // Validate table exists and get table number
        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }
        
        // Validate staff array exists and has at least one member
        if (!staff || !Array.isArray(staff) || staff.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one staff member is required'
            });
        }
        
        // Validate and populate staff
        const orderStaff = [];
        for (const staffMember of staff) {
            const staffDoc = await Staff.findById(staffMember.staffId);
            if (!staffDoc) {
                return res.status(404).json({
                    success: false,
                    message: `Staff member with ID ${staffMember.staffId} not found`
                });
            }
            
            if (staffDoc.status !== STATUS.ACTIVE) {
                return res.status(400).json({
                    success: false,
                    message: `Staff member "${staffDoc.name}" is not active`
                });
            }
            
            orderStaff.push({
                staffId: staffDoc._id,
                name: staffDoc.name,
                role: staffDoc.role,
                quantity: staffMember.quantity || 1,
                bonus: staffDoc.bonus,
                subtotal: (staffMember.quantity || 1) * staffDoc.bonus
            });
        }

        // Validate and populate items
        const orderItems = [];
        for (const orderItem of items) {
            const item = await Item.findById(orderItem.itemId);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: `Item with ID ${orderItem.itemId} not found`
                });
            }
            
            if (item.status !== STATUS.ACTIVE) {
                return res.status(400).json({
                    success: false,
                    message: `Item "${item.name}" is not available`
                });
            }
            
            orderItems.push({
                itemId: item._id,
                name: item.name,
                quantity: orderItem.quantity,
                price: item.price,
                subtotal: orderItem.quantity * item.price,
                notes: orderItem.notes || ''
            });
        }
        
        // Generate order number
        const orderNumber = await Order.generateOrderNumber();
        
        // Create order with status set to "served"
        const order = new Order({
            orderNumber,
            tableId: table._id,
            tableNumber: table.tableNumber,
            items: orderItems,
            staff: orderStaff,
            notes: notes || '',
            customerCount: customerCount || 1,
            taxRate: taxRate || 0.08,
            status: 'served',
            paymentStatus: paymentStatus || 'paid'
        });
        
        await order.save();
        
        // Update table to occupied status
        if (!table.occupied) {
            table.occupied = true;
            await table.save();
        }
        
        // Populate the order for response
        const populatedOrder = await Order.findById(order._id)
            .populate('tableId', 'tableNumber capacity')
            .populate('items.itemId', 'name description')
            .populate('staff.staffId', 'name email role');
        
        res.status(201).json({
            success: true,
            data: { order: populatedOrder },
            message: 'Order created successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Update order
exports.updateOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Don't allow updating order number, table, or staff after creation
        delete updateData.orderNumber;
        delete updateData.tableId;
        delete updateData.tableNumber;
        delete updateData.staff;
        
        // If updating items, validate them
        if (updateData.items) {
            const orderItems = [];
            for (const orderItem of updateData.items) {
                const item = await Item.findById(orderItem.itemId);
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        message: `Item with ID ${orderItem.itemId} not found`
                    });
                }
                
                orderItems.push({
                    itemId: item._id,
                    name: item.name,
                    quantity: orderItem.quantity,
                    price: item.price,
                    subtotal: orderItem.quantity * item.price,
                    notes: orderItem.notes || ''
                });
            }
            updateData.items = orderItems;
        }
        
        const order = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('tableId', 'tableNumber capacity')
         .populate('items.itemId', 'name description')
         .populate('staff.staffId', 'name email role');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data: { order },
            message: 'Order updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }
        
        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate('tableId', 'tableNumber capacity');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // If order is served or cancelled, mark table as available
        if (status === 'served' || status === 'cancelled') {
            const table = await Table.findById(order.tableId);
            if (table && table.occupied) {
                table.occupied = false;
                await table.save();
            }
        }
        
        res.json({
            success: true,
            data: { order },
            message: `Order status updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
};

// Update payment status
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;
        
        const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }
        
        const order = await Order.findByIdAndUpdate(
            id,
            { paymentStatus },
            { new: true, runValidators: true }
        );
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data: { order },
            message: `Payment status updated to ${paymentStatus}`
        });
    } catch (error) {
        next(error);
    }
};

// Delete order
exports.deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Only allow deletion of pending or cancelled orders
        if (order.status !== 'pending' && order.status !== 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete order that is in progress'
            });
        }
        
        await Order.findByIdAndDelete(id);
        
        // Mark table as available if it was occupied by this order
        const table = await Table.findById(order.tableId);
        if (table && table.occupied) {
            table.occupied = false;
            await table.save();
        }
        
        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get orders by table
exports.getOrdersByTable = async (req, res, next) => {
    try {
        const { tableId } = req.params;
        const { status = '' } = req.query;
        
        let query = { tableId };
        
        if (status) {
            query.status = status;
        }
        
        const orders = await Order.find(query)
            .populate('tableId', 'tableNumber capacity')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: { orders }
        });
    } catch (error) {
        next(error);
    }
};

// Get order statistics
exports.getOrderStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' },
                    pendingOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
                    },
                    confirmedOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } 
                    },
                    preparingOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'preparing'] }, 1, 0] } 
                    },
                    readyOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] } 
                    },
                    servedOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'served'] }, 1, 0] } 
                    },
                    cancelledOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } 
                    },
                    paidOrders: { 
                        $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } 
                    },
                    unpaidOrders: { 
                        $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, 1, 0] } 
                    }
                }
            }
        ]);
        
        const todayStats = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: today,
                        $lt: tomorrow
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    todayOrders: { $sum: 1 },
                    todayRevenue: { $sum: '$total' },
                    todayAverageOrderValue: { $avg: '$total' }
                }
            }
        ]);
        
        const popularItems = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);
        
        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    totalOrders: 0,
                    totalRevenue: 0,
                    averageOrderValue: 0,
                    pendingOrders: 0,
                    confirmedOrders: 0,
                    preparingOrders: 0,
                    readyOrders: 0,
                    servedOrders: 0,
                    cancelledOrders: 0,
                    paidOrders: 0,
                    unpaidOrders: 0
                },
                today: todayStats[0] || {
                    todayOrders: 0,
                    todayRevenue: 0,
                    todayAverageOrderValue: 0
                },
                popularItems
            }
        });
    } catch (error) {
        next(error);
    }
};