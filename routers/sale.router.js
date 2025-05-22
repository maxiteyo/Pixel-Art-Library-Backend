const express = require('express');
const router = express.Router();
const saleService = require('../service/sale.service');

router.get('/', async (req, res) => {
  const sales = await saleService.getAllSales();
  res.json(sales);
});

router.get('/:saleId', async (req, res) => {
  const sale = await saleService.getSaleById(req.params.saleId);
  res.json(sale);
});

router.post('/', async (req, res) => {
  const newSale = await saleService.createSale(req.body);
  res.status(201).json(newSale);
});

router.put('/:saleId', async (req, res) => {
  const updated = await saleService.updateSale(req.params.saleId, req.body);
  res.json(updated);
});

router.delete('/:saleId', async (req, res) => {
  const deleted = await saleService.deleteSale(req.params.saleId);
  res.json({ deleted });
});

module.exports = router;

