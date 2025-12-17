const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    storeName: {
        type: String,
        required: true
    },
    serviceLabel: {
        type: String
    },
    weight: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['BANK_TRANSFER', 'E_WALLET', 'CASH', 'CREDIT_CARD'],
        default: 'BANK_TRANSFER'
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED'],
        default: 'PENDING'
    },
    invoiceNumber: {
        type: String,
        unique: true
    },
    paidAt: {
        type: Date
    },
    refundedAt: {
        type: Date
    },
    refundReason: {
        type: String
    }
}, {
    timestamps: true
});

// Generate invoice number before save
paymentSchema.pre('save', function (next) {
    if (!this.invoiceNumber) {
        const date = new Date();
        const prefix = 'INV';
        const timestamp = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.invoiceNumber = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);
