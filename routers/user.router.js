const express = require('express');
const router = express.Router();
const userService = require('../service/user.service');

router.get('/', async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
});

router.get('/:userId', async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  res.json(user);
});

router.post('/', async (req, res) => {
  const newUser = await userService.createUser(req.body);
  res.status(201).json(newUser);
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
