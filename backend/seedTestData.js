/**
 * TEMPORARY TEST DATA SEED SCRIPT
 * ================================
 * Purpose : Insert test data for Power BI profitable-crops analytics testing.
 * User    : yendheparth52@gmail.com  /  password: aaaa  /  role: farmer
 *
 * HOW TO RUN:
 *   node seedTestData.js
 *
 * HOW TO REMOVE TEST DATA:
 *   node seedTestData.js --remove
 *
 * All documents seeded by this script are tagged with  isTestData: true
 * (stored in the `notes` / metadata field where possible) so they can be
 * identified and cleaned up later.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models ──────────────────────────────────────────────────────────────────
const User             = require('./models/User.js');
const CropPlan         = require('./models/CropPlan.js');
const CropExpense      = require('./models/CropExpense.js');
const CropIncome       = require('./models/CropIncome.js');
const StorageInventory = require('./models/StorageInventory.js');
const CropAnalytics    = require('./models/CropAnalytics.js');
const FailedCrop       = require('./models/FailedCrop.js');

// ── Constants ────────────────────────────────────────────────────────────────
const TEST_EMAIL    = 'yendheparth52@gmail.com';
const TEST_PASSWORD = 'aaaa';
const TEST_TAG      = '[TEST_DATA]'; // Prefix added to notes for easy identification

// ── Helper ───────────────────────────────────────────────────────────────────
const note = (msg) => `${TEST_TAG} ${msg}`;

// ── Seed data definition ─────────────────────────────────────────────────────
const CROPS = [
    {
        crop_name:     'Wheat',
        location:      'Test Farm - Field A',
        land_area:     2,          // acres
        planting_date: new Date('2025-01-10'),
        predicted_profit: 12000,
        status: 'growing',
        expenses: [
            { expense_type: 'Seeds',      amount: 3000, notes: note('Wheat seed purchase') },
            { expense_type: 'Fertilizer', amount: 2500, notes: note('Wheat fertilizer')    },
            { expense_type: 'Labor',      amount: 2000, notes: note('Wheat labor')          },
        ],
        // Revenue data (shelf life / income)
        quantityHarvested:  900,   // kg
        sellingPricePerKg:  22,
        totalRevenue:       19800,
        shelf_life_days:    365,
        harvest_date:       new Date('2025-06-01'),
    },
    {
        crop_name:     'Soybean',
        location:      'Test Farm - Field B',
        land_area:     1.5,        // acres
        planting_date: new Date('2025-01-15'),
        predicted_profit: 9000,
        status: 'harvested',
        expenses: [
            { expense_type: 'Seeds',      amount: 2000, notes: note('Soybean seeds')       },
            { expense_type: 'Fertilizer', amount: 1800, notes: note('Soybean fertilizer')  },
            { expense_type: 'Labor',      amount: 1500, notes: note('Soybean labor')        },
        ],
        quantityHarvested:  800,
        sellingPricePerKg:  18,
        totalRevenue:       14400,
        shelf_life_days:    180,
        harvest_date:       new Date('2025-05-15'),
    },
    {
        crop_name:     'Tomato',
        location:      'Test Farm - Field C',
        land_area:     1,          // acres
        planting_date: new Date('2025-01-20'),
        predicted_profit: 2500,
        status: 'harvested',
        expenses: [
            { expense_type: 'Seeds',      amount: 1500, notes: note('Tomato seeds')        },
            { expense_type: 'Fertilizer', amount: 1200, notes: note('Tomato fertilizer')   },
            { expense_type: 'Labor',      amount: 1000, notes: note('Tomato labor')         },
        ],
        quantityHarvested:  600,
        sellingPricePerKg:  10,
        totalRevenue:       6000,
        shelf_life_days:    14,
        harvest_date:       new Date('2025-04-20'),
    },
    {
        crop_name:     'Rice',
        location:      'Test Farm - Field E',
        land_area:     3,
        planting_date: new Date('2025-02-01'),
        predicted_profit: 15000,
        expenses: [
            { expense_type: 'Seeds', amount: 5000, notes: note('Rice seeds') },
            { expense_type: 'Labor', amount: 3000, notes: note('Flood: Emergency repairs to bunds') },
        ],
        quantityHarvested: 200,
        sellingPricePerKg: 20,
        totalRevenue: 4000,
        shelf_life_days: 180,
        harvest_date: new Date('2025-06-10'),
    },
    {
        crop_name:     'Potato',
        location:      'Test Farm - Field F',
        land_area:     2,
        planting_date: new Date('2025-02-15'),
        predicted_profit: 8000,
        expenses: [
            { expense_type: 'Seeds', amount: 4000, notes: note('Potato seeds') },
            { expense_type: 'Fertilizer', amount: 2000, notes: note('Low Market Price: fertilizer cost high') },
        ],
        quantityHarvested: 150,
        sellingPricePerKg: 20,
        totalRevenue: 3000,
        shelf_life_days: 90,
        harvest_date: new Date('2025-05-20'),
    },
    {
        crop_name:     'Onion',
        location:      'Test Farm - Field G',
        land_area:     1.5,
        planting_date: new Date('2024-10-10'),
        predicted_profit: 4000,
        isPast: true,
        expenses: [
            { expense_type: 'Seeds', amount: 2000, notes: note('Onion seeds') },
        ],
        quantityHarvested: 1000,
        sellingPricePerKg: 15,
        totalRevenue: 15000,
        shelf_life_days: 120,
        harvest_date: new Date('2025-01-15'),
    },
    {
        crop_name:     'Mustard',
        location:      'Test Farm - Field H',
        land_area:     1,
        planting_date: new Date('2024-11-01'),
        predicted_profit: 3000,
        isPast: true,
        expenses: [
            { expense_type: 'Seeds', amount: 1000, notes: note('Mustard seeds') },
            { expense_type: 'Labor', amount: 5000, notes: note('Disease: ruined the harvest') },
        ],
        quantityHarvested: 50,
        sellingPricePerKg: 40,
        totalRevenue: 2000,
        shelf_life_days: 365,
        harvest_date: new Date('2025-02-10'),
    },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const REMOVE_MODE = process.argv.includes('--remove');

    console.log('\n🌱  AgroVision – Test Data Seed Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');

    if (REMOVE_MODE) {
        await removeTestData();
    } else {
        await seedTestData();
    }

    await mongoose.disconnect();
    console.log('🔌  Disconnected from MongoDB');
}

// ── SEED ─────────────────────────────────────────────────────────────────────
async function seedTestData() {
    // 1. Ensure test farmer user exists
    let user = await User.findOne({ email: TEST_EMAIL });

    if (user) {
        console.log(`\n👤  User already exists: ${TEST_EMAIL}`);
        // Ensure password is correct
        const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
        user.password = hashed;
        user.role     = 'farmer';
        if (!user.name) user.name = 'Test Farmer';
        await user.save();
        console.log('   Password & role confirmed.');
    } else {
        const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
        user = await User.create({
            name:     'Test Farmer',
            email:    TEST_EMAIL,
            password: hashed,
            role:     'farmer',
            location: 'Test Farm, India',
        });
        console.log(`\n👤  Created new user: ${TEST_EMAIL}`);
    }

    // Remove any previously seeded test data for this user to avoid duplicates
    await cleanUserTestData(user._id);

    // 2. Insert each crop
    for (const cropDef of CROPS) {
        // ── CropPlan ──────────────────────────────────────────────────────
        const cropPlan = await CropPlan.create({
            user_id:          user._id,
            crop_name:        cropDef.crop_name,
            location:         cropDef.location,
            land_area:        cropDef.land_area,
            planting_date:    cropDef.planting_date,
            predicted_profit: cropDef.predicted_profit,
            seed_quantity:    0,
        });
        console.log(`\n🌾  Created CropPlan: ${cropDef.crop_name} (id: ${cropPlan._id})`);

        // ── CropExpenses ──────────────────────────────────────────────────
        let totalExpense = 0;
        for (const exp of cropDef.expenses) {
            await CropExpense.create({
                crop_id:      cropPlan._id,
                expense_type: exp.expense_type,
                amount:       exp.amount,
                notes:        exp.notes,
            });
            totalExpense += exp.amount;
            console.log(`   💸  Expense: ${exp.expense_type} ₹${exp.amount}`);
        }

        // ── StorageInventory (Shelf Life Monitoring) ───────────────────────
        const storageItem = await StorageInventory.create({
            user_id:        user._id,
            crop_name:      cropDef.crop_name,
            crop_plan_id:   cropPlan._id,
            quantity:       cropDef.quantityHarvested,
            unit:           'kg',
            price_per_kg:   cropDef.sellingPricePerKg,
            harvest_date:   cropDef.harvest_date,
            shelf_life_days: cropDef.shelf_life_days,
            images:         [],
        });
        console.log(`   📦  StorageInventory: ${cropDef.quantityHarvested} kg @ ₹${cropDef.sellingPricePerKg}/kg`);

        // ── CropIncome (revenue entry linked to CropPlan) ─────────────────
        await CropIncome.create({
            crop_id:   cropPlan._id,
            amount:    cropDef.totalRevenue,
            source:    'Mandi Sale',
            notes:     note(`${cropDef.crop_name}: ${cropDef.quantityHarvested}kg × ₹${cropDef.sellingPricePerKg}/kg`),
        });
        console.log(`   💰  Income: ₹${cropDef.totalRevenue}`);

        // ── Trigger Analytics Recalculation (handles both Profit & Failed Crops) ──
        const { recalculateAnalytics } = require('./controllers/analyticsController.js');
        await recalculateAnalytics(cropPlan._id, user._id);

        if (cropDef.isPast) {
            console.log(`   🏛️  Archiving: Deleting CropPlan to simulate Past Crop...`);
            await CropPlan.deleteOne({ _id: cropPlan._id });
            // Recalculate again -> now it will find it in StorageInventory -> isCurrent = false
            await recalculateAnalytics(cropPlan._id, user._id);
        }
        
        const analytics = await CropAnalytics.findOne({ crop_id: cropPlan._id });
        const profit = analytics ? analytics.profit : 0;
        console.log(`   📊  Analytics: Expense ₹${totalExpense}  Revenue ₹${cropDef.totalRevenue}  Profit ₹${profit} (${analytics?.is_current ? 'Present' : 'Past'})`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅  All test data seeded successfully!\n');
    console.log('📋  Summary:');
    console.log('   Email   : yendheparth52@gmail.com');
    console.log('   Password: aaaa');
    console.log('   Role    : farmer');
    console.log('\n   Expected Analytics Output:');
    console.log('   Wheat   → Expense ₹7500  Revenue ₹19800  Profit ₹12300');
    console.log('   Soybean → Expense ₹5300  Revenue ₹14400  Profit ₹9100');
    console.log('   Tomato  → Expense ₹3700  Revenue ₹6000   Profit ₹2300');
    console.log('\n   To remove this test data, run: node seedTestData.js --remove');
}

// ── REMOVE ────────────────────────────────────────────────────────────────────
async function removeTestData() {
    const user = await User.findOne({ email: TEST_EMAIL });
    if (!user) {
        console.log('⚠️   No test user found. Nothing to remove.');
        return;
    }

    console.log(`\n🗑️   Removing test data for: ${TEST_EMAIL}`);
    await cleanUserTestData(user._id, true);
    console.log('✅  Test data removed.\n');
    console.log('Note: The user account (yendheparth52@gmail.com) was kept intact.');
    console.log('      Delete it manually from MongoDB Atlas if needed.');
}

// ── Helper: remove tagged test data for a user ────────────────────────────────
async function cleanUserTestData(userId, verbose = false) {
    // Find all CropPlans for this user that have TEST_TAG notes in their storage
    // We identify test crops by the ones whose CropExpenses carry the [TEST_DATA] tag
    const testExpenses = await CropExpense.find({
        notes: { $regex: TEST_TAG, $options: 'i' }
    }).lean();

    const testCropIds = [...new Set(testExpenses.map(e => String(e.crop_id)))];

    if (testCropIds.length === 0 && !verbose) {
        return; // Nothing to clean on first run or already cleaned
    }

    // Delete CropExpenses
    const delExp = await CropExpense.deleteMany({ crop_id: { $in: testCropIds } });
    if (verbose) console.log(`   Removed ${delExp.deletedCount} expense records`);

    // Delete CropIncome
    const delInc = await CropIncome.deleteMany({ crop_id: { $in: testCropIds } });
    if (verbose) console.log(`   Removed ${delInc.deletedCount} income records`);

    // Delete CropAnalytics
    const delAna = await CropAnalytics.deleteMany({ crop_id: { $in: testCropIds } });
    if (verbose) console.log(`   Removed ${delAna.deletedCount} analytics records`);

    // Delete FailedCrops
    const delFail = await FailedCrop.deleteMany({ cropId: { $in: testCropIds } });
    if (verbose) console.log(`   Removed ${delFail.deletedCount} failed crop records`);

    // Delete StorageInventory items linked to these crop plans
    const delSto = await StorageInventory.deleteMany({ crop_plan_id: { $in: testCropIds } });
    if (verbose) console.log(`   Removed ${delSto.deletedCount} storage inventory records`);

    // Delete CropPlans
    const delCrop = await CropPlan.deleteMany({ _id: { $in: testCropIds } });
    if (verbose) console.log(`   Removed ${delCrop.deletedCount} crop plan records`);
}

main().catch((err) => {
    console.error('❌  Seed script failed:', err.message);
    process.exit(1);
});
