const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const EpiController = require('../controller/EpiController');

const multer = require('multer');
const upload = multer().fields([
    { name: 'file', maxCount: 1 },  // Aceita um arquivo com o nome 'file'
  ]);
  
// Rota para criar um novo EPI
router.post('/epi', authenticateToken, EpiController.createEpi);

// Rota para listar todos os EPIs do usuário autenticado
router.get('/epi', authenticateToken, EpiController.listEpis);

// Rota para obter um EPI específico
router.get('/epi/:id', authenticateToken, EpiController.getEpi);

// Rota para atualizar um EPI
router.put('/epi/:id', authenticateToken, EpiController.updateEpi);

// Rota para deletar um EPI
router.delete('/epi/:id', authenticateToken, EpiController.deleteEpi);

router.post('/epi/import', authenticateToken, upload, EpiController.EpiFromExcel);

module.exports = router;
