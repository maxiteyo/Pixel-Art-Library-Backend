const { Product } = require('../models');
const cloudinary = require('../config/cloudinary.config');
const fs = require('fs'); // File system para borrar el archivo local después de subirlo


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
};
