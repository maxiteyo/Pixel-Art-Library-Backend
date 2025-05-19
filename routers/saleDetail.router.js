const express = require('express');
const router = express.Router();
const { SaleDetail } = require('../models');

router.get('/', async (req, res) => {
  const details = await SaleDetail.findAll();
  res.json(details);
});

router.get('/:saledetailId', async (req, res) => {
  const detail = await SaleDetail.findByPk(req.params.saledetailId);
  if (detail) res.json(detail);
  else res.status(404).json({ message: 'Detalle no encontrado' });
});

router.post('/', async (req, res) => {
  try {
    const newDetail = await SaleDetail.create(req.body);
    res.status(201).json(newDetail);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:saledetailId', async (req, res) => {
  await SaleDetail.update(req.body, {
    where: { saledetailId: req.params.saledetailId }
  });
  res.json({ message: 'Detalle actualizado' });
});

router.delete('/:saledetailId', async (req, res) => {
  await SaleDetail.destroy({ where: { saledetailId: req.params.saledetailId } });
  res.status(204).send();
});

module.exports = router;
