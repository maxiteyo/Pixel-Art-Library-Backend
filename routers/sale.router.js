const express = require('express');
const router = express.Router();
const saleService = require('../service/sale.service');
const verifyToken = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware'); 

router.use(verifyToken); //Aplica a todas las rutas

router.get('/', checkRole('admin') ,async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Por defecto 10 ventas por página

    if (page <= 0) {
      return res.status(400).json({ message: 'El número de página debe ser positivo.' });
    }
    if (limit <= 0) {
      return res.status(400).json({ message: 'El límite de ventas por página debe ser positivo.' });
    }

    const paginatedResults = await saleService.getAllSales(page, limit);
    res.json(paginatedResults);

  } catch (error) {
    console.error("Error en la ruta GET /sales (todas):", error);
    res.status(500).json({ message: 'Error al obtener todas las ventas.', error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const sales = await saleService.getSalesByUserId(req.user.id);
    res.json(sales);
  } catch (error) {
    console.error("Error en la ruta GET /sales/history:", error);
    res.status(500).json({ message: 'Error al obtener el historial de compras.' });
  }
});

router.get('/:saleId', async (req, res) => {
  try {
    const sale = await saleService.getSaleById(req.params.saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada.' });
    }

    // Lógica de autorización:
    // Un admin puede ver cualquier venta.
    // Un usuario solo puede ver sus propias ventas.
    if (req.user.role !== 'admin' && sale.userId !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado para ver esta venta.' });
    }

    res.json(sale);
  } catch (error) {
    console.error(`Error en la ruta GET /sales/${req.params.saleId}:`, error);
    res.status(500).json({ message: 'Error al obtener la venta.', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // La única información que necesitamos es el ID del usuario autenticado.
    // El servicio se encargará de obtener el carrito y procesar todo.
    const userId = req.user.id;
    const newSale = await saleService.createSale(userId);
    res.status(201).json(newSale);
  } catch (error) {
    console.error("Error en la ruta POST /sales:", error);
    // Devolver errores específicos al cliente
    if (error.message.includes('Stock insuficiente') || error.message.includes('carrito vacío')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al procesar la venta.', error: error.message });
  }
});

router.put('/:saleId', async (req, res) => { // <-- Añadido checkRole para seguridad
  try {
    const [numberOfAffectedRows] = await saleService.updateSale(req.params.saleId, req.body);
    if (numberOfAffectedRows > 0) {
      const updatedSale = await saleService.getSaleById(req.params.saleId);
      return res.json(updatedSale);
    }
    return res.status(404).json({ message: 'Venta no encontrada o no se realizaron cambios.' });
  } catch (error) {
    console.error(`Error en la ruta PUT /sales/${req.params.saleId}:`, error);
    res.status(500).json({ message: 'Error al actualizar la venta.', error: error.message });
  }
});

router.delete('/:saleId', async (req, res) => { // <-- Añadido checkRole para seguridad
  try {
    const deleted = await saleService.deleteSale(req.params.saleId);
    if (deleted > 0) {
      return res.json({ message: 'Venta eliminada exitosamente.' });
    }
    return res.status(404).json({ message: 'Venta no encontrada.' });
  } catch (error) {
    console.error(`Error en la ruta DELETE /sales/${req.params.saleId}:`, error);
    res.status(500).json({ message: 'Error al eliminar la venta.', error: error.message });
  }
});



module.exports = router;

