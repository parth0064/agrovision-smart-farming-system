const mongoose = require('mongoose');

const inventorySchema = mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        item_name: { type: String, required: true }, // e.g. "Wheat Seeds", "Urea Fertilizer"
        item_type: {
            type: String,
            required: true,
            enum: ['Seeds', 'Fertilizer', 'Pesticide', 'Equipment', 'Other']
        },
        quantity: { type: Number, required: true, default: 0 },
        unit: { type: String, required: true }, // e.g. "kg", "liters", "packets"
    },
    { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
