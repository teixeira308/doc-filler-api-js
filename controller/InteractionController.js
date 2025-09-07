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
        Logmessage('Erro ao criar interação:'+ error);
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
            '    SELECT t.descricao,t.tipoTemplate,i.data_used,i.createdAt FROM interactions i, template t WHERE t.id=i.templateId and i.userId = ? ORDER BY i.createdAt DESC LIMIT ? OFFSET ?',
            [userId, pageSize, offset]
        );
       for (const row of results) {
            const data = JSON.parse(row.data_used);

            // Busca pessoa (se existir personId no JSON)
            if (data.personId) {
                const [person] = await connection.query(
                    'SELECT nome FROM pessoa WHERE id = ?',
                    [data.personId]
                );
                row.person = person.length ? person[0].nome : null;
            }

            // Busca EPIs (se existir epiIds no JSON)
            if (data.epiIds && data.epiIds.length > 0) {
                const [epis] = await connection.query(
                    `SELECT id, nome FROM epis WHERE id IN (?)`,
                    [data.epiIds]
                );
                row.epis = epis;
            }

            // Sobrescreve data_used já convertido
            row.data_used = data;
        }

        connection.release();

        res.header('X-Total-Count', totalCount[0].total);
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao listar interações:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

module.exports = { createInteraction, listInteractions };
