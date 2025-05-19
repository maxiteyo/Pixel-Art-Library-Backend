// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,     // nombre de la base
  process.env.DB_USER,     // usuario
  process.env.DB_PASSWORD, // contraseña
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false // true si querés ver las queries
  }
);

module.exports = sequelize;
