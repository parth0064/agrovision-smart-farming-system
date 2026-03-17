const mongoose = require('mongoose');

const cropPlanSchema = mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        crop_name: { type: String, required: true },
        location: { type: String, required: true },
        land_area: { type: Number, required: true },
        planting_date: { type: Date, required: true },
        seed_quantity: { type: Number, default: 0 }, // kg/units planted
        predicted_profit: { type: Number, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CropPlan', cropPlanSchema);
