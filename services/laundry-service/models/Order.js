const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true,
        index: true
    },
    customerName: {
        type: String,
        required: true
    },
    storeId: {
        type: String,
        required: true,
        index: true
    },
    storeName: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        enum: ['WASH', 'DRY', 'IRON', 'WASH_DRY', 'WASH_IRON', 'FULL_SERVICE'],
        required: true
    },
    weight: {
        type: Number,
        required: true,
        min: 0.1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['PENDING', 'WASHING', 'DRYING', 'IRONING', 'READY', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING',
        index: true
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id.toString();
            ret.createdAt = ret.createdAt.toISOString();
            ret.updatedAt = ret.updatedAt.toISOString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Static method to calculate price
orderSchema.statics.calculatePrice = function (serviceType, weight) {
    const PRICES = {
        WASH: 5000,
        DRY: 4000,
        IRON: 3000,
        WASH_DRY: 9000,
        WASH_IRON: 8000,
        FULL_SERVICE: 12000
    };

    return (PRICES[serviceType] || 5000) * weight;
};

// Create indexes
orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
