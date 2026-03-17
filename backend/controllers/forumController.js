const Question = require('../models/Question');
const Reply = require('../models/Reply');

// @desc    Create new question
// @route   POST /api/farmer-talk/question
const createQuestion = async (req, res) => {
    try {
        const { questionTitle, questionDescription, cropType, farmerName } = req.body;
        
        const question = await Question.create({
            farmerId: req.user._id,
            farmerName: farmerName || req.user.name || 'Anonymous Farmer',
            questionTitle,
            questionDescription,
            cropType
        });

        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all questions (with optional sorting/filtering)
// @route   GET /api/farmer-talk/questions
const getQuestions = async (req, res) => {
    try {
        const { sort, crop } = req.query;
        let query = {};
        
        if (crop && crop !== 'All') {
            query.cropType = crop;
        }

        let sortOption = { createdAt: -1 }; // Latest by default
        if (sort === 'replies') {
            sortOption = { replyCount: -1 };
        }

        const questions = await Question.find(query).sort(sortOption);
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get question and all replies
// @route   GET /api/farmer-talk/question/:id
const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const replies = await Reply.find({ questionId: req.params.id }).sort({ createdAt: 1 });

        res.status(200).json({
            question,
            replies
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new reply
// @route   POST /api/farmer-talk/reply
const addReply = async (req, res) => {
    try {
        const { questionId, answerText, farmerName } = req.body;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const reply = await Reply.create({
            questionId,
            farmerId: req.user._id,
            farmerName: farmerName || req.user.name || 'Anonymous Farmer',
            answerText
        });

        // Increment reply count on question
        question.replyCount += 1;
        await question.save();

        res.status(201).json(reply);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById,
    addReply
};
