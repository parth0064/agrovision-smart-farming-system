const express = require('express');
const router = express.Router();
const { addStorage, getStorage, deleteStorage, sellStorage, updateStorage } = require('../controllers/storageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addStorage);
router.post('/:id/sell', protect, sellStorage);
router.get('/:userId', protect, getStorage);
router.put('/:id', protect, updateStorage);
router.delete('/:id', protect, deleteStorage);

module.exports = router;
