const mongoose = require('mongoose');

const marketListingSchema = mongoose.Schema(
    {
        farmer_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        crop_name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price_per_quintal: { type: Number, required: true },
        location: { type: String, required: true },
        contact: { type: String, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('MarketListing', marketListingSchema);
