const { SaleDetail } = require('../models');

async function getAllSaleDetails() {
  return await SaleDetail.findAll();
}

async function getSaleDetailById(detailId) {
  return await SaleDetail.findByPk(detailId);
}

async function createSaleDetail(data) {
  return await SaleDetail.create(data);
}

async function updateSaleDetail(detailId, data) {
  return await SaleDetail.update(data, { where: { detailId } });
}

async function deleteSaleDetail(detailId) {
  return await SaleDetail.destroy({ where: { detailId } });
}

module.exports = {
  getAllSaleDetails,
  getSaleDetailById,
  createSaleDetail,
  updateSaleDetail,
  deleteSaleDetail,
};
