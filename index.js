const express = require('express');
require('dotenv').config();
const app = express();
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
app.use(cors());

const { sequelize, User, Product, Sale, SaleDetail } = require('./models'); // trae todo ya armado

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
