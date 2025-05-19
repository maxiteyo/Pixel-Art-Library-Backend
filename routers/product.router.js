const express = require('express');
const router = express.Router();
const { Product } = require('../models');

// Obtener todos los productos
router.get('/', async (req, res) => {
  const products = await Product.findAll();
  res.json(products);
});

// Obtener un producto por ID
router.get('/:productId', async (req, res) => {
  const product = await Product.findByPk(req.params.productId);
  if (product) res.json(product);
  else res.status(404).json({ message: 'Producto no encontrado' });
});

// Crear un producto
router.post('/', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar un producto
router.put('/:productId', async (req, res) => {
  await Product.update(req.body, {
    where: { productId: req.params.productId }
  });
  res.json({ message: 'Producto actualizado' });
});

// Eliminar un producto
router.delete('/:productId', async (req, res) => {
  await Product.destroy({ where: { productId: req.params.productId } });
  res.status(204).send();
});

module.exports = router;
