import { DataTypes } from 'sequelize';
import database from '../infra/database.js';

const Pessoa = database.define('pessoas', {
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    telefone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    endereco: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    data_nascimento: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

await Pessoa.sync();

export default Pessoa;