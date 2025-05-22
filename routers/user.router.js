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


module.exports = router;
