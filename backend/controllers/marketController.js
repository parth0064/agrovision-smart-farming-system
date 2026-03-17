const MarketListing = require('../models/MarketListing.js');
const MarketPrice = require('../models/MarketPrice.js');

// @desc    Create a new market listing
// @route   POST /api/market/list
// @access  Private
const createListing = async (req, res) => {
    const { crop_name, quantity, price_per_quintal, location, contact, farmer_id } = req.body;

    try {
        const listing = await MarketListing.create({
            farmer_id: farmer_id || (req.user ? req.user._id : null),
            crop_name,
            quantity,
            price_per_quintal,
            location,
            contact
        });

        res.status(201).json(listing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get market listings
// @route   GET /api/market/listings
// @access  Public
const getListings = async (req, res) => {
    const { crop, location } = req.query;

    let query = {};
    if (crop) query.crop_name = { $regex: crop, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };

    try {
        const listings = await MarketListing.find(query).populate('farmer_id', 'name email');
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get market prices
// @route   GET /api/market/prices
// @access  Public
const getPrices = async (req, res) => {
    try {
        const prices = await MarketPrice.find({});
        res.json(prices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createListing, getListings, getPrices };
