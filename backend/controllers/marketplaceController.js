const StorageInventory = require('../models/StorageInventory');
const BuyerRequest = require('../models/BuyerRequest');
const Order = require('../models/Order');
const { recalculateAnalytics } = require('./analyticsController');

// @desc    Get all available crops for marketplace (from Shelf-Life Monitoring)
// @route   GET /api/marketplace/crops
// @access  Private
exports.getMarketplaceCrops = async (req, res) => {
    try {
        // Fetch all storage inventory records and populate farmer name
        const crops = await StorageInventory.find({ quantity: { $gt: 0 } })
            .populate('user_id', 'name email location');

        const today = new Date();

        const formattedCrops = crops.map(record => {
            const harvestDate = new Date(record.harvest_date);
            const diffTime = today - harvestDate;
            const days_passed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const remaining_days = record.shelf_life_days - days_passed;

            return {
                _id: record._id,
                farmer: record.user_id,
                crop_name: record.crop_name,
                quantity: record.quantity,
                unit: record.unit,
                price_per_kg: record.price_per_kg,
                price_per_quintal: record.price_per_quintal,
                harvest_date: record.harvest_date,
                shelf_life_days: record.shelf_life_days,
                images: record.images,
                days_passed,
                remaining_days: remaining_days < 0 ? 0 : remaining_days,
                status: remaining_days < 10 ? 'CRITICAL' : remaining_days <= 20 ? 'WARNING' : 'SAFE'
            };
        });

        // Filter out expired crops (0 remaining days)
        const availableCrops = formattedCrops.filter(c => c.remaining_days > 0);

        res.json(availableCrops);
    } catch (error) {
        console.error('Error fetching marketplace crops:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a buyer request
// @route   POST /api/marketplace/request
// @access  Private (Buyer)
exports.createRequest = async (req, res) => {
    try {
        const { cropId, farmerId, cropName, quantityRequested, offeredPrice, message } = req.body;

        if (!cropId || !farmerId || !cropName || !quantityRequested || !offeredPrice) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Verify the crop exists and has enough quantity
        const crop = await StorageInventory.findById(cropId);
        if (!crop) {
            return res.status(404).json({ message: 'Crop not found' });
        }

        // Unit conversion: quantityRequested is in kg. crop.quantity is in crop.unit.
        let requestedInCropUnit = quantityRequested;
        if (crop.unit === 'Quintal') {
            requestedInCropUnit = quantityRequested / 100;
        }

        if (crop.quantity < requestedInCropUnit) {
            return res.status(400).json({ message: `Only ${crop.unit === 'Quintal' ? crop.quantity * 100 : crop.quantity} kg available` });
        }

        const newRequest = new BuyerRequest({
            buyerId: req.user._id,
            farmerId,
            cropId,
            cropName,
            quantityRequested,
            offeredPrice,
            message: message || ''
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get requests sent by the logged-in buyer
// @route   GET /api/marketplace/my-requests
// @access  Private (Buyer)
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await BuyerRequest.find({ buyerId: req.user._id })
            .populate('farmerId', 'name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching my requests:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all buyer requests for the logged-in farmer
// @route   GET /api/marketplace/farmer/requests
// @access  Private (Farmer)
exports.getFarmerRequests = async (req, res) => {
    try {
        const requests = await BuyerRequest.find({ farmerId: req.user._id })
            .populate('buyerId', 'name email')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching farmer requests:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept a buyer request or counter-offer
// @route   PUT /api/marketplace/request/:id/accept
// @access  Private
exports.acceptRequest = async (req, res) => {
    try {
        const request = await BuyerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Authorization logic:
        // 1. If status is 'pending', only the farmer can accept.
        // 2. If status is 'countered', only the buyer can accept.
        const isFarmer = request.farmerId.toString() === req.user._id.toString();
        const isBuyer = request.buyerId.toString() === req.user._id.toString();

        if (request.status === 'pending') {
            if (!isFarmer) return res.status(403).json({ message: 'Only the farmer can accept a pending request' });
        } else if (request.status === 'countered') {
            if (!isBuyer) return res.status(403).json({ message: 'Only the buyer can accept a counter offer' });
        } else {
            return res.status(400).json({ message: `Request cannot be accepted in its current state: ${request.status}` });
        }

        // Verify crop still has enough quantity
        const crop = await StorageInventory.findById(request.cropId);
        if (!crop) {
            return res.status(404).json({ message: 'Crop no longer exists' });
        }

        // Unit conversion: quantityRequested is in kg. crop.quantity is in crop.unit.
        let requestedInCropUnit = request.quantityRequested;
        if (crop.unit === 'Quintal') {
            requestedInCropUnit = request.quantityRequested / 100;
        }

        if (crop.quantity < requestedInCropUnit) {
            return res.status(400).json({ message: `Only ${crop.unit === 'Quintal' ? crop.quantity * 100 : crop.quantity} kg remaining. Cannot fulfill this request.` });
        }

        // Determine final price (counter price if countered, else offered price)
        const finalPrice = request.counterPrice || request.offeredPrice;

        // 1. Create Order
        const order = new Order({
            buyerId: request.buyerId,
            farmerId: request.farmerId,
            cropId: request.cropId,
            cropName: request.cropName,
            quantity: request.quantityRequested,
            finalPrice
        });
        await order.save();

        // 2. Add income to Expenses for the specific crop (StorageInventory item)
        const CropIncome = require('../models/CropIncome');
        const incomeAmount = request.quantityRequested * finalPrice;
        
        await CropIncome.create({
            crop_id: crop.crop_plan_id || crop._id, // Prefer plan ID for session history
            amount: incomeAmount,
            source: 'AgroVision Buyer', // Matches the option in our frontend
            notes: `Automated entry: Sold ${request.quantityRequested} kg of ${request.cropName} via Marketplace at ₹${finalPrice}/kg.`,
        });

        // 3. Reduce crop quantity in StorageInventory (using converted unit)
        crop.quantity -= requestedInCropUnit;
        await crop.save();

        // 4. Update request status
        request.status = 'accepted';
        await request.save();

        // 5. Trigger analytics recalculation
        recalculateAnalytics(request.cropId, request.farmerId);

        res.json({ message: 'Request accepted successfully', order });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject a buyer request
// @route   PUT /api/marketplace/farmer/request/:id/reject
// @access  Private (Farmer)
exports.rejectRequest = async (req, res) => {
    try {
        const request = await BuyerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Request rejected', request });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Counter offer on a buyer request
// @route   PUT /api/marketplace/farmer/request/:id/counter
// @access  Private (Farmer)
exports.counterRequest = async (req, res) => {
    try {
        const { counterPrice } = req.body;

        if (!counterPrice || counterPrice <= 0) {
            return res.status(400).json({ message: 'Please provide a valid counter price' });
        }

        const request = await BuyerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        request.status = 'countered';
        request.counterPrice = counterPrice;
        await request.save();

        res.json({ message: 'Counter offer sent', request });
    } catch (error) {
        console.error('Error sending counter offer:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update message/conversation on a request
// @route   PUT /api/marketplace/request/:id/message
// @access  Private
exports.updateMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required' });

        const request = await BuyerRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Authorization: only buyer or farmer of this request
        if (request.buyerId.toString() !== req.user._id.toString() && 
            request.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const senderName = req.user.name;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Append to message thread
        const newMessage = `\n[${senderName} @ ${timestamp}]: ${message}`;
        request.message = (request.message || '') + newMessage;
        
        await request.save();
        res.json({ message: 'Message sent', request });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get notification counts for requests
// @route   GET /api/marketplace/notifications/count
// @access  Private
exports.getNotificationCounts = async (req, res) => {
    try {
        let count = 0;
        
        if (req.user.role === 'buyer') {
            // Count requests that are 'countered' (waiting for buyer action)
            count = await BuyerRequest.countDocuments({ 
                buyerId: req.user._id, 
                status: 'countered' 
            });
        } else {
            // Count requests that are 'pending' (waiting for farmer action)
            count = await BuyerRequest.countDocuments({ 
                farmerId: req.user._id, 
                status: 'pending' 
            });
        }

        res.json({ count });
    } catch (error) {
        console.error('Error fetching notification counts:', error);
        res.status(500).json({ message: error.message });
    }
};
