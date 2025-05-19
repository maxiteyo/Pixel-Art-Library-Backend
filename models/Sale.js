const { FOREIGNKEYS } = require("sequelize/lib/query-types");

module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    salesId:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    /*userId: {
      type: DataTypes.INTEGER,
      foreignkey: true,
      autoincrement: true,
    },*/
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  });
  return Sale;
};
