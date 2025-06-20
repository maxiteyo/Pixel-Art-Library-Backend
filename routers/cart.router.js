const express = require('express');
const router = express.Router();
const cartService = require('../service/cart.service');
const verifyToken = require('../middlewares/auth.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(verifyToken); // Aplica a todas las rutas del carrito

// GET carrito del usuario
router.get('/', async (req, res) => { 
  try {
    const userId = req.user.id; // CORREGIDO: Usar req.user.id
    const cart = await cartService.getCartByUserId(userId);
    res.json(cart);
  } catch (error) {
    console.error('Error en GET /cart:', error.message);
    if (error.message === 'Usuario no encontrado') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Fallo al obtener el carrito.' });
  }
});

// POST agregar producto al carrito 
router.post('/add', async (req, res) => {
  try {
    const userId = req.user.id; // CORREGIDO: Usar req.user.id
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined ) { 
        return res.status(400).json({ message: 'productId y quantity son requeridos.' });
    }
    const cart = await cartService.addProductToCart(userId, productId, quantity);
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error en POST /cart/add:', error.message);
    if (error.message.includes('No hay suficiente stock') || error.message.includes('La cantidad debe ser')) {
        return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Producto no encontrado' || error.message === 'Usuario no encontrado') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Fallo al añadir el producto al carrito.' });
  }
});

// PUT actualizar cantidad de producto en el carrito 
router.put('/update', async (req, res) => {
  try {
    const userId = req.user.id; // CORREGIDO: Usar req.user.id
    const { productId, quantity } = req.body;
     if (!productId || quantity === undefined) {
        return res.status(400).json({ message: 'productId y quantity son requeridos.' });
    }
    const cart = await cartService.updateProductQuantityInCart(userId, productId, quantity);
    res.json(cart);
  } catch (error) {
    console.error('Error in PUT /cart/update:', error.message);
    if (error.message.includes('No hay suficiente stock') || error.message.includes('Producto no encontrado en el carrito') || error.message.includes('Quantity must be')) {
        return res.status(400).json({ message: error.message });
    }
     if (error.message === 'Producto no encontrado' || error.message === 'Carrito no encontrado para el usuario.') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Fallo al actualizar producto en el carrito.' });
  }
});

// Actualizar el carrito completo (sincronización)
router.put('/sync', verifyToken ,async (req, res) => {
  try {
    const userId = req.user.id;
    const { products } = req.body; // Esperamos un array de { productId, quantity }

    if (!Array.isArray(products)) {
      return res.status(400).json({ message: 'El formato de los productos es inválido.' });
    }

    await cartService.syncCart(userId, products);
    res.status(200).json({ message: 'Carrito actualizado correctamente.' });

  } catch (error) {
    console.error("Error al sincronizar el carrito:", error);
    res.status(500).json({ message: 'Error interno al actualizar el carrito.' });
  }
});

// DELETE remover producto del carrito
router.delete('/remove', async (req, res) => {
  try {
    const userId = req.user.id; // CORREGIDO: Usar req.user.id
    const { productId } = req.body; 
    if (!productId) {
        return res.status(400).json({ message: 'productId es requerido.' });
    }
    const cart = await cartService.removeProductFromCart(userId, productId);
    res.json(cart);
  } catch (error) {
    console.error('Error in DELETE /cart/remove:', error.message);
    if (error.message.includes('no encontrado en el carrito') || error.message === 'Producto no encontrado' || error.message === 'Carrito no encontrado para el usuario.') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Fallo al eliminar el producto del carrito.' });
  }
});

module.exports = router;