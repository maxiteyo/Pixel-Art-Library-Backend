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
        as: 'User', 
        attributes: [ 'firstname', 'surname', 'dni', 'phone', 'email' ] // Incluir atributos específicos del usuario
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
      total: calculatedTotal
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
    return await getSaleById(newSale.saleId);

  } catch (error) {
    // 7. Si algo falló, revertir todos los cambios
    await t.rollback();
    console.error("Error al crear la venta (transacción revertida):", error);
    throw error;
  }
}

async function cancelSale(saleId, userId, userRole) {
  const t = await sequelize.transaction();
  try {
    const sale = await Sale.findByPk(saleId, {
      include: [SaleDetail], // Incluimos los detalles para saber qué productos reponer
      transaction: t
    });

    if (!sale) {
      throw new Error('Venta no encontrada.');
    }

    // Autorización: Un admin puede cancelar cualquier venta, un usuario solo las suyas.
    if (userRole !== 'admin' && sale.userId !== userId) {
      throw new Error('No autorizado para cancelar esta venta.');
    }

    // Verificación: Solo se pueden cancelar ventas pendientes.
    if (sale.status !== 'pending') {
      throw new Error(`No se puede cancelar una venta con estado '${sale.status}'.`);
    }

    // Reponer el stock de cada producto en la venta
    for (const detail of sale.SaleDetails) {
      await Product.increment('stock', {
        by: detail.quantity,
        where: { productId: detail.productId },
        transaction: t
      });
    }

    // Actualizar el estado de la venta a 'cancelled'
    sale.status = 'cancelled';
    await sale.save({ transaction: t });

    await t.commit();
    return sale;

  } catch (error) {
    await t.rollback();
    console.error("Error al cancelar la venta:", error);
    throw error; // Propagar el error para que el router lo maneje
  }
}

async function completeSale(saleId) {
  const t = await sequelize.transaction();
  try {
    const sale = await Sale.findByPk(saleId, { transaction: t });

    if (!sale) {
      throw new Error('Venta no encontrada.');
    }

    if (sale.status !== 'pending') {
      throw new Error(`Solo se pueden completar ventas con estado 'pending'. Estado actual: '${sale.status}'.`);
    }

    sale.status = 'completed';
    await sale.save({ transaction: t });

    await t.commit();
    return sale;

  } catch (error) {
    await t.rollback();
    console.error("Error al completar la venta:", error);
    throw error;
  }
}

async function updateSale(saleId, data) {
  return await Sale.update(data, { where: { saleId } });
}


module.exports = {
  getAllSales,
  getSaleById,
  getSalesByUserId,
  createSale,
  cancelSale,
  completeSale,
  updateSale,
};
