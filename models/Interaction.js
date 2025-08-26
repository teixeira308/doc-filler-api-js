import { DataTypes } from 'sequelize';
import database from '../config/dbConfig.js';

const Interaction = database.define('interactions', {
  personId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  epiIds: {
    type: DataTypes.JSON,
    allowNull: true,
  },
});

await Interaction.sync();

export default Interaction;
