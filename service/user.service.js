const { User, sequelize } = require('../models');
const { Op } = require('sequelize');

async function getAllUsers(page = 1, limit = 10) { // Valores por defecto para page y limit
  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] }, // Excluir el campo password de la respuesta
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['userId', 'ASC']], // Opcional: para un orden consistente
      // distinct: true, // Usar si los includes causan duplicados y necesitas contar correctamente
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      users: rows, // Cambiado de 'products' a 'users' para claridad
    };
  } catch (error) {
    console.error("Error al obtener todos los usuarios con paginación:", error);
    throw error; // Relanzar para que el router lo maneje
  }
}

async function searchUsers(searchTerm, page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;
    const query = `%${searchTerm}%`; // Prepara el término de búsqueda para LIKE

    const { count, rows } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { firstname: { [Op.like]: query } },
          { surname: { [Op.like]: query } },
          { dni: { [Op.like]: query } },
          // Buscar en la concatenación de nombre y apellido
          sequelize.where(
            sequelize.fn('CONCAT', sequelize.col('firstname'), ' ', sequelize.col('surname')),
            { [Op.like]: query }
          )
        ]
      },
      attributes: { exclude: ['password'] },
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['surname', 'ASC'], ['firstname', 'ASC']],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      users: rows,
    };
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    throw error;
  }
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
    { id: user.userId, email: user.email, role: user.rol},
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
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
  // Medida de seguridad: No permitir la actualización de la contraseña o el rol a través de esta función.
  delete data.password;
  delete data.rol;
  delete data.userId; // No se debe poder cambiar el ID

  // La función devuelve un array con el número de filas afectadas.
  return await User.update(data, { where: { userId } });
}

async function deleteUser(userId) {
  return await User.destroy({ where: { userId } });
}

module.exports = {
  getAllUsers,
  searchUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  resetPassword
};
