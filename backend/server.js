const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser with increased payload limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/crop', require('./routes/cropRoutes.js'));
app.use('/api/market', require('./routes/marketRoutes.js'));
app.use('/api/schemes', require('./routes/schemeRoutes.js'));
app.use('/api/storage', require('./routes/storageRoutes.js'));
app.use('/api/marketplace', require('./routes/marketplaceRoutes.js'));
app.use('/api/analytics', require('./routes/analyticsRoutes.js'));
app.use('/api/lifecycle', require('./routes/lifecycleRoutes.js'));
app.use('/api/farmer-talk', require('./routes/forumRoutes.js'));
app.use('/api/chatbot', require('../chatbot/routes/chatbotRoutes.js'));

app.get('/', (req, res) => {
    res.send('AgroVision API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
