const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");

const createInteraction = async (req, res) => {
    const { personId, templateId, epiIds } = req.body;
    const userId = req.userId;

    try {
        const newInteraction = {
            personId,
            userId,
            templateId,
            epiIds,
        };

        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO interactions SET ?', newInteraction);
        connection.release();

        const interactionId = result.insertId;

        res.status(201).json({ ...newInteraction, id: interactionId });
    } catch (error) {
        Logmessage('Erro ao criar interação:', error);
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
            'SELECT COUNT(*) as total FROM interactions WHERE userId = ?',
            [userId]
        );

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query(
            'SELECT * FROM interactions WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
            [userId, pageSize, offset]
        );

        connection.release();

        res.header('X-Total-Count', totalCount[0].total);
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao listar interações:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = { createInteraction, listInteractions };
