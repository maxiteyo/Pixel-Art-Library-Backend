const { Product, Subcategory } = require('../models');
const cloudinary = require('../config/cloudinary.config');
const fs = require('fs'); // File system para borrar el archivo local después de subirlo
const { Op } = require('sequelize');

async function getAllProducts() {
  return await Product.findAll();
}

async function getProductById(productId) {
  return await Product.findByPk(productId);
}

async function createProductWithImageUpload(productData, imageFile) {
  try {
    let imageUrl = productData.image || null; // Permite una URL de imagen preexistente o por defecto

    if (imageFile) {
      // Subir imagen a Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'pixel_art_products', // Carpeta opcional en Cloudinary
      });
      imageUrl = uploadResult.secure_url;

      // Borrar el archivo local después de subirlo a Cloudinary
      // (Multer guarda el archivo temporalmente en el servidor)
      fs.unlinkSync(imageFile.path);
    }

    const productToCreate = {
      ...productData,
      image: imageUrl, // Actualiza/establece la URL de la imagen
    };
    return await Product.create(productToCreate);
  } catch (error) {
    console.error("Error creating product with image upload:", error);
    // Si el archivo fue subido y hubo un error guardando en DB,
    // Esto requiere guardar el public_id de la imagen de Cloudinary.
    // Por ahora, solo relanzamos el error.
    if (imageFile && imageFile.path && fs.existsSync(imageFile.path)) {
        // Intenta borrar el archivo local si aún existe y algo falló
        fs.unlinkSync(imageFile.path);
    }
    throw error;
  }
}

async function getProductsBySubcategoryId(subcategoryId) {
  // Primero, podrías verificar si la subcategoría existe (opcional, pero buena práctica)
  const subcategoryExists = await Subcategory.findByPk(subcategoryId);
  if (!subcategoryExists) {
    // Puedes lanzar un error o devolver un array vacío/mensaje específico
    // throw new Error('Subcategory not found'); 
    return []; // O devolver vacío si prefieres que el router maneje el 404 si no hay productos
  }

  return await Product.findAll({
    where: { subcategoryId: subcategoryId },
    include: [
      {
        model: Subcategory, // Opcional: para incluir los detalles de la subcategoría con cada producto
        // attributes: ['name'] // Opcional: para seleccionar solo ciertos atributos de la subcategoría
      }
      // Podrías incluir otros modelos relacionados con Product si es necesario
    ]
  });
}

async function getStarProducts() {
  return await Product.findAll({
    where: { starProduct: true },
    include: [ // Opcional: Incluir subcategoría u otros modelos si es necesario
      {
        model: Subcategory,
        // attributes: ['name'] 
      }
    ]
  });
}

async function searchProductsByName(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return []; // Devuelve vacío si no hay término de búsqueda o está vacío
  }
  return await Product.findAll({
    where: {
      name: {
        [Op.like]: `%${searchTerm}%` // Op.like para búsqueda insensible a mayúsculas/minúsculas
      }
    },
    include: [ 
      {
        model: Subcategory,
      }
    ]
  });
}

async function updateProduct(productId, data) {
  return await Product.update(data, { where: { productId } });    
}

async function deleteProduct(productId) {
  return await Product.destroy({ where: { productId } });
}

async function getProductsByCategory(category) {
  return await Product.findAll({ where: { category } });
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct: createProductWithImageUpload,
  // Renombrado para reflejar que ahora maneja la subida de imágenes
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsBySubcategoryId,
  getStarProducts,
  searchProductsByName
};
