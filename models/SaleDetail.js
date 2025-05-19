module.exports = (sequelize, DataTypes) => {
  const SaleDetail = sequelize.define('SaleDetail', {
    saledetailId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    saleId: {
      type: DataTypes.INTEGER,
      foreignkey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      foreignkey: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unityprice: { //precio por unidad de producto (quizas podria poner el subtotal)
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
  return SaleDetail;
};
