const { User } = require('../models');

async function getAllUsers() {
  return await User.findAll();
}

async function getUserById(userId) {
  return await User.findByPk(userId);
}

const bcrypt = require('bcrypt');

async function createUser(data) {
  try {
    // Validar campos
    const requiredFields = ['firstname', 'surname', 'email', 'password', 'phone', 'dni', 'address', 'city'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return { success: false, message: `El campo '${field}' es obligatorio` };
      }
    }

    // Limpiar y normalizar el email (Gmail no distingue entre mayúsculas y minúsculas)
    data.email = data.email.trim().toLowerCase();

    // Verificar si ya existe
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      return { success: false, message: 'Ya existe un usuario con ese email' };
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    // Crear usuario
    const newUser = await User.create(data);

    const { password, ...userData } = newUser.toJSON();
    return {
      success: true,
      message: 'Usuario registrado correctamente',
      user: userData
    };

  } catch (error) {
    // Detección de error por duplicado
    if (error instanceof Sequelize.UniqueConstraintError) {
      return { success: false, message: 'Ese email ya está registrado', error: error.message };
    }

    console.error('Error al crear usuario:', error);
    return { success: false, message: 'Error inesperado al crear usuario', error: error.message };
  }
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
    user: { id: user.userId, email: user.email, rol: user.rol, 
    firstname: user.firstname,
    surname: user.surname,
    phone: user.phone }
  };
}

async function resetPassword(email, newPassword, confirmPassword) {
  try {
    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'Las nuevas contraseñas no coinciden.' };
    }

    // Opcional: Añadir validación para la fortaleza de la contraseña
    if (newPassword.length < 6) { // Ejemplo: mínimo 6 caracteres
        return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    // Buscar al usuario por email
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return { success: false, message: 'Usuario no encontrado con el correo electrónico proporcionado.' };
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña del usuario
    user.password = hashedPassword;
    await user.save(); // Guarda los cambios en el usuario encontrado

    return { success: true, message: 'Contraseña actualizada exitosamente.' };

  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return { success: false, message: 'Error interno al intentar restablecer la contraseña.', error: error.message };
  }
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
  loginUser,
  resetPassword
};
