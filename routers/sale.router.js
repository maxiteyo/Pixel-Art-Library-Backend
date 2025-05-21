const express = require('express');
const router = express.Router();
const saleService = require('../service/sale.service');

router.get('/', (req, res) => saleService.getAllSales(req, res));
router.get('/:salesId', (req, res) => saleService.getSaleById(req, res));
router.post('/', (req, res) => saleService.createSale(req, res));
router.put('/:salesId', (req, res) => saleService.updateSale(req, res));
router.delete('/:salesId', (req, res) => saleService.cancelSale(req, res));

module.exports = router;
