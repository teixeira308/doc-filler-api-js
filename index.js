const express = require('express');
const app = express();
const pessoaRoutes = require('./routes/pessoaRoutes');
const fileUploadRoutes = require('./routes/fileUploadRoutes');
const userRoute = require('./routes/userRoutes');
const cors = require('cors');


// Middleware para analisar o corpo das solicitações e habilitar CORS
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001', // Substitua pelo domínio do seu frontend
  credentials: true // Habilita o envio de cookies e cabeçalhos de autenticação
}));

// Middleware de roteamento para os candidatos e outras rotas
app.use('/v1', pessoaRoutes);
app.use('/v1', fileUploadRoutes);
app.use('/v1/users', userRoute);

app.use(express.urlencoded({
    extended: true
  }))

// Define os cabeçalhos CORS manualmente não é mais necessário

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});