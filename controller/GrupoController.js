const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

// Criar grupo de pessoa
createGrupoPessoa = async (req, res) => {
  const grupoData = req.body;
  const userId = req.userId;

  try {
    grupoData.userId = userId;

    const connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO grupo_pessoa SET ?', grupoData);
    connection.release();

    const grupoId = result.insertId;
    Logmessage('grupo de pessoa criada:', grupoData);

    res.status(201).json({ ...grupoData, id: grupoId });
  } catch (error) {
    Logmessage('Erro ao criar grupo de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Listar grupos de pessoa
listGruposPessoa = async (req, res) => {
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM grupo_pessoa WHERE userId = ? ORDER BY createdAt DESC', [userId]);
    connection.release();

    res.status(200).json(results);
  } catch (error) {
    Logmessage('Erro ao listar grupos de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter grupo de pessoa por ID
getGrupoPessoa = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM grupo_pessoa WHERE id = ?', [id]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ message: 'grupo não encontrada' });
    }

    const grupo = results[0];
    if (grupo.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    res.status(200).json(grupo);
  } catch (error) {
    Logmessage('Erro ao obter grupo de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar grupo de pessoa
updateGrupoPessoa = async (req, res) => {
  const { id } = req.params;
  const newData = req.body;
  const userId = req.userId;

  try {
    const [existing] = await pool.query('SELECT * FROM grupo_pessoa WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'grupo não encontrada' });
    }

    const grupo = existing[0];
    if (grupo.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const connection = await pool.getConnection();
    await connection.query('UPDATE grupo_pessoa SET ? WHERE id = ?', [newData, id]);
    connection.release();

    res.status(200).json({ message: 'grupo atualizada com sucesso' });
  } catch (error) {
    Logmessage('Erro ao atualizar grupo de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Excluir grupo de pessoa
deleteGrupoPessoa = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const [existing] = await pool.query('SELECT * FROM grupo_pessoa WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'grupo não encontrada' });
    }

    const grupo = existing[0];
    if (grupo.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const connection = await pool.getConnection();
    await connection.query('DELETE FROM grupo_pessoa WHERE id = ?', [id]);
    connection.release();

    res.status(200).json({ message: 'grupo excluída com sucesso' });
  } catch (error) {
    Logmessage('Erro ao excluir grupo de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  createGrupoPessoa,
  listGruposPessoa,
  getGrupoPessoa,
  updateGrupoPessoa,
  deleteGrupoPessoa,
};
