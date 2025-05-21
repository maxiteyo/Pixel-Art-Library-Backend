const express = require('express');
const router = express.Router();
const userService = require('../service/user.service');

router.get('/', (req, res) => userService.getAllUsers(req, res));
router.get('/:userId', (req, res) => userService.getUserById(req, res));
router.post('/', (req, res) => userService.createUser(req, res));
router.put('/:userId', (req, res) => userService.updateUser(req, res));
router.delete('/:userId', (req, res) => userService.deleteUser(req, res));

module.exports = router;
