const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    ownerId: {
        type: String,
        required: true,
        index: true
    },
    images: [{
        type: String // URLs
    }],
    rating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    services: [{
        type: {
            type: String,
            enum: ['WASH', 'DRY', 'IRON', 'WASH_DRY', 'WASH_IRON', 'FULL_SERVICE'],
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        label: String
    }]
}, {
    timestamps: true
});

const Store = mongoose.model('Store', storeSchema);
module.exports = Store;
