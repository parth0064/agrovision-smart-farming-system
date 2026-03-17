const CropPlan = require('../models/CropPlan.js');
const CropExpense = require('../models/CropExpense.js');
const cropsData = require('../data/crops.json');
const { getWeather } = require('../utils/weatherService.js');
const { recalculateAnalytics } = require('./analyticsController.js');

// @desc    Get weather data for a location
// @route   GET /api/crop/weather
// @access  Private
const getWeatherData = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const weather = await getWeather(Number(lat), Number(lng));

        if (!weather) {
            return res.status(503).json({ message: 'Weather service unavailable. Please check your API key.' });
        }

        res.json(weather);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Calculate climate suitability score for a crop
const getClimateScore = (crop, temperature, humidity) => {
    let score = 0;

    // Temperature suitability (0-15 points)
    if (temperature >= crop.ideal_temp_min && temperature <= crop.ideal_temp_max) {
        score += 15; // Perfect range
    } else {
        const tempDiff = temperature < crop.ideal_temp_min
            ? crop.ideal_temp_min - temperature
            : temperature - crop.ideal_temp_max;
        // Partial credit: lose 3 points per degree outside range, min 0
        score += Math.max(0, 15 - tempDiff * 3);
    }

    // Humidity suitability (0-15 points)
    if (humidity >= crop.ideal_humidity_min && humidity <= crop.ideal_humidity_max) {
        score += 15; // Perfect range
    } else {
        const humDiff = humidity < crop.ideal_humidity_min
            ? crop.ideal_humidity_min - humidity
            : humidity - crop.ideal_humidity_max;
        score += Math.max(0, 15 - humDiff * 1.5);
    }

    return Math.round(score);
};

