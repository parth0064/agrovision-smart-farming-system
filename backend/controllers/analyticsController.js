const CropAnalytics = require('../models/CropAnalytics.js');
const CropExpense = require('../models/CropExpense.js');
const CropIncome = require('../models/CropIncome.js');
const CropPlan = require('../models/CropPlan.js');
const FailedCrop = require('../models/FailedCrop.js');
const ArchivedCrop = require('../models/ArchivedCrop.js');
const { updateSheetWithAllData } = require('../services/googleSheetsService.js');

// ─────────────────────────────────────────────
// HELPER  — recalculate & upsert one crop's analytics
// Called internally after any expense / income mutation
// ─────────────────────────────────────────────
const recalculateAnalytics = async (cropId, userId) => {
    try {
        // 1. Look up crop name (from CropPlan or StorageInventory)
        let cropName = 'Unknown Crop';
        let isCurrent = true;
        const cropPlan = await CropPlan.findById(cropId).lean();
        if (cropPlan) {
            cropName = cropPlan.crop_name;
            isCurrent = true;
        } else {
            const StorageInventory = require('../models/StorageInventory.js');
            // Try matching either the plan_id (if cropId is a plan) or the storage _id itself
            const storage = await StorageInventory.findOne({ 
                $or: [{ crop_plan_id: cropId }, { _id: cropId }] 
            }).lean();
            if (storage) {
                cropName = storage.crop_name;
                isCurrent = false;
            }
        }

        // 2. Sum all expenses for this crop
        const expenses = await CropExpense.find({ crop_id: cropId });
        const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // 3. Sum all income for this crop
        const incomeRecords = await CropIncome.find({ crop_id: cropId });
        const totalRevenue = incomeRecords.reduce((sum, i) => sum + (i.amount || 0), 0);

        // 4. Compute profit
        const profit = totalRevenue - totalExpense;

        // 5. Upsert analytics document
        await CropAnalytics.findOneAndUpdate(
            { crop_id: cropId },
            {
                crop_id: cropId,
                farmer_id: userId,
                crop_name: cropName,
                total_expense: totalExpense,
                total_revenue: totalRevenue,
                profit,
                is_current: isCurrent,
                last_updated: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 6. Handle Failed Crops (profit < 0)
        if (profit < 0) {
            // Determine failure reason
            const allNotes = [...expenses, ...incomeRecords].map(r => r.notes || '').join(' ').toLowerCase();
            let reason = 'Pest Attack'; // Default

            if (allNotes.includes('flood') || allNotes.includes('rain')) reason = 'Flood';
            else if (allNotes.includes('pest') || allNotes.includes('insect')) reason = 'Pest Attack';
            else if (allNotes.includes('disease') || allNotes.includes('fungus')) reason = 'Disease';
            else if (allNotes.includes('spoil') || allNotes.includes('shelf')) reason = 'Storage Spoilage';
            else if (allNotes.includes('price') || allNotes.includes('market')) reason = 'Low Market Price';

            await FailedCrop.findOneAndUpdate(
                { cropId: cropId },
                {
                    cropId,
                    farmerId: userId,
                    cropName,
                    totalExpense,
                    totalRevenue,
                    profit,
                    isCurrent,
                    failureReason: reason,
                    dateDetected: new Date()
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } else {
            // If profit is no longer negative, remove from failed crops
            await FailedCrop.deleteOne({ cropId });
        }

    } catch (err) {
        // Non-blocking: log but don't crash the primary request
        console.error('[Analytics] recalculateAnalytics failed:', err.message);
    }
};

// ─────────────────────────────────────────────
// GET /api/analytics/profitable-crops
// Returns profitability data for the authenticated farmer
// ─────────────────────────────────────────────
const getProfitableCrops = async (req, res) => {
    try {
        const analytics = await CropAnalytics.find({ 
            farmer_id: req.user._id,
            profit: { $gte: 0 }
        })
            .sort({ profit: -1 })
            .lean();

        const result = analytics.map((a) => ({
            cropName: a.crop_name,
            totalExpense: a.total_expense,
            totalRevenue: a.total_revenue,
            profit: a.profit,
            isCurrent: a.is_current,
            lastUpdated: a.last_updated,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/analytics/export
// Streams CSV for Power BI / Excel import
// ─────────────────────────────────────────────
const exportAnalyticsCSV = async (req, res) => {
    try {
        const analytics = await CropAnalytics.find({ 
            farmer_id: req.user._id,
            profit: { $gte: 0 }
        })
            .sort({ profit: -1 })
            .lean();

        const rows = ['crop_name,total_expense,total_revenue,profit'];
        analytics.forEach((a) => {
            // Escape crop names that may contain commas
            const name = `"${String(a.crop_name).replace(/"/g, '""')}"`;
            rows.push(`${name},${a.total_expense},${a.total_revenue},${a.profit}`);
        });

        const csv = rows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="agrovision_analytics.csv"');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/analytics/failed-crops
// Returns failed crops data for the authenticated farmer
// ─────────────────────────────────────────────
const getFailedCrops = async (req, res) => {
    try {
        const failedCrops = await FailedCrop.find({ farmerId: req.user._id })
            .sort({ profit: 1 }) // Most loss first
            .lean();

        const result = failedCrops.map((f) => ({
            cropName: f.cropName,
            totalExpense: f.totalExpense,
            totalRevenue: f.totalRevenue,
            profit: f.profit,
            isCurrent: f.isCurrent,
            failureReason: f.failureReason,
            dateDetected: f.dateDetected,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/analytics/failed-crops/export
// Streams CSV for failed crops
// ─────────────────────────────────────────────
const exportFailedCropsCSV = async (req, res) => {
    try {
        const failedCrops = await FailedCrop.find({ farmerId: req.user._id })
            .sort({ profit: 1 })
            .lean();

        const rows = ['crop_name,total_expense,total_revenue,profit,failure_reason'];
        failedCrops.forEach((f) => {
            const name = `"${String(f.cropName).replace(/"/g, '""')}"`;
            rows.push(`${name},${f.totalExpense},${f.totalRevenue},${f.profit},${f.failureReason}`);
        });

        const csv = rows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="agrovision_failed_crops.csv"');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/analytics/refresh
// Full recalculation for the user
// ─────────────────────────────────────────────
const refreshUserAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find all active crop plans
        const activePlans = await CropPlan.find({ user_id: userId }).select('_id');
        
        // Find all storage items (past crops)
        const StorageInventory = require('../models/StorageInventory.js');
        const pastCrops = await StorageInventory.find({ user_id: userId }).select('crop_plan_id _id');

        const allIds = [
            ...activePlans.map(p => p._id),
            ...pastCrops.map(s => s.crop_plan_id || s._id)
        ];

        // Unique IDs
        const uniqueIds = [...new Set(allIds.map(id => id.toString()))];

        // Recalculate each
        for (const cropId of uniqueIds) {
            await recalculateAnalytics(cropId, userId);
        }

        res.json({ message: `Successfully refreshed analytics for ${uniqueIds.length} crops.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get profitable crops for Power BI
// @route   GET /api/analytics/profitable-crops-archived
// @access  Private
const getProfitableCropsArchived = async (req, res) => {
    try {
        const crops = await ArchivedCrop.find({ 
            farmerId: req.user._id,
            status: 'profitable'
        }).lean();

        const result = crops.map(c => ({
            crop_name: c.cropName,
            total_expense: c.totalExpense,
            total_revenue: c.totalRevenue,
            profit: c.profit,
            status: c.status
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get failed crops for Power BI
// @route   GET /api/analytics/failed-crops-archived
// @access  Private
const getFailedCropsArchived = async (req, res) => {
    try {
        const crops = await ArchivedCrop.find({ 
            farmerId: req.user._id,
            status: 'failed'
        }).lean();

        const result = crops.map(c => ({
            crop_name: c.cropName,
            total_expense: c.totalExpense,
            total_revenue: c.totalRevenue,
            loss: Math.abs(c.profit),
            sell_date: c.sellDate
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Sync all historical and current data to Google Sheets
// @route   POST /api/analytics/sync-sheets
// @access  Private
const syncAllDataToSheets = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Fetch Archived Crops
        const archived = await ArchivedCrop.find({ farmerId: userId }).sort({ sellDate: -1 }).lean();

        // 2. Format rows with Headers for Looker Studio
        const headers = ['Date', 'Crop Name', 'Total Investment', 'Total Revenue', 'Net Profit', 'Status'];
        const dataRows = archived.map(c => [
            c.sellDate ? new Date(c.sellDate).toLocaleDateString() : new Date().toLocaleDateString(),
            c.cropName,
            c.totalExpense,
            c.totalRevenue,
            c.profit,
            c.status
        ]);

        const allRows = [headers, ...dataRows];

        // 3. Update Sheet starting from A1
        await updateSheetWithAllData(allRows);

        res.json({ message: `Successfully synced ${allRows.length - 1} records to Google Sheets.` });
    } catch (error) {
        console.error('Sync Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    recalculateAnalytics, 
    getProfitableCrops, 
    exportAnalyticsCSV,
    getFailedCrops,
    exportFailedCropsCSV,
    refreshUserAnalytics,
    getProfitableCropsArchived,
    getFailedCropsArchived,
    syncAllDataToSheets
};
