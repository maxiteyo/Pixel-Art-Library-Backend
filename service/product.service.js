const { Product } = require('../models');

async function getAllProducts() {
  return await Product.findAll();
}

async function getProductById(productId) {
  return await Product.findByPk(productId);
}

async function createProduct(data) {
  return await Product.create(data);
}

async function updateProduct(productId, data) {
  return await Product.update(data, { where: { productId } });    
}

async function deleteProduct(productId) {
  return await Product.destroy({ where: { productId } });
}

async function getProductsByCategory(category) {
  return await Product.findAll({ where: { category } });
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
};
