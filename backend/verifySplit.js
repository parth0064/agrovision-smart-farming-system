require('dotenv').config();
const mongoose = require('mongoose');
const FailedCrop = require('./models/FailedCrop.js');
const CropAnalytics = require('./models/CropAnalytics.js');

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const failed = await FailedCrop.find().lean();
    const analytics = await CropAnalytics.find().lean();

    console.log(`\n📊  PROFITABLE CROPS CHECK`);
    analytics.forEach(a => {
        if (a.profit >= 0) {
            console.log(`   [${a.is_current ? 'Present' : 'Past'}] ${a.crop_name}: ₹${a.profit}`);
        }
    });

    console.log(`\n📉  FAILED CROPS CHECK`);
    failed.forEach(f => {
        console.log(`   [${f.isCurrent ? 'Present' : 'Past'}] ${f.cropName}: ₹${f.profit} (${f.failureReason})`);
    });
    
    await mongoose.disconnect();
}
check();
