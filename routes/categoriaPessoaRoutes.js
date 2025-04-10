const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const CategoriaPessoaController = require('../controller/CategoriaPessoaController');

// Rota para criar uma nova categoria de pessoa
router.post('/categorias-pessoa', authenticateToken, CategoriaPessoaController.createCategoriaPessoa);

// Rota para listar todas as categorias de uma pessoa (do usuário autenticado)
router.get('/categorias-pessoa', authenticateToken, CategoriaPessoaController.listCategoriasPessoa);

// Rota para obter uma categoria específica
router.get('/categorias-pessoa/:id', authenticateToken, CategoriaPessoaController.getCategoriaPessoa);

// Rota para atualizar uma categoria
router.put('/categorias-pessoa/:id', authenticateToken, CategoriaPessoaController.updateCategoriaPessoa);

// Rota para deletar uma categoria
router.delete('/categorias-pessoa/:id', authenticateToken, CategoriaPessoaController.deleteCategoriaPessoa);

module.exports = router;
