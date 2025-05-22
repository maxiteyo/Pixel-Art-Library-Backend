const express = require('express');
const router = express.Router();
const productService = require('../service/product.service');

router.get('/', async (req, res) => {
  const products = await productService.getAllProducts();
  res.json(products);
});

router.get('/:productId', async (req, res) => {
  const product = await productService.getProductById(req.params.productId);
  res.json(product);
});

router.get('/category/:category', async (req, res) => {
  const products = await productService.getProductsByCategory(req.params.category);
  res.json(products);
});

router.post('/', async (req, res) => {
  const newProduct = await productService.createProduct(req.body);
  res.status(201).json(newProduct);
});

router.put('/:productId', async (req, res) => {
  const updated = await productService.updateProduct(req.params.productId, req.body);
  res.json(updated);
});

router.delete('/:productId', async (req, res) => {
  const deleted = await productService.deleteProduct(req.params.productId);
  res.json({ deleted });
});

module.exports = router;

