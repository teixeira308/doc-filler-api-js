const pool = require('../config/dbConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const {Logmessage} = require( "../helper/Tools");
dotenv.config();

createUser = async (req, res, next) => {

    try {
        Logmessage(req.body);
    
        const { email, password,status,createdAt,updatedAt,name } = req.body;
        Logmessage("Criar usuario",email)
        // Verificar se o email já está cadastrado
        const [existingUser] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).send({ message: 'Usuário já cadastrado' });
        }
    
        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Inserir o usuário no banco de dados
        const query = 'INSERT INTO user (email, name,password,status) VALUES (?,?, ?, ?)';
        const connection = await pool.getConnection();
        const results = await connection.execute(query, [email, name,hashedPassword,status]);
        connection.release();
    
        // Preparar a resposta de sucesso
        const response = {
            message: 'Usuário criado com sucesso',
            createdUser: { email }
        };
    
        // Enviar a resposta
        return res.status(201).send(response);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).send({ error: 'Erro interno do servidor' });
    }
    
};

 

Login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar o usuário no banco de dados
        // Aqui você deve ter um método para encontrar o usuário
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ errors: ['Usuário não encontrado!'] });
        }

        // Verificar a senha
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ errors: ['Senha inválida'] });
        }

        // Gerar o token com userId
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        
        );

        res.status(200).json({
            message: 'Autenticado com sucesso',
            token,
            userId: user.id
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

changeStatus = async (req, res, next) => {
    try {
        // Extrair dados do corpo da requisição
        const { id, status } = req.body;

        // Validar os dados
        if (!id || !status) {
            return res.status(400).json({ error: 'ID e status são obrigatórios.' });
        }

        // Atualizar o status do usuário no banco de dados
        const query = 'UPDATE user SET status = ? WHERE id = ?';
        const [result] = await pool.execute(query, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Responder com sucesso
        res.status(200).json({ message: 'Status atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

const findUserByEmail = async (email) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM user WHERE status="active" and email = ?', [email]);
        connection.release();

        // Retorna o primeiro usuário encontrado ou null se não encontrar nenhum
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Erro ao buscar usuário por e-mail:', error);
        throw new Error('Erro ao buscar usuário');
    }
};

module.exports = {Login, createUser ,changeStatus };