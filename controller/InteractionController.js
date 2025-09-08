const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

const createInteraction = async (req, res) => {
    const { data_used, templateId } = req.body;
    const userId = req.userId;

    const data_used_json = JSON.stringify(data_used)
    try {
        const newInteraction = {
            data_used: data_used_json,
            userId,
            templateId,
        };

        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO interactions SET ?', newInteraction);
        connection.release();

        const interactionId = result.insertId;

        res.status(201).json({ ...newInteraction, id: interactionId });
    } catch (error) {
        Logmessage('Erro ao criar interação:' + error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const listInteractions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const userId = req.userId;

  try {
    const connection = await pool.getConnection();

    const [totalCount] = await connection.query(
      "SELECT COUNT(*) as total FROM interactions WHERE userId = ?",
      [userId]
    );

    const offset = (page - 1) * pageSize;
    const totalPages = Math.ceil(totalCount[0].total / pageSize);

    const [results] = await connection.query(
      `SELECT t.descricao, t.tipoTemplate, i.data_used, i.createdAt
       FROM interactions i
       JOIN template t ON t.id = i.templateId
       WHERE i.userId = ?
       ORDER BY i.createdAt DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    for (const row of results) {
      let data;
      if (typeof row.data_used === "string") {
        try {
          data = JSON.parse(row.data_used);
        } catch (e) {
          data = {};
        }
      } else {
        data = row.data_used || {};
      }

      // --- Pessoas ---
      if (Array.isArray(data.pessoaIds) && data.pessoaIds.length > 0) {
        const [pessoas] = await connection.query(
          "SELECT id, nome FROM pessoa WHERE id IN (?)",
          [data.pessoaIds]
        );
        row.pessoas = pessoas;
      } else {
        row.pessoas = [];
      }

      // --- Grupos ---
      if (Array.isArray(data.grupoIds) && data.grupoIds.length > 0) {
        const [grupos] = await connection.query(
          "SELECT id, nome FROM grupo_pessoa WHERE id IN (?)",
          [data.grupoIds]
        );
        row.grupos = grupos;
      } else {
        row.grupos = [];
      }

      // --- EPIs ---
      if (Array.isArray(data.epis) && data.epis.length > 0) {
        const epiIds = data.epis.map((e) => e.id);
        const [episDb] = await connection.query(
          "SELECT id, nome FROM epis WHERE id IN (?)",
          [epiIds]
        );

        row.epis = data.epis.map((e) => {
          const match = episDb.find((db) => db.id === e.id);
          return {
            id: e.id,
            nome: match ? match.nome : null,
            quantidade: e.quantidade || 1,
          };
        });
      } else {
        row.epis = [];
      }

      row.data_used = data;
    }

    connection.release();

    res.header("X-Total-Count", totalCount[0].total);
    res
      .status(200)
      .json({ data: results, page, pageSize, totalPages });
  } catch (error) {
    Logmessage("Erro ao listar interações:" + error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};


module.exports = { createInteraction, listInteractions };
