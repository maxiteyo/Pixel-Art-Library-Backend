const { Sale, User, SaleDetail, Product } = require('../models');

async function getAllSales(page = 1, limit = 10) { // Valores por defecto para page y limit
  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await Sale.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ['userId', 'name', 'email'] // Incluir info del usuario, excluyendo password
        },
        // Opcional: Incluir SaleDetails si quieres un resumen en la lista.
        // Puede hacer la consulta más pesada si hay muchos detalles por venta.
        // {
        //   model: SaleDetail,
        //   include: [{ model: Product, attributes: ['name'] }] // Para ver el nombre del producto
        // }
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
        attributes: { exclude: ['password'] }
      },
      {
        model: SaleDetail,
        include: [{ model: Product, attributes: ['productId', 'name', 'image'] }] // Incluir detalles del producto en cada SaleDetail
      }
    ]
  });
}

async function createSale(data) {
  return await Sale.create(data);
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
  createSale,
  updateSale,
  deleteSale,
};
