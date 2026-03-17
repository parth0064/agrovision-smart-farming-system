const mongoose = require('mongoose');

const cropAnalyticsSchema = new mongoose.Schema(
    {
        crop_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true,
        },
        farmer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        crop_name: { type: String, required: true },
        total_expense: { type: Number, default: 0 },
        total_revenue: { type: Number, default: 0 },
        profit: { type: Number, default: 0 },
        is_current: { type: Boolean, default: true },
        last_updated: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

module.exports = mongoose.model('CropAnalytics', cropAnalyticsSchema);
