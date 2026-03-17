const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmerName: {
        type: String,
        required: true
    },
    answerText: {
        type: String,
        required: true
    },
    datePosted: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true, collection: 'farmer_answers' });

module.exports = mongoose.model('Reply', replySchema);
