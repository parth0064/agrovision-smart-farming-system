const mongoose = require('mongoose');

const archivedCropSchema = new mongoose.Schema({
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
    totalExpense: {
        type: Number,
        required: true
    },
    totalRevenue: {
        type: Number,
        required: true
    },
    profit: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['profitable', 'failed'],
        required: true
    },
    stage: {
        type: String,
        default: 'completed'
    },
    sellDate: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { timestamps: true, collection: 'crops_archived' });

module.exports = mongoose.model('ArchivedCrop', archivedCropSchema);
