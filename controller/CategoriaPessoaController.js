const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

// Criar categoria de pessoa
createCategoriaPessoa = async (req, res) => {
  const categoriaData = req.body;
  const userId = req.userId;

  try {
    categoriaData.userId = userId;

    const connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO categoria_pessoa SET ?', categoriaData);
    connection.release();

    const categoriaId = result.insertId;
    Logmessage('Categoria de pessoa criada:', categoriaData);

    res.status(201).json({ ...categoriaData, id: categoriaId });
  } catch (error) {
    Logmessage('Erro ao criar categoria de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Listar categorias de pessoa
listCategoriasPessoa = async (req, res) => {
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM categoria_pessoa WHERE userId = ? ORDER BY createdAt DESC', [userId]);
    connection.release();

    res.status(200).json(results);
  } catch (error) {
    Logmessage('Erro ao listar categorias de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter categoria de pessoa por ID
getCategoriaPessoa = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM categoria_pessoa WHERE id = ?', [id]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    const categoria = results[0];
    if (categoria.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    res.status(200).json(categoria);
  } catch (error) {
    Logmessage('Erro ao obter categoria de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar categoria de pessoa
updateCategoriaPessoa = async (req, res) => {
  const { id } = req.params;
  const newData = req.body;
  const userId = req.userId;

  try {
    const [existing] = await pool.query('SELECT * FROM categoria_pessoa WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    const categoria = existing[0];
    if (categoria.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const connection = await pool.getConnection();
    await connection.query('UPDATE categoria_pessoa SET ? WHERE id = ?', [newData, id]);
    connection.release();

    res.status(200).json({ message: 'Categoria atualizada com sucesso' });
  } catch (error) {
    Logmessage('Erro ao atualizar categoria de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Excluir categoria de pessoa
deleteCategoriaPessoa = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const [existing] = await pool.query('SELECT * FROM categoria_pessoa WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    const categoria = existing[0];
    if (categoria.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const connection = await pool.getConnection();
    await connection.query('DELETE FROM categoria_pessoa WHERE id = ?', [id]);
    connection.release();

    res.status(200).json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    Logmessage('Erro ao excluir categoria de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  createCategoriaPessoa,
  listCategoriasPessoa,
  getCategoriaPessoa,
  updateCategoriaPessoa,
  deleteCategoriaPessoa,
};
