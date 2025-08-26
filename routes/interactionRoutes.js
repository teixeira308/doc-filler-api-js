const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const InteractionController = require('../controller/InteractionController'); 

const router = express.Router();

router.post('/interactions',authenticateToken ,InteractionController.createInteraction);
router.get('/interactions', authenticateToken, InteractionController.listInteractions);

module.exports = router;
