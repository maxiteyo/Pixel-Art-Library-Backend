const { Category, Subcategory } = require('../models');

async function getAllCategories() {
  return await Category.findAll();
}

async function getCategoryById(categoryId) {
  return await Category.findByPk(categoryId);
}

async function createCategory(data) {
  return await Category.create(data);
}

async function updateCategory(categoryId, data) {
  return await Category.update(data, { where: { categoryId } });
}

async function deleteCategory(categoryId) {
  return await Category.destroy({ where: { categoryId } });
}

async function getAllCategoriesWithSubcategories() {
  return await Category.findAll({
    include: [{
      model: Subcategory,
      as: 'Subcategories' 
    }]
  });
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesWithSubcategories
};