const { Cart, Product, CartProduct, User } = require('../models');

async function getCartByUserId(userId) {
  let cart = await Cart.findOne({
    where: { userId },
    include: [{
      model: Product,
      through: { attributes: ['quantity'] } // Para obtener la cantidad de CartProduct
    }]
  });

  if (!cart) {
    // Si el usuario no tiene carrito, se puede crear uno vacío
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    cart = await Cart.create({ userId });
    // Recargar para incluir la estructura de productos (aunque estará vacía)
    cart = await Cart.findOne({
        where: { userId },
        include: [{
          model: Product,
          through: { attributes: ['quantity'] }
        }]
      });
  }
  return cart;
}

async function addProductToCart(userId, productId, quantity = 1) {
  const cart = await getCartByUserId(userId); // Asegura que el carrito exista
  const product = await Product.findByPk(productId);

  if (!product) {
    throw new Error('Product not found');
  }

  const cartProduct = await CartProduct.findOne({
    where: { cartId: cart.cartId, productId: productId }
  });

  if (cartProduct) {
    // Si el producto ya está en el carrito, actualiza la cantidad
    cartProduct.quantity += quantity;
    await cartProduct.save();
  } else {
    // Si no está, lo agrega
    await cart.addProduct(product, { through: { quantity: quantity } });
  }

  return await getCartByUserId(userId); // Devuelve el carrito actualizado
}

async function updateProductQuantityInCart(userId, productId, quantity) {
  if (quantity <= 0) {
    return await removeProductFromCart(userId, productId);
  }

  const cart = await getCartByUserId(userId);
  const product = await Product.findByPk(productId);

  if (!product) {
    throw new Error('Product not found');
  }

  const cartProduct = await CartProduct.findOne({
    where: { cartId: cart.cartId, productId: productId }
  });

  if (cartProduct) {
    cartProduct.quantity = quantity;
    await cartProduct.save();
  } else {
    throw new Error('Product not in cart');
  }
  return await getCartByUserId(userId);
}

async function removeProductFromCart(userId, productId) {
  const cart = await getCartByUserId(userId);
  const product = await Product.findByPk(productId);

  if (!product) {
    throw new Error('Product not found');
  }

  const result = await cart.removeProduct(product); // Sequelize se encarga de la tabla intermedia

  if (!result) { // `removeProduct` devuelve 0 o 1 dependiendo si se eliminó algo
      throw new Error('Product not found in cart or could not be removed.');
  }

  return await getCartByUserId(userId);
}

module.exports = {
  getCartByUserId,
  addProductToCart,
  updateProductQuantityInCart,
  removeProductFromCart,
};