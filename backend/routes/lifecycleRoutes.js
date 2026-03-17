const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getActiveCrops,
    addActiveCrop,
    deleteActiveCrop,
    addExpense,
    getExpenses,
    transferToShelf,
    getShelfCrops,
    completeSelling,
    getArchivedCrops
} = require('../controllers/lifecycleController');

// ── Active (Growing) crops ──
router.get('/active', protect, getActiveCrops);
router.post('/active', protect, addActiveCrop);
router.delete('/active/:id', protect, deleteActiveCrop);
router.post('/active/:id/expense', protect, addExpense);
router.get('/active/:id/expenses', protect, getExpenses);
router.post('/active/:id/transfer', protect, transferToShelf);

// ── Shelf Monitoring (Selling) crops ──
router.get('/shelf', protect, getShelfCrops);
router.post('/shelf/:id/complete', protect, completeSelling);

// ── Archived (Completed) crops ──
router.get('/archived', protect, getArchivedCrops);

module.exports = router;
