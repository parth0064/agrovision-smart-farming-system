const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmerName: {
        type: String,
        required: true
    },
    questionTitle: {
        type: String,
        required: true
    },
    questionDescription: {
        type: String,
        required: true
    },
    cropType: {
        type: String,
        required: true
    },
    replyCount: {
        type: Number,
        default: 0
    },
    datePosted: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true, collection: 'farmer_questions' });

module.exports = mongoose.model('Question', questionSchema);
