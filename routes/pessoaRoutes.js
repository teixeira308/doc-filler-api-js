// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PessoaController = require('../controller/PessoaController');

const multer = require('multer');
const upload = multer().fields([
    { name: 'file', maxCount: 1 },  // Aceita um arquivo com o nome 'file'
    { name: 'grupoId', maxCount: 1 } // Aceita um campo de texto com o nome 'grupoId'
  ]);

// Rota para receber dados de um candidato
router.post('/pessoas', authenticateToken, PessoaController.createPessoa ); 
router.get('/pessoas', authenticateToken, PessoaController.listAllPessoas );
router.get('/pessoas/:id', authenticateToken, PessoaController.getPessoa );
router.delete('/pessoas/:id', authenticateToken,PessoaController.deletePessoa);
router.put('/pessoas/:id', authenticateToken,PessoaController.alterPessoa);
router.post('/pessoas/import', authenticateToken, upload, PessoaController.importPessoasFromExcel);


module.exports = router;
