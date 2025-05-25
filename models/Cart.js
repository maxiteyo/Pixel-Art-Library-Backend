module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    cartId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userId'
      }
    }
  });
  return Cart;
};