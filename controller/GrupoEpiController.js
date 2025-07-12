const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

// Criar grupo de pessoa
createGrupoEpi = async (req, res) => {
  const grupoData = req.body;
  const userId = req.userId;

  try {
    grupoData.userId = userId;

    const connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO grupo_epi SET ?', grupoData);
    connection.release();

    const grupoId = result.insertId;
    Logmessage('grupo de epi criado:', grupoData);

    res.status(201).json({ ...grupoData, id: grupoId });
  } catch (error) {
    Logmessage('Erro ao criar grupo de epi:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Listar grupos de epis
listGruposEpi = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();

    const [totalCount] = await connection.query(
      'SELECT COUNT(*) as total FROM grupo_epi WHERE userId = ?',
      [userId]
    );

    const offset = (page - 1) * pageSize;
    const totalPages = Math.ceil(totalCount[0].total / pageSize);

    const [results] = await connection.query(
      'SELECT * FROM grupo_epi WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [userId, pageSize, offset]
    );

    connection.release();

    res.header('X-Total-Count', totalCount[0].total);
    res.status(200).json({ data: results, page, pageSize, totalPages });
  } catch (error) {
    Logmessage('Erro ao listar grupos de pessoa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};


// Obter grupo de pessoa por ID
getGrupoEpi = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM grupo_epi WHERE id = ?', [id]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ message: 'grupo epi não encontrado' });
    }

    const grupo = results[0];
    if (grupo.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    res.status(200).json(grupo);
  } catch (error) {
    Logmessage('Erro ao obter grupo de epi:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar grupo de pessoa
updateGrupoEpi = async (req, res) => {
  const { id } = req.params;
  const newData = req.body;
  const userId = req.userId;

  try {
    const [existing] = await pool.query('SELECT * FROM grupo_epi WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'grupo epi não encontrado' });
    }

    const grupo = existing[0];
    if (grupo.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const connection = await pool.getConnection();
    await connection.query('UPDATE grupo_epi SET ? WHERE id = ?', [newData, id]);
    connection.release();

    res.status(200).json({ message: 'grupo epi atualizado com sucesso' });
  } catch (error) {
    Logmessage('Erro ao atualizar grupo de epi: ', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Excluir grupo de pessoa
deleteGrupoEpi = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const [existing] = await pool.query('SELECT * FROM grupo_epi WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'grupo epi não encontrado' });
    }

    const grupo = existing[0];
    if (grupo.userId !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const connection = await pool.getConnection();
    await connection.query('DELETE FROM grupo_epi WHERE id = ?', [id]);
    connection.release();

    res.status(200).json({ message: 'grupo epi com sucesso' });
  } catch (error) {
    Logmessage('Erro ao excluir grupo de epi: ', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  createGrupoEpi,
  listGruposEpi,
  getGrupoEpi,
  updateGrupoEpi,
  deleteGrupoEpi,
};
