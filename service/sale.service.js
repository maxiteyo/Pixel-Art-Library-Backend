const { Sale, User, SaleDetail, Product, Cart, CartProduct, sequelize } = require('../models');

async function getAllSales(page = 1, limit = 10) { // Valores por defecto para page y limit
  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await Sale.findAndCountAll({
      include: [
        {
          model: User,
          as: 'User', 
          attributes: ['userId', 'firstname', 'surname', 'dni', 'email']         },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['date', 'DESC']], // Ordenar por fecha descendente (más recientes primero)
      // distinct: true, // Necesario si el include de SaleDetail causa duplicados de Sale
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      sales: rows,
    };
  } catch (error) {
    console.error("Error al obtener todas las ventas con paginación:", error);
    throw error;
  }
}

async function getSaleById(saleId) {
  return await Sale.findByPk(saleId, {
    include: [
      {
        model: User,
        as: 'User', // ---> ¡ESTA ES LA LÍNEA QUE HAY QUE AÑADIR! <---
        attributes: { exclude: ['password'] }
      },
      {
        model: SaleDetail,
        include: [{ model: Product, attributes: ['productId', 'name', 'image'] }] // Incluir detalles del producto en cada SaleDetail
      }
    ]
  });
}

async function getSalesByUserId(userId) {
  return await Sale.findAll({
    where: { userId },
    order: [['date', 'DESC']] // Ordenar de más reciente a más antigua
  });
}

async function createSale(userId) {
  // Iniciar una transacción para asegurar la integridad de los datos
  const t = await sequelize.transaction();

  try {
    // 1. Obtener el carrito del usuario con sus productos
    const cart = await Cart.findOne({
      where: { userId },
      include: [{
        model: Product,
        through: { attributes: ['quantity'] }
      }]
    }, { transaction: t });

    if (!cart || !cart.Products || cart.Products.length === 0) {
      throw new Error('No se puede crear una venta con un carrito vacío.');
    }

    // 2. Verificar stock y calcular el total
    let calculatedTotal = 0;
    for (const product of cart.Products) {
      const productInDB = await Product.findByPk(product.productId, { transaction: t });
      if (productInDB.stock < product.CartProduct.quantity) {
        throw new Error(`Stock insuficiente para el producto: ${product.name}. Disponible: ${productInDB.stock}`);
      }
      calculatedTotal += productInDB.price * product.CartProduct.quantity;
    }

    // 3. Crear el registro de la Venta (Sale)
    const newSale = await Sale.create({
      userId: userId,
      date: new Date(),
      status: 'pending',
      total: calculatedTotal // <-- Aquí se usa el total calculado
    }, { transaction: t });

    // 4. Crear los Detalles de Venta (SaleDetail) y actualizar el stock
    for (const product of cart.Products) {
      await SaleDetail.create({
        saleId: newSale.salesId,
        productId: product.productId,
        quantity: product.CartProduct.quantity,
        unityprice: product.price
      }, { transaction: t });

      const productToUpdate = await Product.findByPk(product.productId, { transaction: t });
      productToUpdate.stock -= product.CartProduct.quantity;
      await productToUpdate.save({ transaction:t });
    }

    // 5. Vaciar el carrito del usuario
    await CartProduct.destroy({ where: { cartId: cart.cartId }, transaction: t });

    // 6. Confirmar la transacción
    await t.commit();

    // Devolver la venta recién creada
    return await getSaleById(newSale.salesId);

  } catch (error) {
    // 7. Si algo falló, revertir todos los cambios
    await t.rollback();
    console.error("Error al crear la venta (transacción revertida):", error);
    throw error;
  }
}


async function updateSale(saleId, data) {
  return await Sale.update(data, { where: { saleId } });
}

async function deleteSale(saleId) {
  return await Sale.destroy({ where: { saleId } });
}

module.exports = {
  getAllSales,
  getSaleById,
  getSalesByUserId,
  createSale,
  updateSale,
  deleteSale,
};
