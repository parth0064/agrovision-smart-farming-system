const express = require('express');
const router = express.Router();
const { 
    getProfitableCrops, 
    exportAnalyticsCSV, 
    getFailedCrops, 
    exportFailedCropsCSV,
    refreshUserAnalytics,
    getProfitableCropsArchived,
    getFailedCropsArchived,
    syncAllDataToSheets
} = require('../controllers/analyticsController.js');
const { protect } = require('../middleware/authMiddleware.js');

// GET /api/analytics/profitable-crops  — JSON profitability data
router.get('/profitable-crops', protect, getProfitableCrops);

// GET /api/analytics/export  — CSV download for Power BI / Excel
router.get('/export', protect, exportAnalyticsCSV);

// GET /api/analytics/failed-crops — JSON failed crops data
router.get('/failed-crops', protect, getFailedCrops);

// GET /api/analytics/failed-crops/export — CSV download for failed crops
router.get('/failed-crops/export', protect, exportFailedCropsCSV);

// POST /api/analytics/refresh — Full recalculation
router.post('/refresh', protect, refreshUserAnalytics);

// Power BI Archived endpoints
router.get('/profitable-crops-archived', protect, getProfitableCropsArchived);
router.get('/failed-crops-archived', protect, getFailedCropsArchived);

// POST /api/analytics/sync-sheets — Full sync to Google Sheets
router.post('/sync-sheets', protect, syncAllDataToSheets);

module.exports = router;
