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

router.get('/bysubcategory/:subcategoryId', async (req, res) => {
  try {
    const subcategoryId = parseInt(req.params.subcategoryId, 10);
    if (isNaN(subcategoryId)) {
      return res.status(400).json({ message: 'El ID de la subcategoría debe ser un número.' });
    }

    const products = await productService.getProductsBySubcategoryId(subcategoryId);
    
    if (products && products.length > 0) {
      res.json(products);
    } else {
      // Si la subcategoría no existe (según la lógica opcional en el servicio) o no tiene productos
      res.status(404).json({ message: 'No se encontraron productos para esta subcategoría o la subcategoría no existe.' });
    }
  } catch (error) {
    console.error("Error en la ruta GET /products/bysubcategory/:subcategoryId :", error);
    res.status(500).json({ message: 'Error al obtener los productos por subcategoría.', error: error.message });
  }
});

router.get('/', async (req, res) => {
  const products = await productService.getAllProducts();
  res.json(products);
});

router.get('/star', async (req, res) => {
  try {
    // Obtener parámetros de paginación de la query string
    // Establecer valores por defecto si no se proporcionan
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 4; // Traer de a 4 por defecto

    if (page <= 0) {
      return res.status(400).json({ message: 'El número de página debe ser positivo.' });
    }
    if (limit <= 0) {
      return res.status(400).json({ message: 'El límite de productos por página debe ser positivo.' });
    }

    const paginatedResults = await productService.getStarProducts(page, limit);

    if (paginatedResults && paginatedResults.products && paginatedResults.products.length > 0) {
      res.json(paginatedResults);
    } else if (paginatedResults && paginatedResults.totalItems === 0) {
      // Si no hay productos estrella en total
      res.status(404).json({ message: 'No se encontraron productos estrella.' });
    } else {
      res.json(paginatedResults); // Devuelve el objeto con products: [] y la info de paginación
    }
  } catch (error) {
    console.error("Error en la ruta GET /products/star:", error);
    res.status(500).json({ message: 'Error al obtener los productos estrella.', error: error.message });
  }
}); //Para probar: http://localhost:3000/products/star?page=1&limit=4
// Obtener la primera pagina de productos estrella con un límite de 4 productos por página

// Se espera un parámetro de consulta, ej: /products/search?name=Lapiz
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.name; // O podrías usar req.query.q o req.query.term

    if (!searchTerm) {
      return res.status(400).json({ message: 'Por favor, proporciona un término de búsqueda en el parámetro "name".' });
    }

    const products = await productService.searchProductsByName(searchTerm);

    if (products && products.length > 0) {
      res.json(products);
    } else {
      res.status(404).json({ message: `No se encontraron productos que coincidan con "${searchTerm}".` });
    }
  } catch (error) {
    console.error("Error en la ruta GET /products/search:", error);
    res.status(500).json({ message: 'Error al buscar productos.', error: error.message });
  }
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

router.put('/:productId', upload.single('image'), async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ message: 'El ID del producto debe ser un número.' });
    }

    // Convertir campos numéricos y booleanos de req.body
    // Es importante hacer esto incluso si no todos los campos vienen en cada actualización.
    // Si un campo no viene, req.body.campo será undefined, y parseInt(undefined) es NaN.
    // El servicio debería manejar los campos undefined o puedes filtrarlos aquí.
    const productDataToUpdate = {};

    // Campos de texto (se copian si existen)
    if (req.body.name !== undefined) productDataToUpdate.name = req.body.name;
    if (req.body.brand !== undefined) productDataToUpdate.brand = req.body.brand;
    if (req.body.color !== undefined) productDataToUpdate.color = req.body.color;
    if (req.body.description !== undefined) productDataToUpdate.description = req.body.description;
    
    // Campo de imagen: si se envía 'image' como una cadena vacía o null,
    // se interpretará como una solicitud para eliminar la imagen existente.
    // Si se sube un nuevo archivo, req.file tendrá precedencia.
    // Si no se envía 'image' en req.body y no se sube archivo, la imagen no se toca (a menos que el servicio lo maneje diferente).
    if (req.body.image !== undefined) productDataToUpdate.image = req.body.image;


    // Campos numéricos (se convierten si existen)
    if (req.body.subcategoryId !== undefined) {
      productDataToUpdate.subcategoryId = parseInt(req.body.subcategoryId, 10);
      if (isNaN(productDataToUpdate.subcategoryId)) return res.status(400).json({ message: 'subcategoryId inválido.' });
    }
    if (req.body.price !== undefined) {
      productDataToUpdate.price = parseFloat(req.body.price);
      if (isNaN(productDataToUpdate.price)) return res.status(400).json({ message: 'price inválido.' });
    }
    if (req.body.stock !== undefined) {
      productDataToUpdate.stock = parseInt(req.body.stock, 10);
      if (isNaN(productDataToUpdate.stock)) return res.status(400).json({ message: 'stock inválido.' });
    }

    // Campo booleano (se convierte si existe)
    if (req.body.starProduct !== undefined) {
      productDataToUpdate.starProduct = req.body.starProduct === 'true' || req.body.starProduct === true;
    }
    
    // req.file es el nuevo archivo 'image' si se subió uno
    const updatedProduct = await productService.updateProduct(productId, productDataToUpdate, req.file);

    if (!updatedProduct) { // Si el servicio devuelve null o undefined porque no encontró el producto
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error(`Error en la ruta PUT /products/${req.params.productId}:`, error);
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    // Manejar otros errores específicos si es necesario
    res.status(500).json({ message: 'Error al actualizar el producto.', error: error.message });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ message: 'El ID del producto debe ser un número.' });
    }

    const result = await productService.deleteProduct(productId);

    // Asumiendo que si no hay error, se eliminó (o el error 'Producto no encontrado' se lanzó)
    res.status(200).json({ message: result.message || 'Producto eliminado exitosamente.' }); // O simplemente res.sendStatus(204) para No Content

  } catch (error) {
    console.error(`Error en la ruta DELETE /products/${req.params.productId}:`, error);
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al eliminar el producto.', error: error.message });
  }
});

module.exports = router;

