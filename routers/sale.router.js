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
  const newSale = await saleService.createSale(req.body);
  res.status(201).json(newSale);
});

router.put('/:saleId', async (req, res) => {
  const updated = await saleService.updateSale(req.params.saleId, req.body);
  res.json(updated);
});

router.delete('/:saleId', async (req, res) => {
  const deleted = await saleService.deleteSale(req.params.saleId);
  res.json({ deleted });
});

module.exports = router;

