const pool = require('../config/dbConfig');
const { Logmessage } = require("../helper/Tools");
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() });

createPessoa = async (req, res) => {
    const pessoaData = req.body;
    const userId = req.userId; // Obtém o userId do token
  
    Logmessage("Criar pessoa, dados do body:", pessoaData);
    
    try {
      // Adiciona o userId aos dados da pessoa
      pessoaData.userId = userId;
  
      const connection = await pool.getConnection();
      const [result] = await connection.query('INSERT INTO pessoa SET ?', pessoaData);
      connection.release();
  
      const pessoaId = result.insertId; // ID da pessoa inserida
  
      Logmessage('Dados da pessoa inseridos no banco de dados:', pessoaData);
      res.status(201).json({ ...pessoaData, id: pessoaId }); // Respondendo com os dados da pessoa e o ID inserido
    } catch (error) {
      Logmessage('Erro ao inserir dados da pessoa no banco de dados: ' + error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

listAllPessoas = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamanho da página (padrão: 10)

    try {
    
        const connection = await pool.getConnection();
        const [totalCount] = await connection.query('SELECT COUNT(*) as total FROM pessoa where userId=?',req.userId);

        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalCount[0].total / pageSize);

        const [results] = await connection.query(
            `SELECT p.*, g.nome AS grupo_nome
             FROM pessoa p
             LEFT JOIN grupo_pessoa g ON p.grupoId = g.id
             WHERE p.userId = ?
             ORDER BY p.createdAt DESC
             LIMIT ? OFFSET ?`,
            [req.userId, pageSize, offset]
        );
        connection.release();
        var now = new Date();
        //Logmessage('Lista de pessoas recuperada do banco de dados:'+ results);

        // Definir o cabeçalho X-Total-Count para enviar o total de resultados
        res.header('X-Total-Count', totalCount[0].total);

        // Enviar os resultados e informações de paginação
        res.status(200).json({ data: results, page, pageSize, totalPages });
    } catch (error) {
        Logmessage('Erro ao recuperar a lista de pessoas do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}


alterPessoa = async (req, res) => {
    const { id } = req.params; // Captura o ID do parâmetro da rota
    const newData = req.body; // Novos dados da pessoa a serem atualizados
    const userId = req.userId; // Obtém o userId do token

    try {
        // Verifica se o registro com o ID especificado existe
        const [existingPessoa] = await pool.query('SELECT * FROM pessoa WHERE id = ?', [id]);
        if (existingPessoa.length === 0) {
            return res.status(404).json({ message: 'Pessoa não encontrada' });
        }

        const pessoa = existingPessoa[0];

        // Verifica se o userId do token corresponde ao userId da pessoa
        if (pessoa.userId !== userId) {
            return res.status(403).json({ message: 'Acesso não autorizado' });
        }

        // Atualiza os dados da pessoa no banco de dados
        const connection = await pool.getConnection();
        await connection.query('UPDATE pessoa SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage('Dados da pessoa atualizados no banco de dados:'+ newData);
        
        // Recupera os dados atualizados da pessoa do banco de dados
        const [updatedPessoa] = await pool.query('SELECT * FROM pessoa WHERE id = ?', [id]);
        
        res.status(200).json(updatedPessoa[0]); // Retorna somente os dados atualizados da pessoa
    } catch (error) {
        Logmessage('Erro ao atualizar dados da pessoa no banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


deletePessoa = async (req, res) => {
    const { id } = req.params; // Captura o ID do parâmetro da rota
    const userId = req.userId; // Obtém o userId do token
    Logmessage("deletando pessoa:"+id);

    try {
        // Verifica se a pessoa com o ID especificado existe
        const [existingPessoa] = await pool.query('SELECT * FROM pessoa WHERE id = ?', [id]);
        if (existingPessoa.length === 0) {
            return res.status(404).json({ message: 'Pessoa não encontrada' });
        }

        const pessoa = existingPessoa[0];

        // Verifica se o userId do token corresponde ao userId da pessoa
        if (pessoa.userId !== userId) {
            return res.status(403).json({ message: 'Acesso não autorizado' });
        }

        // Exclui a pessoa do banco de dados
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM pessoa WHERE id = ?', [id]);
        connection.release();

        Logmessage('Pessoa excluída do banco de dados', id);
        res.status(200).json({ message: 'Pessoa excluída com sucesso', id: id });
    } catch (error) {
        Logmessage('Erro ao excluir pessoa do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

getPessoa = async (req, res) => {
    const { id } = req.params; // Captura o ID da pessoa da URL
    const userId = req.userId; // Obtém o userId do token

    try {
        const connection = await pool.getConnection();
        const [pessoa] = await connection.query('SELECT p.*,g.nome as grupo_nome FROM pessoa p, grupo_pessoa g WHERE p.grupoId=g.id and p.id = ?', [id]); // Consulta uma pessoa com base no ID
        connection.release();

        if (pessoa.length === 0) { // Se não houver pessoa com o ID especificado, retorna 404
            return res.status(404).json({ message: 'Pessoa não encontrada' });
        }

        const pessoaData = pessoa[0];

        // Verifica se o userId do token corresponde ao userId da pessoa
        if (pessoaData.userId !== userId) {
            return res.status(403).json({ message: 'Acesso não autorizado' });
        }

        Logmessage('Pessoa recuperada do banco de dados:', pessoaData);

        // Retorna a pessoa encontrada
        res.status(200).json(pessoaData);
    } catch (error) {
        Logmessage('Erro ao recuperar a pessoa do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};


const importPessoasFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }
        console.log(req.body);  // Verifique se o grupoId está aqui
       

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const pessoas = xlsx.utils.sheet_to_json(sheet);

        if (!pessoas.length) {
            return res.status(400).json({ message: "O arquivo está vazio ou com formato inválido" });
        }

        const userId = req.userId;
        const grupoId = req.body.grupoId;

        const connection = await pool.getConnection();

        for (const pessoa of pessoas) {
            pessoa.userId = userId;

            if (grupoId) {
                pessoa.grupoId = grupoId;
            }

            await connection.query('INSERT INTO pessoa SET ?', pessoa);
        }

        connection.release();
        Logmessage(`Importação de ${pessoas.length} pessoas concluída.`);
        res.status(201).json({ message: `${pessoas.length} pessoas importadas com sucesso` });

    } catch (error) {
        Logmessage("Erro ao importar pessoas do Excel:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
};



module.exports = { createPessoa, listAllPessoas, alterPessoa, deletePessoa, getPessoa, importPessoasFromExcel }