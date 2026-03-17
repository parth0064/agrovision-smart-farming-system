const express = require('express');
const router = express.Router();
const { predictCrop, getWeatherData, addCrop, getActiveCrops, deleteCrop, addExpense, getExpenses, addIncome, getIncome } = require('../controllers/cropController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Weather endpoint (must be before /:id to avoid route conflict)
router.route('/weather').get(protect, getWeatherData);

// Prediction does not strictly require auth, but to save it, it might. We'll leave predict open or protected based on preference. Let's protect them all to be safe.
router.route('/predict').post(protect, predictCrop);
router.route('/').post(protect, addCrop).get(protect, getActiveCrops);
router.route('/:id').delete(protect, deleteCrop);
router.route('/:id/expense').post(protect, addExpense).get(protect, getExpenses);
router.route('/:id/income').post(protect, addIncome).get(protect, getIncome);

module.exports = router;

