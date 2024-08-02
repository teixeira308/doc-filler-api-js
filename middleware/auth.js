
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // Se não houver token, retorne 401

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Se o token for inválido, retorne 403

        req.userId = user.userId; // Extraia o userId e adicione ao req
        next();
    });
};

module.exports = { authenticateToken };