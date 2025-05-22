const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Importa modelos
const User = require('./User')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const Sale = require('./Sale')(sequelize, DataTypes);
const SaleDetail = require('./SaleDetail')(sequelize, DataTypes);

// Relaciones
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