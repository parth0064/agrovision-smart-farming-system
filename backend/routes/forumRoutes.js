const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createQuestion,
    getQuestions,
    getQuestionById,
    addReply
} = require('../controllers/forumController');

router.post('/question', protect, createQuestion);
router.get('/questions', protect, getQuestions);
router.get('/question/:id', protect, getQuestionById);
router.post('/reply', protect, addReply);

module.exports = router;
