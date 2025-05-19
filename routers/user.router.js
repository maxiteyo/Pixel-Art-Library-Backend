const express = require('express');
const router = express.Router();
const { User } = require('../models');

router.get('/', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

router.get('/:userId', async (req, res) => {
  const user = await User.findByPk(req.params.userId);
  if (user) res.json(user);
  else res.status(404).json({ message: 'Usuario no encontrado' });
});

router.post('/', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:userId', async (req, res) => {
  await User.update(req.body, { where: { userId: req.params.userId } });
  res.json({ message: 'Usuario actualizado' });
});

router.delete('/:userId', async (req, res) => {
  await User.destroy({ where: { userId: req.params.userId } });
  res.status(204).send();
});

module.exports = router;
