const express = require('express');
const router = express.Router();
const subcategoryService = require('../service/subcategory.service');

// GET todas las subcategorias
router.get('/', async (req, res) => {
  try {
    const subcategories = await subcategoryService.getAllSubcategories();
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET una subcategoria por ID
router.get('/:id', async (req, res) => {
  try {
    const subcategory = await subcategoryService.getSubcategoryById(req.params.id);
    if (subcategory) {
      res.json(subcategory);
    } else {
      res.status(404).json({ message: 'Subcategory not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST crear una nueva subcategoria
router.post('/', async (req, res) => {
  try {
    const newSubcategory = await subcategoryService.createSubcategory(req.body);
    res.status(201).json(newSubcategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT actualizar una subcategoria
router.put('/:id', async (req, res) => {
  try {
    const updatedSubcategory = await subcategoryService.updateSubcategory(req.params.id, req.body);
    if (updatedSubcategory[0]) {
      res.json({ message: 'Subcategory updated successfully' });
    } else {
      res.status(404).json({ message: 'Subcategory not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE una subcategoria
router.delete('/:id', async (req, res) => {
  try {
    const result = await subcategoryService.deleteSubcategory(req.params.id);
    if (result) {
      res.json({ message: 'Subcategory deleted successfully' });
    } else {
      res.status(404).json({ message: 'Subcategory not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;