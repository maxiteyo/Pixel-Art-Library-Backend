const express = require('express');
const router = express.Router();
const cartService = require('../service/cart.service');
const verifyToken = require('../middlewares/auth.middleware');

// Aplicar el middleware a todas las rutas de este router
// Cualquier petición a /cart/... primero pasará por verifyToken
router.use(verifyToken);

// GET carrito del usuario
router.get('/', async (req, res) => { 
  try {
    const userId = req.user.userId; // 2. OBTENER userId DEL TOKEN (asegúrate que tu JWT payload tenga userId)
    const cart = await cartService.getCartByUserId(userId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST agregar producto al carrito 
router.post('/add', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;
    const cart = await cartService.addProductToCart(userId, productId, quantity);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT actualizar cantidad de producto en el carrito 
router.put('/update', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;
    const cart = await cartService.updateProductQuantityInCart(userId, productId, quantity);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE remover producto del carrito
router.delete('/remove', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;
    const cart = await cartService.removeProductFromCart(userId, productId);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;