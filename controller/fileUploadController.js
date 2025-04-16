const express = require('express');
const multer = require('multer');
const pool = require('../config/dbConfig');
const fs = require('fs');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require('path');
const { Logmessage } = require("../helper/Tools");
const { log } = require('console');

getTemplatesById = async (req, res) => {
    const { userid } = req.params; // Acessar o parâmetro de caminho
    const { arquivo } = req.query; // Acessar o parâmetro de consulta

    try {

        // Verificar se o documento existe na pasta de uploads e se pertence ao usuário
        const filePath = path.join(__dirname, '..', 'uploads', arquivo);
        console.log(filePath)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Documento não encontrado' });
        }

        // Consultar no banco de dados se o usuário possui acesso ao documento
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM template WHERE userId = ? AND nome = ?', [userid, arquivo]);
        connection.release();

        if (!rows.length) {
            return res.status(403).json({ message: 'Usuário não tem acesso a este documento' });
        }

        // Se tudo estiver correto, enviar o arquivo para download
        res.download(filePath);
    } catch (error) {
        console.error('Erro ao baixar o arquivo:', error);
        res.status(500).json({ message: 'Erro ao baixar o arquivo' });
    }
}

createFilledFile = async (req, res) => {
    const candidateId = req.params.idpessoa;
    const templateId = req.params.idtemplate;
    const userId = req.userId; // Obtém o userId do token
    Logmessage("Gerando arquivo da pessoa: " + candidateId);
    Logmessage("Gerando arquivo com template: " + templateId);

    try {
        // Consultar dados do candidato no banco de dados
        const connection = await pool.getConnection();
        const [candidateRows] = await connection.query('SELECT * FROM pessoa WHERE id = ? AND userId = ?', [candidateId, userId]);

        // Consultar o template no banco de dados para obter o nome do arquivo
        const [templateRows] = await connection.query('SELECT nome FROM template WHERE userId = ? and id = ?', [userId, templateId]);
        connection.release();

        if (!candidateRows.length) {
            return res.status(404).json({ message: 'Pessoa não encontrada ou acesso não autorizado' });
        }

        if (!templateRows.length) {
            return res.status(404).json({ message: 'Template não encontrado ou acesso não autorizado' });
        }

        const candidate = candidateRows[0];
        const templateFileName = templateRows[0].nome;
        Logmessage("Template utilizado: " + templateFileName);

        // Ler o arquivo docx do template
        const content = fs.readFileSync(path.join(__dirname, '..', 'uploads', templateFileName), 'binary');

        // Lógica para preencher o arquivo do template com os dados do candidato
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(candidate);

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        // Enviando o arquivo preenchido como resposta
        res.setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token")
            .setHeader("Access-Control-Allow-Methods", "*")
            .setHeader('Content-Disposition', `attachment; filename=filled_${templateFileName}.docx`)
            .status(200).send(buf);
    } catch (error) {
        console.error('Erro ao preencher o arquivo docx:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};




// Configuração do Multer para salvar os arquivos no disco
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Diretório onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        console.log(req.userId)
        // Obter a data e hora atual
        const currentDateTime = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').replace(/\..+/, '');

        // Obter o ID do usuário
        const userid = req.userId; // Supondo que o ID do usuário está disponível na requisição

        // Obter o nome do arquivo original
        const originalFileName = file.originalname;

        // Gerar o nome do arquivo usando a data e hora atual, o ID do usuário e o nome do arquivo original
        const fileName = `${userid}-${currentDateTime}-${originalFileName}`;

        cb(null, fileName); // Nome do arquivo salvo
    }
});


const upload = multer({ storage: storage });

// Middleware para processar o upload de um único arquivo
const uploadSingleFile = upload.single('file');

const UploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo foi enviado' });
    }

    const { descricao, userid } = req.body;
    const userId = req.userId;
    const nomearquivo = req.file.filename;
    const tamanho = req.file.size;
    const tipo = req.file.originalname.split('.').pop().toLowerCase()

    try {
        // Gravar os detalhes do arquivo no banco de dados
        const connection = await pool.getConnection();
        const query = 'INSERT INTO template (descricao, nome, createdAt, tipo, userid, tamanho) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [descricao, nomearquivo, new Date(), tipo, userId, tamanho];
        await connection.query(query, values);

        // Buscar os dados recém-inseridos no banco de dados
        const [rows] = await connection.query('SELECT * FROM template WHERE nome = ?', [nomearquivo]);
        connection.release();

        if (!rows.length) {
            return res.status(404).json({ message: 'Detalhes do arquivo não encontrados' });
        }

        // Retornar os dados do arquivo junto com a mensagem de sucesso
        const insertedFileDetails = rows[0];
        Logmessage(insertedFileDetails)
        res.setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token")
            .setHeader("Access-Control-Allow-Methods", "*")
            .status(200).json({ message: 'Arquivo enviado com sucesso', fileDetails: insertedFileDetails });
    } catch (error) {
        console.error('Erro ao inserir detalhes do arquivo no banco de dados:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const getTemplatesByUserId = async (req, res) => {
    const userId = req.params.userid;

    try {
        // Consultar templates no banco de dados com base no ID do usuário
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM template WHERE userid = ?', [userId]);
        connection.release();
        res.setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token")
            .setHeader("Access-Control-Allow-Methods", "*")
            .status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar templates por ID do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const deleteTemplateById = async (req, res) => {
    const templateId = req.params.id;
    const userId = req.userId;
    try {
        // Consultar o nome do arquivo do template no banco de dados
        const connection = await pool.getConnection();
        const query = 'SELECT nome FROM template WHERE userid=? AND id = ?';
        const [rows] = await connection.query(query, [userId, templateId]);
        connection.release();

        if (!rows.length) {
            return res.status(404).json({ message: 'Template não encontrado' });
        }

        const { nome } = rows[0];

        // Excluir o arquivo da pasta
        const filePath = path.join(__dirname, '..', 'uploads', nome);

        fs.unlink(filePath, (err) => {
            if (err) {
                // Verifica se err não é null antes de acessar err.code
                if (err !== null && err.code === 'ENOENT') {
                    Logmessage("Arquivo não existe no diretório, avançando")
                    deleteTemplateFromDatabase(templateId, req, res);
                } else {
                    console.error('Erro ao excluir o arquivo:', err);
                    return res.status(500).json({ message: 'Erro interno do servidor ao excluir o arquivo' });
                }
            } else {
                // Excluir o template do banco de dados
                deleteTemplateFromDatabase(templateId, req, res);
            }
        });
    } catch (error) {
        console.error('Erro ao consultar o nome do arquivo do template:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const deleteTemplateFromDatabase = async (templateId, req, res) => {
    const userId = req.userId;
    try {
        // Excluir o template do banco de dados
        const connection = await pool.getConnection();
        const query = 'DELETE FROM template WHERE userId= ? AND id = ?';
        const [result] = await connection.query(query, [userId, templateId]);
        connection.release();

        // Verificar se o template foi excluído com sucesso
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Template não encontrado' });
        }

        // Retornar uma resposta de sucesso
        res.setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token")
            .setHeader("Access-Control-Allow-Methods", "*")
            .status(200).json({ message: 'Template excluído com sucesso', deletedTemplateId: templateId });
    } catch (error) {
        console.error('Erro ao excluir o template do banco de dados:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const UpdateFile = async(req,res) =>{
    const { id } = req.params; // Captura o ID do parâmetro da rota
    const newData = req.body; // Novos dados da pessoa a serem atualizados
    const userId = req.userId; // Obtém o userId do token

    try {
        // Verifica se o registro com o ID especificado existe
        const [existingTemplate] = await pool.query('SELECT * FROM template WHERE id = ?', [id]);
        if (existingTemplate.length === 0) {
            return res.status(404).json({ message: 'Template não encontrado' });
        }

        const template = existingTemplate[0];

        // Verifica se o userId do token corresponde ao userId da pessoa
        if (template.userId !== userId) {
            return res.status(403).json({ message: 'Acesso não autorizado' });
        }

        // Atualiza os dados da pessoa no banco de dados
        const connection = await pool.getConnection();
        await connection.query('UPDATE template SET ? WHERE id = ?', [newData, id]);
        connection.release();

        Logmessage('Dados da template atualizados no banco de dados:'+ newData);
        
        // Recupera os dados atualizados da pessoa do banco de dados
        const [updatedTemplate] = await pool.query('SELECT * FROM template WHERE id = ?', [id]);
        
        res.status(200).json(updatedTemplate[0]); // Retorna somente os dados atualizados da pessoa
    } catch (error) {
        Logmessage('Erro ao atualizar dados da template no banco de dados:'+ error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const createFilledFilesBatch = async (req, res) => {
    const userId = req.userId;
    const { templateId, pessoaIds, grupoIds } = req.body;

    try {
        const connection = await pool.getConnection();
        console.log("pessoa: ", pessoaIds);
        console.log("grupo: ", grupoIds);
        console.log("template", templateId);

        // Buscar template
        const [templateRows] = await connection.query(
            'SELECT descricao, nome FROM template WHERE id = ? AND userId = ?',
            [templateId, userId]
        );

        if (!templateRows.length) {
            connection.release();
            return res.status(404).json({ message: 'Template não encontrado ou acesso não autorizado' });
        }

        const templateFileName = templateRows[0].nome;
        const templateFilledFileName = templateRows[0].descricao;
        const templatePath = path.join(__dirname, '..', 'uploads', templateFileName);
        const content = fs.readFileSync(templatePath, 'binary');

        // Buscar pessoas com base em pessoaIds e grupoIds
        let candidateQuery = 'SELECT * FROM pessoa WHERE userId = ?';
        const candidateParams = [userId];

        if (pessoaIds && pessoaIds.length > 0) {
            const placeholders = pessoaIds.map(() => '?').join(', ');
            candidateQuery += ` AND id IN (${placeholders})`;
            candidateParams.push(...pessoaIds);
        }

        if (grupoIds && grupoIds.length > 0) {
            const placeholders = grupoIds.map(() => '?').join(', ');
            candidateQuery += ` AND grupoId IN (${placeholders})`;
            candidateParams.push(...grupoIds);
        }

        const [candidates] = await connection.query(candidateQuery, candidateParams);

        if (!candidates.length) {
            connection.release();
            return res.status(404).json({ message: 'Nenhuma pessoa encontrada' });
        }

        // Buscar os nomes dos grupos para cada grupoId
        const groupQuery = 'SELECT id, nome FROM grupo_pessoa WHERE id IN (?) AND userId = ?';
        const groupIds = [...new Set(candidates.map(candidate => candidate.grupoId))];  // Remove duplicados
        const [groups] = await connection.query(groupQuery, [groupIds, userId]);

        connection.release();

        const zip = require('jszip')();
        const groupNames = {}; // Para armazenar os nomes dos grupos pelos IDs

        // Organizar os documentos por grupos
        for (const group of groups) {
            groupNames[group.id] = group.nome; // Mapear grupoId -> nome do grupo
        }

        const filesByGroup = {}; // Para armazenar os arquivos por grupo

        for (const candidate of candidates) {
            const zipDoc = new PizZip(content);
            const doc = new Docxtemplater(zipDoc, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(candidate);
            const buf = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

            // Nome do arquivo DOCX
            const nomeArquivo = `${candidate.nome}_${templateFilledFileName}.docx`;

            // Verifica o nome do grupo usando o grupoId do candidato
            const groupName = groupNames[candidate.grupoId] || 'sem_grupo';
            if (!filesByGroup[groupName]) {
                filesByGroup[groupName] = [];
            }

            // Adiciona o arquivo à pasta do grupo correspondente
            filesByGroup[groupName].push({ nome: nomeArquivo, conteudo: buf });
        }

        // Adiciona as pastas e arquivos ao arquivo ZIP
        for (const [groupName, files] of Object.entries(filesByGroup)) {
            const folder = zip.folder(groupName); // Cria uma pasta para o grupo
            for (const file of files) {
                folder.file(file.nome, file.conteudo);
            }
        }

        // Gera o ZIP
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        const now = new Date();
        const formattedDate = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="arquivos_gerados_${formattedDate}.zip"`
        );        
        return res.status(200).send(zipBuffer);
    } catch (error) {
        console.error('Erro ao gerar arquivos em lote:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

const createFilledFileEpi = async (req, res) => {
    const candidateId = req.params.idpessoa;
    const templateId = req.params.idtemplate;
    const userId = req.userId;
    const { epiIds } = req.body;

    Logmessage("Gerando arquivo da pessoa (EPIs): " + candidateId);
    Logmessage("Template com EPIs: " + templateId);

    if (!Array.isArray(epiIds) || epiIds.length === 0) {
        return res.status(400).json({ message: 'A lista de EPIs (epiIds) é obrigatória.' });
    }

    try {
        const connection = await pool.getConnection();

        // Buscar dados da pessoa
        const [candidateRows] = await connection.query(
            'SELECT * FROM pessoa WHERE id = ? AND userId = ?',
            [candidateId, userId]
        );

        // Buscar nome do template
        const [templateRows] = await connection.query(
            'SELECT nome FROM template WHERE userId = ? and id = ?',
            [userId, templateId]
        );

        // Buscar dados dos EPIs selecionados
        const placeholders = epiIds.map(() => '?').join(',');
        const [epiRows] = await connection.query(
            `SELECT * FROM epis WHERE id IN (${placeholders}) AND userId = ?`,
            [...epiIds, userId]
        );

        connection.release();

        if (!candidateRows.length) {
            return res.status(404).json({ message: 'Pessoa não encontrada ou acesso não autorizado' });
        }

        if (!templateRows.length) {
            return res.status(404).json({ message: 'Template não encontrado ou acesso não autorizado' });
        }

        if (!epiRows.length) {
            return res.status(404).json({ message: 'Nenhum EPI encontrado com os IDs fornecidos.' });
        }

        const candidate = candidateRows[0];
        const templateFileName = templateRows[0].nome;
        Logmessage("Template com EPIs utilizado: " + templateFileName);

        // Leitura do template
        const content = fs.readFileSync(path.join(__dirname, '..', 'uploads', templateFileName), 'binary');

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        Logmessage(dataToFill)
        // Injetando dados no template
        const dataToFill = {
            pessoa: candidate,
            epis: epiRows, // <- precisa estar como array no template (ex: {{#epis}}{{nome}} - {{ca}}{{/epis}})
        };

        doc.render(dataToFill);

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        res.setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token")
            .setHeader("Access-Control-Allow-Methods", "*")
            .setHeader('Content-Disposition', `attachment; filename=filled_${templateFileName}.docx`)
            .status(200).send(buf);
    } catch (error) {
        console.error('Erro ao preencher o arquivo docx com EPIs:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};



module.exports = { getTemplatesById, createFilledFile, UploadFile, uploadSingleFile, getTemplatesByUserId, deleteTemplateById, UpdateFile, createFilledFilesBatch,createFilledFileEpi };			