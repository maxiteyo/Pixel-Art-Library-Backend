const { Product, Subcategory, sequelize } = require('../models');
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

async function getStarProducts(page = 1, limit = 4) { // Valores por defecto para page y limit
  try {
    const offset = (page - 1) * limit;

    // Usamos findAndCountAll para obtener los productos y el conteo total para la paginación
    const { count, rows } = await Product.findAndCountAll({
      where: { starProduct: true },
      include: [
        {
          model: Subcategory,
          // attributes: ['name'] // Descomenta si solo quieres ciertos atributos
        }
      ],
      limit: parseInt(limit, 10), // Asegurar que limit sea un número
      offset: parseInt(offset, 10), // Asegurar que offset sea un número
      order: [['productId', 'ASC']], // Opcional: define un orden para la paginación consistente
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      products: rows,
    };
  } catch (error) {
    console.error("Error al obtener productos estrella con paginación:", error);
    throw error;
  }
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

async function updateProduct(productId, productData, newImageFile) {
  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Producto no encontrado'); // O devolver null/un objeto de error específico
    }

    let newImageUrl = product.image; // Conservar la imagen existente por defecto

    // Si se proporciona un nuevo archivo de imagen
    if (newImageFile) {
      // 1. Subir la nueva imagen a Cloudinary
      const uploadResult = await cloudinary.uploader.upload(newImageFile.path, {
        folder: 'pixel_art_products',
      });
      newImageUrl = uploadResult.secure_url;

      // 2. Borrar el archivo local temporal de la nueva imagen
      fs.unlinkSync(newImageFile.path);

      // 3. (Opcional pero recomendado) Borrar la imagen antigua de Cloudinary si existía
      if (product.image) {
        // Esto es una simplificación; una extracción robusta del public_id podría ser más compleja.
        const oldPublicIdWithFolder = product.image.split('/').slice(-2).join('/').split('.')[0];
        if (oldPublicIdWithFolder) {
          try {
            await cloudinary.uploader.destroy(oldPublicIdWithFolder);
            console.log(`Imagen antigua '${oldPublicIdWithFolder}' eliminada de Cloudinary.`);
          } catch (cloudinaryError) {
            console.error("Error al eliminar la imagen antigua de Cloudinary:", cloudinaryError);
            // No detener la actualización del producto por esto, pero sí registrar el error.
          }
        }
      }
    } else if (productData.image === null || productData.image === '') {
      // Si se envía explícitamente image como null o vacío, y no hay newImageFile,
      // significa que el admin quiere eliminar la imagen existente sin reemplazarla.
      if (product.image) {
        const oldPublicIdWithFolder = product.image.split('/').slice(-2).join('/').split('.')[0];
        if (oldPublicIdWithFolder) {
          try {
            await cloudinary.uploader.destroy(oldPublicIdWithFolder);
            console.log(`Imagen antigua '${oldPublicIdWithFolder}' eliminada de Cloudinary (solicitado por el usuario).`);
          } catch (cloudinaryError) {
            console.error("Error al eliminar la imagen antigua de Cloudinary:", cloudinaryError);
          }
        }
      }
      newImageUrl = null; // Establecer la imagen como null en la BD
    }
    // Si no se proporciona newImageFile y productData.image no es explícitamente null/vacío,
    // se conserva la imagen existente (newImageUrl ya tiene product.image).

    // Actualizar los campos del producto
    // Asegúrate de que productData contenga los campos que quieres actualizar.
    // Los campos que no estén en productData no se modificarán (si usas product.update).
    const updatedProductData = {
      ...productData, // Los campos de texto y numéricos ya convertidos desde el router
      image: newImageUrl, // La URL de la nueva imagen o la existente o null
    };

    // Eliminar campos que no deben actualizarse directamente o que son undefined
    // Por ejemplo, si productData puede venir con campos extra que no son del modelo.
    Object.keys(updatedProductData).forEach(key => {
      if (updatedProductData[key] === undefined) {
        delete updatedProductData[key];
      }
    });
    
    await product.update(updatedProductData);
    return product; // Devuelve el producto actualizado

  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    // Si se subió un archivo nuevo pero falló después, hay que borrarlo
    if (newImageFile && newImageFile.path && fs.existsSync(newImageFile.path)) {
      try {
        fs.unlinkSync(newImageFile.path);
        console.log("Archivo local temporal de nueva imagen eliminado después de un error.");
      } catch (unlinkErr) {
        console.error("Error al eliminar archivo local temporal tras error en actualización:", unlinkErr);
      }
    }
    throw error; // Relanzar para que el router lo maneje
  }
}

async function deleteProduct(productId) {
  try {
    const product = await Product.findByPk(productId);

    if (!product) {
      // Por consistencia con updateProduct, lanzaremos un error.
      throw new Error('Producto no encontrado');
    }

    // 1. (Opcional pero recomendado) Borrar la imagen de Cloudinary si existía
    if (product.image) {
      // Extraer el public_id de la URL de Cloudinary
      // (Asegúrate de que esta lógica de extracción sea correcta para tus URLs)
      const publicIdWithFolder = product.image.split('/').slice(-2).join('/').split('.')[0];
      if (publicIdWithFolder) {
        try {
          await cloudinary.uploader.destroy(publicIdWithFolder);
          console.log(`Imagen '${publicIdWithFolder}' eliminada de Cloudinary para el producto ${productId}.`);
        } catch (cloudinaryError) {
          console.error(`Error al eliminar la imagen '${publicIdWithFolder}' de Cloudinary:`, cloudinaryError);
          // Decide si quieres detener la eliminación del producto por esto.
          // Generalmente, es mejor continuar y eliminar el producto de la BD,
          // pero registrar el error de Cloudinary.
        }
      }
    }

    // 2. Eliminar el producto de la base de datos
    await product.destroy();

    // Devolver un booleano o un objeto con un mensaje es común.
    return { deleted: true, message: 'Producto eliminado exitosamente.' }; // O simplemente true

  } catch (error) {
    console.error(`Error al eliminar el producto con ID ${productId}:`, error);
    throw error; // Relanzar para que el router lo maneje
  }
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
