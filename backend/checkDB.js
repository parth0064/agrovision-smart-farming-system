const mongoose = require('mongoose');
const ArchivedCrop = require('./models/ArchivedCrop');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB Connected');
    
    const count = await ArchivedCrop.countDocuments();
    console.log('Total Archived Crops in DB:', count);
    
    if (count > 0) {
        const samples = await ArchivedCrop.find().limit(3).lean();
        console.log('Sample Data:', JSON.stringify(samples, null, 2));
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkData();
