const express = require('express');
const router = express.Router();
const productService = require('../service/product.service');

router.get('/', (req, res) => productService.getAllProducts(req, res));
router.get('/:productId', (req, res) => productService.getProductById(req, res));
router.get('/:category', (req, res) => productService.getProductsByCategory(req, res));
router.post('/', (req, res) => productService.createProduct(req, res));
router.put('/:productId', (req, res) => productService.updateProduct(req, res));
router.delete('/:productId', (req, res) => productService.deleteProduct(req, res));

module.exports = router;
