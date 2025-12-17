const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
    storeId: {
        type: String,
        required: true
    },
    storeName: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        required: true
    },
    serviceLabel: {
        type: String
    },
    weight: {
        type: Number,
        required: true,
        min: 1
    },
    pricePerKg: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    checkInDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Virtual for formatted dates
bookingSchema.virtual('formattedCheckIn').get(function () {
    return this.checkInDate.toISOString().split('T')[0];
});

module.exports = mongoose.model('Booking', bookingSchema);
