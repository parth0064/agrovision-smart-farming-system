const mongoose = require('mongoose');

const chatHistorySchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        sessionId: {
            type: String,
            required: true,
        },
        sessionTitle: {
            type: String,
            default: 'New Conversation',
        },
        role: {
            type: String,
            required: true,
            enum: ['user', 'bot'],
        },
        text: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
