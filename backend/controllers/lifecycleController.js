const ActiveCrop = require('../models/ActiveCrop');
const ShelfMonitoring = require('../models/ShelfMonitoring');
const ArchivedCrop = require('../models/ArchivedCrop.js');
const { appendRowToSheet } = require('../services/googleSheetsService.js');

// ─────────────────────────────────────────────
// ACTIVE CROPS (Growing Stage)
// ─────────────────────────────────────────────

// @desc    Get all active growing crops for the logged-in farmer
// @route   GET /api/lifecycle/active
const getActiveCrops = async (req, res) => {
    try {
        const crops = await ActiveCrop.find({ farmerId: req.user._id }).sort({ createdAt: -1 }).lean();

        // Compute totalExpense for each crop
        const result = crops.map(crop => {
            const totalExpense = (crop.dailyExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
            return { ...crop, totalExpense };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new growing crop
// @route   POST /api/lifecycle/active
const addActiveCrop = async (req, res) => {
    try {
        const { cropName, plantDate, landSize, location, seedQuantity } = req.body;
        const crop = await ActiveCrop.create({
            farmerId: req.user._id,
            cropName,
            plantDate: plantDate ? new Date(plantDate) : new Date(),
            landSize: Number(landSize) || 1,
            location: location || '',
            seedQuantity: seedQuantity ? Number(seedQuantity) : 0,
            stage: 'growing'
        });
        res.status(201).json(crop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an active crop
// @route   DELETE /api/lifecycle/active/:id
const deleteActiveCrop = async (req, res) => {
    try {
        const crop = await ActiveCrop.findOne({ _id: req.params.id, farmerId: req.user._id });
        if (!crop) return res.status(404).json({ message: 'Crop not found' });
        await ActiveCrop.deleteOne({ _id: crop._id });
        res.json({ message: 'Crop deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add expense to active crop
// @route   POST /api/lifecycle/active/:id/expense
const addExpense = async (req, res) => {
    try {
        const { expense_type, amount, notes, date } = req.body;
        const crop = await ActiveCrop.findOne({ _id: req.params.id, farmerId: req.user._id });
        if (!crop) return res.status(404).json({ message: 'Crop not found' });

        crop.dailyExpenses.push({
            expense_type,
            amount: Number(amount),
            notes: notes || '',
            date: date ? new Date(date) : new Date()
        });
        await crop.save();

        // Return the updated crop with totalExpense calculated
        const totalExpense = crop.dailyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        res.status(201).json({ ...crop.toObject(), totalExpense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get expenses for an active crop
// @route   GET /api/lifecycle/active/:id/expenses
const getExpenses = async (req, res) => {
    try {
        const crop = await ActiveCrop.findOne({ _id: req.params.id, farmerId: req.user._id }).lean();
        if (!crop) return res.status(404).json({ message: 'Crop not found' });
        res.json(crop.dailyExpenses || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// TRANSFER: Active → Shelf Monitoring
// ─────────────────────────────────────────────

// Shelf life dataset (days)
const SHELF_LIFE_MAP = {
    wheat: 90, rice: 180, maize: 120, soybean: 150, potato: 30,
    onion: 60, tomato: 10, cotton: 365, sugarcane: 14, mustard: 90,
    barley: 120, millet: 180, groundnut: 120, sunflower: 90,
    lentil: 180, chickpea: 180, pea: 7, carrot: 21, cabbage: 14,
    cauliflower: 14, brinjal: 7, chilli: 10, garlic: 90, ginger: 30
};

const getShelfLifeDays = (cropName) => {
    const key = (cropName || '').toLowerCase().trim();
    return SHELF_LIFE_MAP[key] || 30; // default 30 days
};

// @desc    Transfer active crop to shelf monitoring
// @route   POST /api/lifecycle/active/:id/transfer
const transferToShelf = async (req, res) => {
    try {
        const { quantity, unit, pricePerKg, pricePerQuintal, images } = req.body;
        const activeCrop = await ActiveCrop.findOne({ _id: req.params.id, farmerId: req.user._id });
        if (!activeCrop) return res.status(404).json({ message: 'Active crop not found' });

        const totalExpense = activeCrop.dailyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const shelfLifeDays = getShelfLifeDays(activeCrop.cropName);

        const shelfRecord = await ShelfMonitoring.create({
            farmerId: activeCrop.farmerId,
            cropName: activeCrop.cropName,
            plantDate: activeCrop.plantDate,
            harvestDate: new Date(),
            quantity: Number(quantity) || 0,
            unit: unit || 'kg',
            pricePerKg: Number(pricePerKg) || 0,
            pricePerQuintal: Number(pricePerQuintal) || 0,
            images: images || [],
            shelfLifeDays: shelfLifeDays,
            totalExpense: totalExpense,
            stage: 'shelf_monitoring'
        });

        // Remove from active crops
        await ActiveCrop.deleteOne({ _id: activeCrop._id });

        res.status(201).json(shelfRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// SHELF MONITORING (Selling Stage)
// ─────────────────────────────────────────────

// @desc    Get crops in shelf monitoring
// @route   GET /api/lifecycle/shelf
const getShelfCrops = async (req, res) => {
    try {
        const crops = await ShelfMonitoring.find({ farmerId: req.user._id }).sort({ createdAt: -1 }).lean();
        res.json(crops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Complete selling and archive crop
// @route   POST /api/lifecycle/shelf/:id/complete
const completeSelling = async (req, res) => {
    try {
        const { quantity, sellingPrice, sellDate, notes } = req.body;
        const shelfCrop = await ShelfMonitoring.findOne({ _id: req.params.id, farmerId: req.user._id });
        if (!shelfCrop) return res.status(404).json({ message: 'Shelf record not found' });

        const qty = Number(quantity);
        const price = Number(sellingPrice);
        const totalRevenue = qty * price;
        const profit = totalRevenue - shelfCrop.totalExpense;
        const status = profit >= 0 ? 'profitable' : 'failed';

        // Archive the crop
        const archivedRecord = await ArchivedCrop.create({
            farmerId: shelfCrop.farmerId,
            cropName: shelfCrop.cropName,
            plantDate: shelfCrop.plantDate,
            totalExpense: shelfCrop.totalExpense,
            totalRevenue: totalRevenue,
            profit: profit,
            status: status,
            stage: 'completed',
            sellDate: sellDate ? new Date(sellDate) : new Date()
        });

        // Remove from shelf monitoring
        await ShelfMonitoring.deleteOne({ _id: shelfCrop._id });

        // Push to Google Sheets for automated analytics
        try {
            await appendRowToSheet([
                new Date().toLocaleDateString(),
                req.user.name || 'Farmer',
                archivedRecord.cropName,
                archivedRecord.totalExpense,
                archivedRecord.totalRevenue,
                archivedRecord.profit,
                archivedRecord.status
            ]);
        } catch (err) {
            console.error('Failed to push to Google Sheets:', err.message);
        }

        res.status(201).json(archivedRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// ARCHIVED CROPS (Completed Stage)
// ─────────────────────────────────────────────

// @desc    Get all archived/completed crops
// @route   GET /api/lifecycle/archived
const getArchivedCrops = async (req, res) => {
    try {
        const crops = await ArchivedCrop.find({ farmerId: req.user._id }).sort({ sellDate: -1 }).lean();
        res.json(crops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getActiveCrops,
    addActiveCrop,
    deleteActiveCrop,
    addExpense,
    getExpenses,
    transferToShelf,
    getShelfCrops,
    completeSelling,
    getArchivedCrops
};
