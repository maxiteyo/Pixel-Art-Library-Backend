const express = require('express');
const router = express.Router();
const { Sale } = require('../models');

router.get('/', async (req, res) => {
  const sales = await Sale.findAll();
  res.json(sales);
});

router.get('/:salesId', async (req, res) => {
  const sale = await Sale.findByPk(req.params.salesId);
  if (sale) res.json(sale);
  else res.status(404).json({ message: 'Venta no encontrada' });
});

router.post('/', async (req, res) => {
  try {
    const newSale = await Sale.create(req.body);
    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:salesId', async (req, res) => {
  await Sale.update(req.body, { where: { salesId: req.params.salesId } });
  res.json({ message: 'Venta actualizada' });
});

router.delete('/:salesId', async (req, res) => {
  await Sale.destroy({ where: { salesId: req.params.salesId } });
  res.status(204).send();
});

module.exports = router;
