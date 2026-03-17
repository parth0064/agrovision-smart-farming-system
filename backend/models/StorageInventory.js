const mongoose = require('mongoose');

const storageInventorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    crop_name: {
        type: String,
        required: true
    },
    crop_plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CropPlan'
    },
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        enum: ['kg', 'Quintal'],
        default: 'kg',
        required: true
    },
    price_per_kg: {
        type: Number,
        default: 0
    },
    price_per_quintal: {
        type: Number,
        default: 0
    },
    harvest_date: {
        type: Date,
        required: true
    },
    total_investment: {
        type: Number,
        default: 0
    },
    shelf_life_days: {
        type: Number,
        required: true
    },
    images: {
        type: [String], // Array of image base64s or URLs
        default: []
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StorageInventory', storageInventorySchema);
