const express = require('express');
const router = express.Router();
const { searchSchemes, addScheme, findSchemes } = require('../controllers/schemeController.js');

router.post('/search', searchSchemes);
router.post('/find', findSchemes);
router.post('/', addScheme);

module.exports = router;
