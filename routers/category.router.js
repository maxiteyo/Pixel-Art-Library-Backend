const express = require('express');
const router = express.Router();
const categoryService = require('../service/category.service');

// GET todas las categorias
router.get('/', async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET todas las categorias CON SUS SUBCATEGORIAS
router.get('/with-subcategories', async (req, res) => {
  try {
    const categoriesWithSubcategories = await categoryService.getAllCategoriesWithSubcategories();
    res.json(categoriesWithSubcategories);
  } catch (error) {
    // Log el error en el servidor para depuración
    console.error('Error al obtener categorías con subcategorías:', error);
    res.status(500).json({ message: 'Error al obtener las categorías y sus subcategorías.' });
  }
});

// GET una categoria por ID
router.get('/:id', async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST crear una nueva categoria
router.post('/', async (req, res) => {
  try {
    const newCategory = await categoryService.createCategory(req.body);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT actualizar una categoria
router.put('/:id', async (req, res) => {
  try {
    const updatedCategory = await categoryService.updateCategory(req.params.id, req.body);
    if (updatedCategory[0]) { 
      res.json({ message: 'Category updated successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE una categoria
router.delete('/:id', async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    if (result) {
      res.json({ message: 'Category deleted successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;