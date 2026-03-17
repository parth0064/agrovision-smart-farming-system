const GovernmentScheme = require('../models/GovernmentScheme.js');
const schemesDataset = require('../data/government_schemes.json');


// @desc    Search for government schemes (Legacy MongoDB search)
// @route   POST /api/schemes/search
// @access  Public
const searchSchemes = async (req, res) => {
    const { state, crop, loss_type } = req.body;

    let query = {};

    if (state) query.state = { $regex: state, $options: 'i' };
    if (loss_type) query.loss_types = { $regex: loss_type, $options: 'i' };

    try {
        const schemes = await GovernmentScheme.find(query);
        res.json(schemes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a government scheme (Optional admin tool)
// @route   POST /api/schemes
// @access  Public/Admin
const addScheme = async (req, res) => {
    try {
        const scheme = await GovernmentScheme.create(req.body);
        res.status(201).json(scheme);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Find schemes from JSON dataset with advanced filtering
// @route   POST /api/schemes/find
// @access  Public
const findSchemes = async (req, res) => {
    try {
        const { state, district, crop, loss_type } = req.body;

        const results = schemesDataset.filter(s => {
            const matchState = s.state.toLowerCase() === "all" || (state && s.state.toLowerCase() === state.toLowerCase());
            const matchDistrict = s.district.toLowerCase() === "all" || (district && s.district.toLowerCase() === district.toLowerCase());
            const matchCrop = s.crop.toLowerCase() === "all" || (crop && s.crop.toLowerCase() === crop.toLowerCase());
            const matchLoss = s.loss_type.toLowerCase() === "all" || (loss_type && s.loss_type.toLowerCase() === loss_type.toLowerCase());

            return matchState && matchDistrict && matchCrop && matchLoss;
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Failed to filter schemes" });
    }
};

module.exports = { searchSchemes, addScheme, findSchemes };
