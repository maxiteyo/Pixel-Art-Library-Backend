const { User } = require('../models');

async function getAllUsers() {
  return await User.findAll();
}

async function getUserById(userId) {
  return await User.findByPk(userId);
}

const bcrypt = require('bcrypt');

async function createUser(data) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  data.password = hashedPassword;
  return await User.create(data);
}



async function loginUser(email, plainPassword) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  const isMatch = await bcrypt.compare(plainPassword, user.password);
  if (!isMatch) {
    return { success: false, message: 'Contraseña incorrecta' };
  }


  const jwt = require('jsonwebtoken');
  // Crear token con info básica del usuario
  const token = jwt.sign(
    { id: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    success: true,
    message: 'Login exitoso',
    token,
    user: { id: user.userId, email: user.email }
  };
}


async function updateUser(userId, data) {
  return await User.update(data, { where: { userId } });
}

async function deleteUser(userId) {
  return await User.destroy({ where: { userId } });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser
};
