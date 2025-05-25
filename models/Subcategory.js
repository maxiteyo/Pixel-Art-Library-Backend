module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Subcategory', {
    subcategoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'categoryId'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Category;
}