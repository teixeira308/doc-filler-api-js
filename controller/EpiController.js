const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");
const xlsx = require('xlsx');

// Criar EPI
createEpi = async (req, res) => {
  const epiData = req.body;
  const userId = req.userId;

  try {
    epiData.userId = userId;
    Logmessage(epiData)
    const connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO epis SET ?', epiData);
    connection.release();

    const epiId = result.insertId;
    Logmessage('EPI criado:', epiData);

    res.status(201).json({ ...epiData, id: epiId });
  } catch (error) {
    Logmessage('Erro ao criar EPI:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Listar EPIs
listEpis = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();

    const [totalCount] = await connection.query(
      'SELECT COUNT(*) as total FROM epis WHERE userId = ?',
      [userId]
    );

    const offset = (page - 1) * pageSize;
    const totalPages = Math.ceil(totalCount[0].total / pageSize);

    const [results] = await connection.query(
      'SELECT * FROM epis WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [userId, pageSize, offset]
    );

    connection.release();

    res.header('X-Total-Count', totalCount[0].total);
    res.status(200).json({ data: results, page, pageSize, totalPages });
  } catch (error) {
    Logmessage('Erro ao listar EPIs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter EPI por ID
getEpi = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(
      'SELECT * FROM epis WHERE id = ? AND userId = ?',
      [id, userId]
    );
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ message: 'EPI não encontrado' });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    Logmessage('Erro ao obter EPI:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar EPI
updateEpi = async (req, res) => {
  const { id } = req.params;
  const newData = req.body;
  const userId = req.userId;

  try {
    const [existing] = await pool.query(
      'SELECT * FROM epis WHERE id = ? AND userId = ?',
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'EPI não encontrado' });
    }

    const connection = await pool.getConnection();
    await connection.query('UPDATE epis SET ? WHERE id = ? AND userId = ?', [newData, id, userId]);
    connection.release();

    res.status(200).json({ message: 'EPI atualizado com sucesso' });
  } catch (error) {
    Logmessage('Erro ao atualizar EPI:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Excluir EPI
deleteEpi = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const [existing] = await pool.query(
      'SELECT * FROM epis WHERE id = ? AND userId = ?',
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'EPI não encontrado' });
    }

    const connection = await pool.getConnection();
    await connection.query('DELETE FROM epis WHERE id = ? AND userId = ?', [id, userId]);
    connection.release();

    res.status(200).json({ message: 'EPI excluído com sucesso' });
  } catch (error) {
    Logmessage('Erro ao excluir EPI:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};


const EpiFromExcel = async (req, res) => {
  try {
    // Verifique se o arquivo foi enviado
    if (!req.files || !req.files['file']) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }


    const workbook = xlsx.read(req.files['file'][0].buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const epis = xlsx.utils.sheet_to_json(sheet);

    if (!epis.length) {
      return res.status(400).json({ message: "O arquivo está vazio ou com formato inválido" });
    }

    const userId = req.userId;
    const connection = await pool.getConnection();

    for (const epi of epis) {
      epi.userId = userId;
      await connection.query('INSERT INTO epis SET ?', epi);
    }

    connection.release();
    Logmessage(`Importação de ${epis.length} EPIs concluída.`);
    res.status(201).json({ message: `${epis.length} Epis importadas com sucesso` });

  } catch (error) {
    console.error("Erro ao importar EPIs do Excel:", error); // 👈 imprime o stack trace
    Logmessage(`Erro ao importar EPIs do Excel: ${error.message}`); // 👈 registra a mensagem
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

getEpiByGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(
      'SELECT * FROM epis WHERE grupo_epi = ? AND userId = ?',
      [id, userId]
    );
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ message: 'EPI não encontrado' });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    Logmessage('Erro ao obter EPI:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  createEpi,
  listEpis,
  getEpi,
  updateEpi,
  deleteEpi,
  EpiFromExcel,
  getEpiByGroup
};
