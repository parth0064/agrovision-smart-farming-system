const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getMarketplaceCrops,
    createRequest,
    getMyRequests,
    getFarmerRequests,
    acceptRequest,
    rejectRequest,
    counterRequest,
    updateMessage,
    getNotificationCounts
} = require('../controllers/marketplaceController');

// Marketplace (Buyer-facing)
router.get('/crops', protect, getMarketplaceCrops);
router.post('/request', protect, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.get('/notifications/count', protect, getNotificationCounts);

// Request management (Common)
router.put('/request/:id/accept', protect, acceptRequest);
router.put('/request/:id/reject', protect, rejectRequest);
router.put('/request/:id/counter', protect, counterRequest);
router.put('/request/:id/message', protect, updateMessage);

// Backward compatibility (Farmer request management)
router.get('/farmer/requests', protect, getFarmerRequests);
router.put('/farmer/request/:id/accept', protect, acceptRequest);
router.put('/farmer/request/:id/reject', protect, rejectRequest);
router.put('/farmer/request/:id/counter', protect, counterRequest);

module.exports = router;
