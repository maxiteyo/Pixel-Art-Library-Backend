const { Sale } = require('../models');

async function getAllSales() {
  return await Sale.findAll();
}

async function getSaleById(saleId) {
  return await Sale.findByPk(saleId);
}

async function createSale(data) {
  return await Sale.create(data);
}

async function updateSale(saleId, data) {
  return await Sale.update(data, { where: { saleId } });
}

async function deleteSale(saleId) {
  return await Sale.destroy({ where: { saleId } });
}

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};
