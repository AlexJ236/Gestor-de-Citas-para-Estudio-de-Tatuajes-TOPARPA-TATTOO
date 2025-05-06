const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Obtener el token de la cabecera 'Authorization'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Divide "Bearer TOKEN_STRING" y toma el token

  // Si no hay token, devolver error 401 (No autorizado)
  if (token == null) {
    return res.status(401).json({ message: 'Acceso denegado: Se requiere token' });
  }

  // Verificar el token usando el secreto
  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    // Si hay error en la verificación (token inválido, expirado, etc.)
    if (err) {
      console.log('Error al verificar token:', err.message); // Log para depuración
      // Devolver error 403 (Prohibido) porque el token se proporcionó pero no es válido
      return res.status(403).json({ message: 'Acceso denegado: Token inválido o expirado' });
    }

    // ¡Token válido! El payload decodificado está en 'userPayload'
    req.user = userPayload;

    // Llamar a next() para pasar a la siguiente función en la cadena (el controlador)
    next();
  });
}

module.exports = authenticateToken;