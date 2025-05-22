const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  // 1. Leer el header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato esperado: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  // 2. Verificar el token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }

    // 3. Adjuntar el usuario al request para usarlo más adelante
    req.user = user;
    next(); // ✅ sigue a la ruta protegida
  });
}

module.exports = verifyToken;
