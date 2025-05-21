const express = require('express');
const router = express.Router();
const saleDetailService = require('../service/saleDetail.service');

router.get('/sale/:saleId', (req, res) => saleDetailService.getDetailsBySaleId(req, res));
router.post('/', (req, res) => saleDetailService.addDetailToSale(req, res));
router.put('/:saledetailId', (req, res) => saleDetailService.updateDetail(req, res));
router.delete('/:saledetailId', (req, res) => saleDetailService.removeDetail(req, res));

module.exports = router;
