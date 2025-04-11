const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const GrupoController = require('../controller/GrupoController');

// Rota para criar uma nova categoria de pessoa
router.post('/grupo', authenticateToken, CategoriaPessoaController.createCategoriaPessoa);

// Rota para listar todas as categorias de uma pessoa (do usuário autenticado)
router.get('/grupo', authenticateToken, CategoriaPessoaController.listCategoriasPessoa);

// Rota para obter uma categoria específica
router.get('/grupo/:id', authenticateToken, CategoriaPessoaController.getCategoriaPessoa);

// Rota para atualizar uma categoria
router.put('/grupo/:id', authenticateToken, CategoriaPessoaController.updateCategoriaPessoa);

// Rota para deletar uma categoria
router.delete('/grupo/:id', authenticateToken, CategoriaPessoaController.deleteCategoriaPessoa);

module.exports = router;
