const mongoose = require('mongoose');

const activeCropSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cropName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        default: ''
    },
    plantDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    landSize: {
        type: Number,
        required: true
    },
    seedQuantity: {
        type: Number,
        default: 0
    },
    dailyExpenses: [{
        expense_type: String,
        amount: Number,
        notes: String,
        date: { type: Date, default: Date.now }
    }],
    stage: {
        type: String,
        default: 'growing'
    }
}, { timestamps: true, collection: 'crops_active' });

module.exports = mongoose.model('ActiveCrop', activeCropSchema);