// @desc    Predict recommended crops
// @route   POST /api/crop/predict
// @access  Private 
const predictCrop = async (req, res) => {
    const { land_area, budget, location, season, previous_crop, latitude, longitude } = req.body;

    try {
        // Fetch weather data if coordinates are provided
        let weatherData = null;
        if (latitude && longitude) {
            weatherData = await getWeather(Number(latitude), Number(longitude));
        }

        let scoredCrops = cropsData.map(crop => {
            let score = 0;
            const areaNum = Number(land_area);
            const budgetNum = Number(budget);

            // 1. Season Match (+30)
            if (crop.season.toLowerCase() === season.toLowerCase() || crop.season.toLowerCase() === 'annual') {
                score += 30;
            }

            // 2. Budget Compatibility (+15)
            const requiredBudget = crop.budget_min * areaNum;
            if (budgetNum >= requiredBudget) {
                score += 15;
            }

            // 3. Climate Suitability (+30) — based on real weather data
            if (weatherData) {
                score += getClimateScore(crop, weatherData.temperature, weatherData.humidity);
            } else {
                // No weather data available — give neutral score
                score += 15;
            }

            // 4. Location Suitability (+10)
            if (location && location.trim().length > 0) {
                score += 10;
            }

            // 5. Crop Rotation Benefit (+15)
            if (previous_crop && previous_crop.toLowerCase() !== crop.crop.toLowerCase()) {
                score += 15;
            }

            // Calculate profit
            const estimatedProfit = (crop.avg_yield * areaNum * crop.avg_price) - (crop.budget_min * areaNum);

            return {
                ...crop,
                score,
                estimatedProfit
            };
        });

        // Sort by score descending
        scoredCrops.sort((a, b) => b.score - a.score);

        // Find best match for "low" risk
        const lowRiskCrops = scoredCrops.filter(c => c.risk === 'low');
        const bestLowRisk = lowRiskCrops.length > 0 ? lowRiskCrops[0] : scoredCrops[0];

        // Find best match for "high" profit
        scoredCrops.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
        const bestHighProfit = scoredCrops[0];

        // Prevent returning exactly the same crop if possible
        const finalHighProfit = bestHighProfit.crop === bestLowRisk.crop && scoredCrops.length > 1
            ? scoredCrops[1]
            : bestHighProfit;

        res.json({
            lowRiskCrop: bestLowRisk.crop,
            highProfitCrop: finalHighProfit.crop,
            estimatedProfitLow: bestLowRisk.estimatedProfit > 0 ? bestLowRisk.estimatedProfit : 0,
            estimatedProfitHigh: finalHighProfit.estimatedProfit > 0 ? finalHighProfit.estimatedProfit : 0,
            bestLowRiskData: bestLowRisk,
            bestHighProfitData: finalHighProfit,
            weatherData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Select / Manually Add Crop
// @route   POST /api/crop
// @access  Private
const addCrop = async (req, res) => {
    try {
        const { crop_name, location, land_area, planting_date, predicted_profit, seed_quantity } = req.body;

        const cropPlan = await CropPlan.create({
            user_id: req.user._id, // Assume auth middleware sets this
            crop_name,
            location,
            land_area: Number(land_area),
            planting_date: new Date(planting_date),
            predicted_profit: Number(predicted_profit),
            seed_quantity: seed_quantity ? Number(seed_quantity) : 0
        });

        // ---------------------------------------------------------
        // AUTOMATED INVENTORY & EXPENSE LINKING
        // ---------------------------------------------------------
        if (seed_quantity && Number(seed_quantity) > 0) {
            const Inventory = require('../models/Inventory.js');
            const qty = Number(seed_quantity);

            // 1. Check if user already has an inventory entry for this seed
            let item = await Inventory.findOne({
                user_id: req.user._id,
                item_name: `${crop_name} Seeds`,
                item_type: 'Seeds'
            });

            if (item) {
                // Deduct from existing inventory
                item.quantity -= qty;
                await item.save();
            } else {
                // Create a negative entry to show deficit/usage if they didn't stock up first
                item = await Inventory.create({
                    user_id: req.user._id,
                    item_name: `${crop_name} Seeds`,
                    item_type: 'Seeds',
                    quantity: -qty,
                    unit: 'kg' // Assume kg for now
                });
            }

            // 2. Automatically log an expense for the seeds used 
            // We assume a base cost of ₹50 per kg of seed for automation if cost isn't provided here
            await CropExpense.create({
                crop_id: cropPlan._id,
                expense_type: 'Seeds',
                amount: qty * 50,
                notes: `Automated entry: Planted ${qty} kg of ${crop_name} seeds.`,
                createdAt: new Date(planting_date)
            });

            // Trigger analytics after automated expense
            recalculateAnalytics(cropPlan._id, req.user._id);
        }

        res.status(201).json(cropPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Active Crops
// @route   GET /api/crop
// @access  Private
const getActiveCrops = async (req, res) => {
    try {
        const crops = await CropPlan.find({ user_id: req.user._id }).sort({ createdAt: -1 }).lean();

        // Get total expenses for each crop
        const activeCrops = await Promise.all(crops.map(async (crop) => {
            const expenses = await CropExpense.find({ crop_id: crop._id });
            const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            return {
                ...crop,
                totalExpenses,
                current_profit: crop.predicted_profit - totalExpenses
            };
        }));

        // Include standalone StorageInventory items
        const StorageInventory = require('../models/StorageInventory.js');
        const storageItems = await StorageInventory.find({ 
            user_id: req.user._id, 
            crop_plan_id: { $exists: false } 
        }).lean();

        const activeStorageItems = await Promise.all(storageItems.map(async (storage) => {
            const expenses = await CropExpense.find({ crop_id: storage._id });
            const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            return {
                _id: storage._id,
                crop_name: `${storage.crop_name} (Shelf Life Monitoring)`,
                location: 'Storage',
                land_area: storage.quantity,
                unit: storage.unit || 'kg',
                isStorage: true,
                planting_date: storage.harvest_date,
                predicted_profit: 0,
                totalExpenses,
                current_profit: 0 - totalExpenses
            };
        }));

        // ─────────────────────────────────────────────
        // NEW LIFECYCLE BRIDGE
        // ─────────────────────────────────────────────
        const ActiveCrop = require('../models/ActiveCrop');
        const ShelfMonitoring = require('../models/ShelfMonitoring');

        // Fetch growing lifecycle crops
        const growingCrops = await ActiveCrop.find({ farmerId: req.user._id }).lean();
        const activeLifecycleItems = growingCrops.map(c => ({
            _id: c._id,
            crop_name: `[Growing] ${c.cropName}`,
            location: c.location || 'Field',
            land_area: c.landSize,
            isLifecycle: true,
            isGrowing: true,
            planting_date: c.plantDate,
            totalExpenses: (c.dailyExpenses || []).reduce((sum, exp) => sum + exp.amount, 0)
        }));

        // Fetch selling lifecycle crops
        const shelfCrops = await ShelfMonitoring.find({ farmerId: req.user._id }).lean();
        const shelfLifecycleItems = shelfCrops.map(c => ({
            _id: c._id,
            crop_name: `[Selling] ${c.cropName}`,
            location: 'Storage',
            land_area: c.quantity,
            unit: c.unit || 'kg',
            isLifecycle: true,
            isSelling: true,
            planting_date: c.plantDate,
            totalExpenses: c.totalExpense || 0
        }));

        const allItems = [
            ...activeCrops, 
            ...activeStorageItems,
            ...activeLifecycleItems,
            ...shelfLifecycleItems
        ].sort((a, b) => new Date(b.createdAt || b.planting_date || 0) - new Date(a.createdAt || a.planting_date || 0));

        res.json(allItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Crop
// @route   DELETE /api/crop/:id
// @access  Private
const deleteCrop = async (req, res) => {
    try {
        let crop = await CropPlan.findOne({ _id: req.params.id, user_id: req.user._id });

        if (!crop) {
            const StorageInventory = require('../models/StorageInventory.js');
            crop = await StorageInventory.findOne({ _id: req.params.id, user_id: req.user._id });
            if (!crop) {
                return res.status(404).json({ message: 'Crop not found' });
            }
            // For storage inventory, we just delete expenses/income, not the item itself
            // as they may want to keep the inventory. Let's not delete the inventory here.
            await CropExpense.deleteMany({ crop_id: crop._id });
            const CropIncome = require('../models/CropIncome.js');
            await CropIncome.deleteMany({ crop_id: crop._id });
            return res.json({ message: 'Storage item expenses removed' });
        }

        await CropExpense.deleteMany({ crop_id: crop._id });
        const CropIncome = require('../models/CropIncome.js');
        await CropIncome.deleteMany({ crop_id: crop._id });
        await CropPlan.deleteOne({ _id: crop._id });

        res.json({ message: 'Crop plan and all associated expenses removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Crop Expense
// @route   POST /api/crop/:id/expense
// @access  Private
const addExpense = async (req, res) => {
    try {
        const { expense_type, amount, notes, date } = req.body;
        const amountNum = Number(amount);

        // 1. Try to find in CropPlan
        let crop = await CropPlan.findOne({ _id: req.params.id, user_id: req.user._id });
        if (crop) {
            const expense = await CropExpense.create({
                crop_id: crop._id,
                expense_type,
                amount: amountNum,
                notes,
                createdAt: date ? new Date(date) : new Date()
            });
            recalculateAnalytics(crop._id, req.user._id);
            return res.status(201).json(expense);
        }

        // 2. Try StorageInventory
        const StorageInventory = require('../models/StorageInventory.js');
        let storage = await StorageInventory.findOne({ _id: req.params.id, user_id: req.user._id });
        if (storage) {
            const expense = await CropExpense.create({
                crop_id: storage._id,
                expense_type,
                amount: amountNum,
                notes,
                createdAt: date ? new Date(date) : new Date()
            });
            recalculateAnalytics(storage._id, req.user._id);
            return res.status(201).json(expense);
        }

        // 3. Lifecycle Bridge: ActiveCrop
        const ActiveCrop = require('../models/ActiveCrop');
        let activeCrop = await ActiveCrop.findOne({ _id: req.params.id, farmerId: req.user._id });
        if (activeCrop) {
            activeCrop.dailyExpenses.push({
                expense_type,
                amount: amountNum,
                notes: notes || '',
                date: date ? new Date(date) : new Date()
            });
            await activeCrop.save();
            return res.status(201).json({ message: 'Expense added to growing crop' });
        }

        // 4. Lifecycle Bridge: ShelfMonitoring
        const ShelfMonitoring = require('../models/ShelfMonitoring');
        let shelfCrop = await ShelfMonitoring.findOne({ _id: req.params.id, farmerId: req.user._id });
        if (shelfCrop) {
            shelfCrop.totalExpense = (shelfCrop.totalExpense || 0) + amountNum;
            await shelfCrop.save();
            return res.status(201).json({ message: 'Expense added to selling crop' });
        }

        return res.status(404).json({ message: 'Crop not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Crop Expenses
// @route   GET /api/crop/:id/expense
// @access  Private
const getExpenses = async (req, res) => {
    try {
        let crop = await CropPlan.findOne({ _id: req.params.id, user_id: req.user._id });

        if (!crop) {
            const StorageInventory = require('../models/StorageInventory.js');
            crop = await StorageInventory.findOne({ _id: req.params.id, user_id: req.user._id });
            if (!crop) return res.status(404).json({ message: 'Crop not found' });
        }

        const expenses = await CropExpense.find({ crop_id: crop._id }).sort({ createdAt: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Crop Income / Profit
// @route   POST /api/crop/:id/income
// @access  Private
const addIncome = async (req, res) => {
    try {
        const { amount, source, notes, date } = req.body;
        const amountNum = Number(amount);
        const CropIncome = require('../models/CropIncome.js');

        // 1. Try CropPlan
        let crop = await CropPlan.findOne({ _id: req.params.id, user_id: req.user._id });
        if (crop) {
            const income = await CropIncome.create({
                crop_id: crop._id,
                amount: amountNum,
                source: source || 'Market',
                notes,
                createdAt: date ? new Date(date) : new Date()
            });
            recalculateAnalytics(crop._id, req.user._id);
            return res.status(201).json(income);
        }

        // 2. Try StorageInventory
        const StorageInventory = require('../models/StorageInventory.js');
        let storage = await StorageInventory.findOne({ _id: req.params.id, user_id: req.user._id });
        if (storage) {
            const income = await CropIncome.create({
                crop_id: storage._id,
                amount: amountNum,
                source: source || 'Market',
                notes,
                createdAt: date ? new Date(date) : new Date()
            });
            recalculateAnalytics(storage._id, req.user._id);
            return res.status(201).json(income);
        }

        // 3. Lifecycle Bridge: ShelfMonitoring
        const ShelfMonitoring = require('../models/ShelfMonitoring');
        let shelfCrop = await ShelfMonitoring.findOne({ _id: req.params.id, farmerId: req.user._id });
        if (shelfCrop) {
            shelfCrop.totalRevenue = (shelfCrop.totalRevenue || 0) + amountNum;
            await shelfCrop.save();
            return res.status(201).json({ message: 'Income recorded for selling crop' });
        }

        return res.status(404).json({ message: 'Crop not found for income recording' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Crop Income / Profit
// @route   GET /api/crop/:id/income
// @access  Private
const getIncome = async (req, res) => {
    try {
        let crop = await CropPlan.findOne({ _id: req.params.id, user_id: req.user._id });

        if (!crop) {
            const StorageInventory = require('../models/StorageInventory.js');
            crop = await StorageInventory.findOne({ _id: req.params.id, user_id: req.user._id });
            if (!crop) return res.status(404).json({ message: 'Crop not found' });
        }

        const CropIncome = require('../models/CropIncome.js');
        const income = await CropIncome.find({ crop_id: crop._id }).sort({ createdAt: -1 });

        res.json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    predictCrop,
    getWeatherData,
    addCrop,
    getActiveCrops,
    deleteCrop,
    addExpense,
    getExpenses,
    addIncome,
    getIncome
};
