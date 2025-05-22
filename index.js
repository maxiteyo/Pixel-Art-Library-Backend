const express = require('express');
require('dotenv').config();
const app = express();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
  },

);



// Import models

const { User, Product, Sale, SaleDetail } = require('./models');

// Middleware
app.use(express.json());

// Importar routers
const productRouter = require('./routers/product.router');
const userRouter = require('./routers/user.router');
const saleRouter = require('./routers/sale.router');
const saleDetailRouter = require('./routers/saleDetail.router');

// Usar routers
app.use('/products', productRouter);
app.use('/users', userRouter);
app.use('/sales', saleRouter);
app.use('/sale-details', saleDetailRouter);

sequelize.sync({force:true}).then(() => {
  app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
  });
});
