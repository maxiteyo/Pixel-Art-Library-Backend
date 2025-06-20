const { Cart, Product, CartProduct, User } = require('../models');

async function getCartByUserId(userId) {
  let cart = await Cart.findOne({
    where: { userId },
    include: [{
      model: Product,
      through: { attributes: ['quantity'] } 
    }]
  });

  if (!cart) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuario no encontrado');
    const newCartInstance = await Cart.create({ userId });
    // Recargar para obtener la estructura completa con asociaciones (aunque productos estará vacío)
    cart = await Cart.findOne({
        where: { cartId: newCartInstance.cartId },
        include: [{
          model: Product,
          through: { attributes: ['quantity'] }
        }]
      });
  }

  let totalPrice = 0;
  if (cart && cart.Products) {
    cart.Products.forEach(product => {
      if (product.CartProduct) { // Asegurarse que CartProduct existe
        totalPrice += product.price * product.CartProduct.quantity;
      }
    });
  }

  const cartJSON = cart.toJSON();
  cartJSON.totalPrice = parseFloat(totalPrice.toFixed(2)); // Añadir el precio total al objeto

  return cartJSON;
}

async function addProductToCart(userId, productId, quantity = 1) {
  if (quantity <= 0) {
    throw new Error('La cantidad debe ser un numero positivo.');
  }

  let cart = await Cart.findOne({ where: { userId } });
  let cartId;

  if (!cart) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usario no encontrado');
    const newCart = await Cart.create({ userId });
    cartId = newCart.cartId;
  } else {
    cartId = cart.cartId;
  }
  
  const product = await Product.findByPk(productId);

  if (!product) {
    throw new Error('Producto no encontrado');
  }

  const cartProduct = await CartProduct.findOne({
    where: { cartId: cartId, productId: productId }
  });

  if (cartProduct) {
    const newQuantity = cartProduct.quantity + quantity;
    if (product.stock < newQuantity) {
      throw new Error(`No hay suficiente stock para ${product.name}. Disponible: ${product.stock}, Total solicitado: ${newQuantity}`);
    }
    cartProduct.quantity = newQuantity;
    await cartProduct.save();
  } else {
    if (product.stock < quantity) {
      throw new Error(`No hay suficiente stock para ${product.name}. Disponible: ${product.stock}, Solicitado: ${quantity}`);
    }
    await CartProduct.create({ cartId: cartId, productId: productId, quantity: quantity });
  }

  return await getCartByUserId(userId);
}

async function updateProductQuantityInCart(userId, productId, quantity) {
  if (quantity <= 0) { // Si la cantidad es 0 o menos, se elimina el producto del carrito
    return await removeProductFromCart(userId, productId);
  }

  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
      throw new Error('Carrito no enconctrado para el usuario.');
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    throw new Error('Producto no encontrado');
  }

  if (product.stock < quantity) {
    throw new Error(`No hay suficiente stock para ${product.name}. Disponible: ${product.stock}, Solicitado: ${quantity}`);
  }

  const cartProduct = await CartProduct.findOne({
    where: { cartId: cart.cartId, productId: productId }
  });

  if (cartProduct) {
    cartProduct.quantity = quantity;
    await cartProduct.save();
  } else {
    throw new Error('Producto no encontrado en el carrito. Usa "añadir" para agregar un nuevo producto.');
  }
  return await getCartByUserId(userId);
}

async function removeProductFromCart(userId, productId) {
  const cart = await Cart.findOne({ where: { userId } });
   if (!cart) {
      throw new Error('Carrito no encontrado para el usuario.');
  }
  const product = await Product.findByPk(productId);

  if (!product) {
    throw new Error('Producto no encontrado');
  }

  const result = await CartProduct.destroy({
      where: { cartId: cart.cartId, productId: productId }
  });

  if (result === 0) { 
      throw new Error('Producto no encontrado en el carrito o no se pudo eliminar.');
  }

  return await getCartByUserId(userId);
}

async function syncCart(userId, products) {
  const { sequelize } = require('../models'); // Asegurarse de que sequelize esté disponible
  const transaction = await sequelize.transaction();
  try {
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) throw new Error('Carrito no encontrado para este usuario.');

    // 1. Borrar todos los productos actuales del carrito
    // CORRECCIÓN: La opción 'transaction' va dentro del primer objeto.
    await CartProduct.destroy({
      where: { cartId: cart.cartId },
      transaction // Shorthand para transaction: transaction
    });

    // 2. Añadir los nuevos productos con sus cantidades actualizadas
    if (products && products.length > 0) {
      const itemsToAdd = products.map(p => ({
        cartId: cart.cartId,
        productId: p.productId,
        quantity: p.quantity
      }));

      await CartProduct.bulkCreate(itemsToAdd, { transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Error en el servicio al sincronizar el carrito:", error);
    throw error;
  }
}

module.exports = {
  getCartByUserId,
  addProductToCart,
  updateProductQuantityInCart,
  removeProductFromCart,
  syncCart
};