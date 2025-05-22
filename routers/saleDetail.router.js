const express = require('express');
const router = express.Router();
const saleDetailService = require('../service/saleDetail.service');

router.get('/', async (req, res) => {
  const details = await saleDetailService.getAllSaleDetails();
  res.json(details);
});

router.get('/:detailId', async (req, res) => {
  const detail = await saleDetailService.getSaleDetailById(req.params.detailId);
  res.json(detail);
});

router.post('/', async (req, res) => {
  const newDetail = await saleDetailService.createSaleDetail(req.body);
  res.status(201).json(newDetail);
});

router.put('/:detailId', async (req, res) => {
  const updated = await saleDetailService.updateSaleDetail(req.params.detailId, req.body);
  res.json(updated);
});

router.delete('/:detailId', async (req, res) => {
  const deleted = await saleDetailService.deleteSaleDetail(req.params.detailId);
  res.json({ deleted });
});

module.exports = router;

