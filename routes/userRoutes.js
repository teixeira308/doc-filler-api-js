const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controller/userController');

router.post('/register', userController.createUser);
router.post('/login', userController.Login)
router.put('/status',authenticateToken,userController.changeStatus)

module.exports = router;