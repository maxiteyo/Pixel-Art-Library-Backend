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
const Category = require('./Category')(sequelize, DataTypes);
const Subcategory = require('./Subcategory')(sequelize, DataTypes);
const Cart = require('./Cart')(sequelize, DataTypes);
const CartProduct = require('./CartProduct')(sequelize, DataTypes); 

// Relaciones
User.hasMany(Sale, { foreignKey: 'userId' });
Sale.belongsTo(User, { foreignKey: 'userId', as: 'User' });

User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });

//Se usa la tabla intermedia CartProduct para la relación muchos a muchos entre Cart y Product
Cart.belongsToMany(Product, { through: 'CartProduct', foreignKey: 'cartId' });
Product.belongsToMany(Cart, { through: 'CartProduct', foreignKey: 'productId' });

Sale.hasMany(SaleDetail, { foreignKey: 'saleId' });
SaleDetail.belongsTo(Sale, { foreignKey: 'saleId' });

Product.hasMany(SaleDetail, { foreignKey: 'productId' });
SaleDetail.belongsTo(Product, { foreignKey: 'productId' });

Subcategory.hasMany(Product, { foreignKey: 'subcategoryId' });
Product.belongsTo(Subcategory, { foreignKey: 'subcategoryId' });

Category.hasMany(Subcategory, { foreignKey: 'categoryId' });
Subcategory.belongsTo(Category, { foreignKey: 'categoryId' });

module.exports = {
  sequelize,
  User,
  Product,
  Sale,
  SaleDetail,
  Category,
  Subcategory,
  Cart,
  CartProduct
};

