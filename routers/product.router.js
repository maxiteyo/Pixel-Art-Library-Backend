const express = require('express');
const router = express.Router();
const productService = require('../service/product.service');
const multer = require('multer');
const path = require('path');

// Configuración de Multer
// Define dónde se guardarán temporalmente los archivos subidos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Crea un nombre de archivo único para evitar colisiones
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB para el archivo (opcional)
  fileFilter: function (req, file, cb) {
    // Filtra para aceptar solo ciertos tipos de imágenes (opcional)
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: ¡El tipo de archivo no está permitido! Solo se permiten imágenes (jpeg, jpg, png, gif, webp).");
  }
});

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

// POST para crear un producto (ahora con carga de imagen)
// Asume que el campo del formulario para la imagen se llama 'image'
// Deberías proteger esta ruta para que solo administradores puedan usarla (ej. con un middleware de autenticación/autorización)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // req.file es el archivo 'image'
    // req.body contendrá los campos de texto
    
    // Convertir campos numéricos y booleanos, ya que multipart/form-data los envía como strings
    const productData = {
      ...req.body,
      subcategoryId: parseInt(req.body.subcategoryId, 10),
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock, 10),
      starProduct: req.body.starProduct === 'true' || req.body.starProduct === true || false,
    };

    // Si no se sube una imagen, req.file será undefined. El servicio lo manejará.
    const newProduct = await productService.createProduct(productData, req.file);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error en la ruta POST /products:", error);
    // Si multer generó un error (ej. tipo de archivo no permitido), puede que ya haya respondido.
    // Si el error es de Cloudinary o de la base deatos:
    if (error.message && error.message.includes("File type not allowed")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al crear el producto.', error: error.message });
  }
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

