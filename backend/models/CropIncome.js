const mongoose = require('mongoose');

const cropIncomeSchema = mongoose.Schema(
    {
        crop_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'CropPlan' },
        amount: { type: Number, required: true },
        source: { type: String, required: true }, // e.g., 'Sold to Market', 'Mandi', 'Direct Buyer'
        notes: { type: String },
        createdAt: { type: Date, default: Date.now } // Automatically tracks date & time
    },
    { timestamps: { createdAt: false, updatedAt: true } }
);

module.exports = mongoose.model('CropIncome', cropIncomeSchema);
