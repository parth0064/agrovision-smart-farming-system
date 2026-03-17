const express = require('express');
const router = express.Router();
const { createListing, getListings, getPrices } = require('../controllers/marketController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.post('/list', protect, createListing);
router.get('/listings', getListings);
router.get('/prices', getPrices);

module.exports = router;
