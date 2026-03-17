const express = require("express");
const router = express.Router();
const { getChatbotResponse } = require("../ai-engine/chatbotController");
const { protect } = require("../../backend/middleware/authMiddleware");
const ChatHistory = require("../../backend/models/ChatHistory");

/**
 * @route   POST /api/chatbot
 * @desc    Get AI agricultural advice
 * @access  Protected
 */
router.post("/", protect, async (req, res) => {
    const { message, language, userName, sessionId } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        // Use provided sessionId or generate a new one if it's a new chat
        const activeSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // If it's a new session, generate a title from the first message
        let sessionTitle = "New Conversation";
        if (!sessionId) {
            sessionTitle = message.length > 30 ? message.substring(0, 27) + "..." : message;
        } else {
            // Find existing session title if possible
            const existing = await ChatHistory.findOne({ sessionId: activeSessionId });
            if (existing) sessionTitle = existing.sessionTitle;
        }

        // Save user message
        await ChatHistory.create({
            userId: req.user._id,
            sessionId: activeSessionId,
            sessionTitle,
            role: 'user',
            text: message
        });

        const answer = await getChatbotResponse(message, language || "en", userName);

        // Save bot response
        await ChatHistory.create({
            userId: req.user._id,
            sessionId: activeSessionId,
            sessionTitle,
            role: 'bot',
            text: answer
        });

        res.json({ answer, sessionId: activeSessionId });
    } catch (error) {
        console.error("Chatbot API error:", error);
        res.status(500).json({ error: "Failed to generate response. Please try again later." });
    }
});

/**
 * @route   GET /api/chatbot/history/sessions
 * @desc    Get unique chat sessions for the user
 * @access  Protected
 */
router.get("/history/sessions", protect, async (req, res) => {
    try {
        const sessions = await ChatHistory.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { 
                _id: "$sessionId", 
                title: { $first: "$sessionTitle" },
                lastMessageTime: { $max: "$createdAt" }
            }},
            { $sort: { lastMessageTime: -1 } }
        ]);
        res.json(sessions);
    } catch (error) {
        console.error("Fetch sessions error:", error);
        res.status(500).json({ error: "Failed to fetch chat sessions." });
    }
});

/**
 * @route   GET /api/chatbot/history/:sessionId
 * @desc    Get chat history for a specific session
 * @access  Protected
 */
router.get("/history/:sessionId", protect, async (req, res) => {
    try {
        const history = await ChatHistory.find({ 
            userId: req.user._id,
            sessionId: req.params.sessionId 
        }).sort({ createdAt: 1 });
        res.json(history);
    } catch (error) {
        console.error("Fetch history error:", error);
        res.status(500).json({ error: "Failed to fetch chat history." });
    }
});

module.exports = router;
