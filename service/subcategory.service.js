const { Subcategory, Category } = require('../models'); // Category puede ser útil para validaciones o includes

async function getAllSubcategories() {
  return await Subcategory.findAll({ include: Category }); // Opcional: incluir la categoria padre
}

async function getSubcategoryById(subcategoryId) {
  return await Subcategory.findByPk(subcategoryId, { include: Category });
}

async function createSubcategory(data) {
  // Validar que categoryId existe podría ser una buena adición
  return await Subcategory.create(data);
}

async function updateSubcategory(subcategoryId, data) {
  return await Subcategory.update(data, { where: { subcategoryId } });
}

async function deleteSubcategory(subcategoryId) {
  return await Subcategory.destroy({ where: { subcategoryId } });
}

module.exports = {
  getAllSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};