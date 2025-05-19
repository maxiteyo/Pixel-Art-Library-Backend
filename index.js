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
const User = require('./models/User')(sequelize, DataTypes);
const Product = require('./models/Product')(sequelize, DataTypes);
const Sale = require('./models/Sale')(sequelize, DataTypes);
const SaleDetail = require('./models/SaleDetail')(sequelize, DataTypes);

// Relacionar modelos
User.hasMany(Sale, { foreignKey: 'userId' });
Sale.belongsTo(User, { foreignKey: 'userId' });

Sale.hasOne(SaleDetail);
SaleDetail.belongsTo(Sale);

Product.hasMany(SaleDetail);
SaleDetail.belongsTo(Product);

module.exports = {
  sequelize,
  User,
  Product,
  Sale,
  SaleDetail,
};

// Middleware
app.use(express.json());

// Agregar routers después

app.post('/product', (req, res) => {
    console.log(req.body);
    res.status(201).json({ message: 'Producto recibido', data: req.body });
});

sequelize.sync({force:true}).then(() => {
  app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
  });
});
