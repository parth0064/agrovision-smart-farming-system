const mongoose = require('mongoose');

const marketPriceSchema = mongoose.Schema(
    {
        crop: { type: String, required: true },
        mandi: { type: String, required: true },
        price: { type: Number, required: true },
        date: { type: Date, required: true, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
