const mongoose = require('mongoose');

const shelfMonitoringSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cropName: {
        type: String,
        required: true
    },
    plantDate: {
        type: Date
    },
    harvestDate: {
        type: Date,
        default: Date.now
    },
    // Harvest details — entered during transfer
    quantity: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        default: 'kg'
    },
    pricePerKg: {
        type: Number,
        default: 0
    },
    pricePerQuintal: {
        type: Number,
        default: 0
    },
    images: [{
        type: String
    }],
    // Shelf life tracking
    shelfLifeDays: {
        type: Number,
        default: 30
    },
    // Financials
    totalExpense: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    stage: {
        type: String,
        default: 'shelf_monitoring'
    }
}, { timestamps: true, collection: 'crops_shelf_monitoring' });

module.exports = mongoose.model('ShelfMonitoring', shelfMonitoringSchema);
