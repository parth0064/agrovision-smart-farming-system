const StorageInventory = require('../models/StorageInventory');
const CropPlan = require('../models/CropPlan');
const CropIncome = require('../models/CropIncome');
const ArchivedCrop = require('../models/ArchivedCrop.js');
const { appendRowToSheet } = require('../services/googleSheetsService.js');
const shelfLifeData = require('../data/cropShelfLife.json');
const { recalculateAnalytics } = require('./analyticsController');

// @desc    Add Storage Record
// @route   POST /api/storage/add
// @access  Private
exports.addStorage = async (req, res) => {
    try {
        const { crop_name, quantity, harvest_date, unit, price_per_kg, price_per_quintal, images, total_investment } = req.body;

        if (total_investment === undefined || total_investment === '') {
            return res.status(400).json({ message: 'Total Investment is required for accurate profit/loss tracking.' });
        }

        // 1. Find shelf life for the crop from dataset
        const cropInfo = shelfLifeData.find(c => c.crop.toLowerCase().trim() === crop_name.toLowerCase().trim());

        if (!cropInfo) {
            return res.status(400).json({ message: 'Crop not found in shelf life dataset' });
        }

        // 2. Try to find an active CropPlan for this user and crop to link them
        const activePlan = await CropPlan.findOne({ 
            user_id: req.user._id,
            crop_name: { $regex: new RegExp(`^${crop_name}$`, 'i') }
        }).sort({ createdAt: -1 });

        // 3. Save record in StorageInventory
        const newStorage = new StorageInventory({
            user_id: req.user._id,
            crop_name,
            crop_plan_id: activePlan ? activePlan._id : undefined,
            quantity,
            unit: unit || 'kg',
            price_per_kg: price_per_kg || 0,
            price_per_quintal: price_per_quintal || 0,
            harvest_date,
            shelf_life_days: cropInfo.shelf_life_days,
            images: Array.isArray(images) ? images : []
        });

        const savedStorage = await newStorage.save();

        // 4. Trigger analytics recalculation (to mark as 'Past' and update totals)
        recalculateAnalytics(savedStorage.crop_plan_id || savedStorage._id, req.user._id);

        res.status(201).json(savedStorage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Sell Crop from Storage
// @route   POST /api/storage/:id/sell
// @access  Private
exports.sellStorage = async (req, res) => {
    try {
        const { quantity, price, source, notes } = req.body;
        const sellQty = Number(quantity);
        const sellPrice = Number(price);

        const record = await StorageInventory.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Storage record not found' });
        }

        if (record.user_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (sellQty > record.quantity) {
            return res.status(400).json({ message: 'Cannot sell more than available quantity in storage.' });
        }

        // Auto-create a CropIncome ledger entry
        // We link it either to the crop_plan_id (if linked) or to the Storage record's own _id
        await CropIncome.create({
            crop_id: record.crop_plan_id || record._id,
            amount: sellPrice,
            source: source || 'Market',
            notes: notes || `Auto-entry: Sold ${sellQty} ${record.unit} of ${record.crop_name} from storage.`,
        });

        // Update remaining quantity
        record.quantity -= sellQty;

        // If completely sold out, we can choose to auto-delete or keep it at 0. Let's delete it to clean shelf-life view.
        if (record.quantity <= 0) {
            const cropIdForAnalytics = record.crop_plan_id || record._id;
            
            // Calculate Profit for Manual Storage Items to appear in Data Analyst dashboard
            // Note: The frontend explicitly sends 'price' as the "Total Sale Amount (₹)" for manual items
            const totalRevenue = sellPrice; 
            const totalExpense = record.total_investment || 0;
            const profit = totalRevenue - totalExpense;
            
            await ArchivedCrop.create({
                farmerId: record.user_id,
                cropName: record.crop_name,
                plantDate: record.harvest_date, // fallback if linked plan is unknown
                totalExpense: totalExpense,
                totalRevenue: totalRevenue,
                profit: profit,
                status: profit >= 0 ? 'profitable' : 'failed',
                stage: 'completed',
                sellDate: new Date()
            });

            await record.deleteOne();

            // Push to Google Sheets for automated analytics
            try {
                await appendRowToSheet([
                    new Date().toLocaleDateString(),
                    req.user?.name || 'Farmer', // Storage items might be sold via recurring tasks sometimes, but here it's interactive
                    record.crop_name,
                    totalExpense,
                    totalRevenue,
                    profit,
                    profit >= 0 ? 'profitable' : 'failed'
                ]);
            } catch (err) {
                console.error('Failed to push to Google Sheets:', err.message);
            }
            
            // Trigger analytics after sale
            recalculateAnalytics(cropIdForAnalytics, req.user._id);

            return res.json({ message: 'Crop sold completely and archived for analytics', isEmpty: true });
        } else {
            const updatedRecord = await record.save();

            // Trigger analytics after partial sale
            recalculateAnalytics(updatedRecord.crop_plan_id || updatedRecord._id, req.user._id);

            return res.json({ message: 'Sale recorded successfully', record: updatedRecord, isEmpty: false });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Farmer Storage
// @route   GET /api/storage/:userId
// @access  Private
exports.getStorage = async (req, res) => {
    try {
        const storageRecords = await StorageInventory.find({ user_id: req.params.userId });
        const today = new Date();

        const formattedRecords = storageRecords.map(record => {
            const harvestDate = new Date(record.harvest_date);
            const diffTime = today - harvestDate;
            const days_passed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const remaining_days = record.shelf_life_days - days_passed;

            let status = 'SAFE';
            if (remaining_days < 10) {
                status = 'CRITICAL';
            } else if (remaining_days <= 20) {
                status = 'WARNING';
            }

            return {
                _id: record._id,
                crop_name: record.crop_name,
                quantity: record.quantity,
                unit: record.unit,
                price_per_kg: record.price_per_kg,
                price_per_quintal: record.price_per_quintal,
                harvest_date: record.harvest_date,
                shelf_life_days: record.shelf_life_days,
                images: record.images,
                days_passed,
                remaining_days,
                status
            };
        });

        res.json(formattedRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Storage Record
// @route   DELETE /api/storage/:id
// @access  Private
exports.deleteStorage = async (req, res) => {
    try {
        const record = await StorageInventory.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Storage record not found' });
        }

        // Check if record belongs to user
        if (record.user_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await record.deleteOne();
        res.json({ message: 'Storage record removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Storage Record
// @route   PUT /api/storage/:id
// @access  Private
exports.updateStorage = async (req, res) => {
    try {
        const { quantity, unit, price_per_kg, price_per_quintal, harvest_date, images } = req.body;
        const record = await StorageInventory.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Storage record not found' });
        }

        // Check if record belongs to user
        if (record.user_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update fields if provided
        if (quantity !== undefined) record.quantity = quantity;
        if (unit !== undefined) record.unit = unit;
        if (price_per_kg !== undefined) record.price_per_kg = price_per_kg;
        if (price_per_quintal !== undefined) record.price_per_quintal = price_per_quintal;
        if (harvest_date !== undefined) record.harvest_date = harvest_date;
        if (images !== undefined && Array.isArray(images)) record.images = images;

        const updatedRecord = await record.save();
        res.json(updatedRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
