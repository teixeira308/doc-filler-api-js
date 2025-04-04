// routes/candidatesRoutes.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PessoaController = require('../controller/PessoaController');

const multer = require('multer');

// Rota para receber dados de um candidato
router.post('/pessoas', authenticateToken, PessoaController.createPessoa ); 
router.get('/pessoas', authenticateToken, PessoaController.listAllPessoas );
router.get('/pessoas/:id', authenticateToken, PessoaController.getPessoa );
router.delete('/pessoas/:id', authenticateToken,PessoaController.deletePessoa);
router.put('/pessoas/:id', authenticateToken,PessoaController.alterPessoa);
router.post('/pessoas/import', authenticateToken, multer().single('file'), PessoaController.importPessoasFromExcel);


module.exports = router;
