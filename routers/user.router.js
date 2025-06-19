const express = require('express');
const router = express.Router();
const userService = require('../service/user.service');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Por defecto 10 usuarios por página

    if (page <= 0) {
      return res.status(400).json({ message: 'El número de página debe ser positivo.' });
    }
    if (limit <= 0) {
      return res.status(400).json({ message: 'El límite de usuarios por página debe ser positivo.' });
    }

    const paginatedResults = await userService.getAllUsers(page, limit);

    // Si totalItems es 0, el frontend recibirá users: [] y la info de paginación.
    res.json(paginatedResults);

  } catch (error) {
    console.error("Error en la ruta GET /users (todos):", error);
    res.status(500).json({ message: 'Error al obtener todos los usuarios.', error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, page, limit } = req.query; // 'q' será el término de búsqueda

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Se requiere un término de búsqueda.' });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const results = await userService.searchUsers(q, pageNum, limitNum);
    res.json(results);

  } catch (error) {
    console.error("Error en la ruta GET /users/search:", error);
    res.status(500).json({ message: 'Error al buscar usuarios.', error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  res.json(user);
});

router.post('/', async (req, res) => {
  const result = await userService.createUser(req.body);
  console.log('Resultado de userService.createUser:', result); // <--- LOG DE DEBUG

  if (!result.success) {
    console.log('userService.createUser indicó !result.success. Mensaje:', result.message); // <--- LOG DE DEBUG
    if (result.message && (result.message.toLowerCase().includes('ya existe un usuario con ese email') || result.message.toLowerCase().includes('ese email ya está registrado'))) {
      console.log('Enviando 409 Conflict por email duplicado.'); // <--- LOG DE DEBUG
      return res.status(409).json({ success: false, message: result.message }); // Asegúrate de incluir success: false
    }
    console.log('Enviando 400 Bad Request por otro error de creación.'); // <--- LOG DE DEBUG
    return res.status(400).json({ success: false, message: result.message }); // Asegúrate de incluir success: false
  }

  console.log('Usuario creado exitosamente. Enviando 201 Created.'); // <--- LOG DE DEBUG
  res.status(201).json(result); // result ya debería ser { success: true, user: ..., message: ... }
});

router.put('/:userId', async (req, res) => {
  const updated = await userService.updateUser(req.params.userId, req.body);
  res.json(updated);
});

router.delete('/:userId', async (req, res) => {
  const deleted = await userService.deleteUser(req.params.userId);
  res.json({ deleted });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await userService.loginUser(email, password);

  if (!result.success) {
    return res.status(401).json({ message: result.message });
  }

  res.json({
    message: result.message,
    token: result.token,
    user: result.user
  });
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Todos los campos son requeridos: email, newPassword, confirmPassword.' });
    }

    const result = await userService.resetPassword(email, newPassword, confirmPassword);

    if (!result.success) {
      // Usar 404 si el usuario no se encuentra, 400 para otras validaciones
      const statusCode = result.message.includes('Usuario no encontrado') ? 404 : 400;
      return res.status(statusCode).json({ message: result.message });
    }

    res.json({ message: result.message });

  } catch (error) {
    // Loggear el error en el servidor para depuración
    console.error('Error en el endpoint /reset-password:', error);
    res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
  }
});

module.exports = router;
