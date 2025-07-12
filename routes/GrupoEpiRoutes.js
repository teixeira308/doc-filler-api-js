const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const GrupoEpiController = require('../controller/GrupoEpiController');

const multer = require('multer');
const upload = multer().fields([
    { name: 'file', maxCount: 1 },  // Aceita um arquivo com o nome 'file'
  ]);

// Rota para criar uma nova categoria de pessoa
router.post('/grupo-epi', authenticateToken, GrupoEpiController.createGrupoEpi);

// Rota para listar todas as categorias de uma pessoa (do usuário autenticado)
router.get('/grupo-epi', authenticateToken, GrupoEpiController.listGruposEpi);

// Rota para obter uma categoria específica
router.get('/grupo-epi/:id', authenticateToken, GrupoEpiController.getGrupoEpi);

// Rota para atualizar uma categoria
router.put('/grupo-epi/:id', authenticateToken, GrupoEpiController.updateGrupoEpi);

// Rota para deletar uma categoria
router.delete('/grupo-epi/:id', authenticateToken, GrupoEpiController.deleteGrupoEpi);

router.post('/grupo-epi/import', authenticateToken, upload, GrupoEpiController.GrupoEpiFromExcel);

module.exports = router;
