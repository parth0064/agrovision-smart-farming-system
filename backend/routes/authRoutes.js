const express = require('express');
const router = express.Router();
const { googleLogin, updateRole, emailLogin } = require('../controllers/authController.js');

router.post('/google', googleLogin);
router.post('/login', emailLogin);
router.put('/role', updateRole);

module.exports = router;
