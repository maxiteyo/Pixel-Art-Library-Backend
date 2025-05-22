const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
  }
);

// Importar definiciones
const User = require('./User')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const Sale = require('./Sale')(sequelize, DataTypes);
const SaleDetail = require('./SaleDetail')(sequelize, DataTypes);

// Definir relaciones
User.hasMany(Sale, { foreignKey: 'userId' });
Sale.belongsTo(User, { foreignKey: 'userId' });

Sale.hasOne(SaleDetail);
SaleDetail.belongsTo(Sale);

Product.hasMany(SaleDetail);
SaleDetail.belongsTo(Product);

// Exportar
module.exports = {
  sequelize,
  User,
  Product,
  Sale,
  SaleDetail
};

