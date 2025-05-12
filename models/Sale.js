module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    userId: DataTypes.INTEGER,
    date: DataTypes.DATE,
  });
  return Sale;
};
