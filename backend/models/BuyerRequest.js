const mongoose = require('mongoose');

const buyerRequestSchema = new mongoose.Schema({
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cropId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StorageInventory',
        required: true
    },
    cropName: {
        type: String,
        required: true
    },
    quantityRequested: {
        type: Number,
        required: true
    },
    offeredPrice: {
        type: Number,
        required: true
    },
    counterPrice: {
        type: Number,
        default: null
    },
    message: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'countered'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('BuyerRequest', buyerRequestSchema);
