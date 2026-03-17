const mongoose = require('mongoose');

const cropExpenseSchema = mongoose.Schema(
    {
        crop_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'CropPlan' },
        expense_type: {
            type: String,
            required: true,
            enum: ['Seeds', 'Fertilizer', 'Labor', 'Transport', 'Equipment', 'Other']
        },
        amount: { type: Number, required: true },
        notes: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CropExpense', cropExpenseSchema);
