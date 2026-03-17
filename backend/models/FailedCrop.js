const mongoose = require('mongoose');

const failedCropSchema = new mongoose.Schema(
    {
        failureId: {
            type: String,
            required: true,
            unique: true,
            default: () => new mongoose.Types.ObjectId().toString(),
        },
        cropId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'CropPlan',
            index: true,
        },
        farmerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        cropName: { type: String, required: true },
        totalExpense: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        profit: { type: Number, default: 0 },
        isCurrent: { type: Boolean, default: true },
        failureReason: {
            type: String,
            required: true,
            enum: ['Pest Attack', 'Flood', 'Disease', 'Storage Spoilage', 'Low Market Price'],
            default: 'Pest Attack'
        },
        dateDetected: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('FailedCrop', failedCropSchema);
