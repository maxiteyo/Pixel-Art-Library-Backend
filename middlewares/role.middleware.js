function checkRole(roles) {
  return (req, res, next) => {
    // Asumimos que el middleware verifyToken ya ha puesto req.user
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Acceso denegado. Rol de usuario no especificado.' });
    }

    // roles puede ser un string (ej. 'admin') o un array de strings (ej. ['admin', 'editor'])
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    
    // Si el usuario tiene el rol requerido, continuar con la siguiente función en la ruta
    next(); 
  };
}

module.exports = checkRole;