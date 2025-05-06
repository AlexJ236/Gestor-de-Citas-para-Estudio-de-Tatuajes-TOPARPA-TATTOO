const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;

// --- Función de Registro ---
exports.register = async (req, res) => {
  const { username, password } = req.body;

  // Validación básica de entrada
  if (!username || !password) {
    return res.status(400).json({ message: 'Nombre de usuario y contraseña son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Verificar si el usuario ya existe (opcional pero recomendado)
    // Aunque la DB tiene constraint UNIQUE, verificar antes da mejor feedback
    const userExists = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario ya está en uso' }); // 409 Conflict
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Guardar el nuevo usuario en la base de datos
    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, passwordHash]
    );

    // Enviar respuesta exitosa
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: result.rows[0] // Devuelve los datos del usuario creado (sin el hash)
    });

  } catch (err) {
    // Manejo de errores específico para violación de unicidad (si la verificación anterior falla por concurrencia)
    if (err.code === '23505') { // Código de error de PostgreSQL para unique_violation
         return res.status(409).json({ message: 'El nombre de usuario ya está en uso (error DB)' });
    }
    // Otros errores
    console.error('Error al registrar usuario:', err.message);
    res.status(500).json({ message: 'Error interno del servidor al registrar usuario' });
  }
};

// --- Función de Inicio de Sesión (Login) ---
exports.login = async (req, res) => {
    const { username, password } = req.body;
  
    // Validación básica de entrada
    if (!username || !password) {
      return res.status(400).json({ message: 'Nombre de usuario y contraseña son obligatorios' });
    }
  
    try {
      // Buscar al usuario por nombre de usuario
      const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  
      // Verificar si el usuario existe
      if (userResult.rows.length === 0) {
        // Error genérico para no revelar si el usuario existe o no
        return res.status(401).json({ message: 'Credenciales inválidas' }); // 401 Unauthorized
      }
  
      const user = userResult.rows[0]; // Datos del usuario encontrado
  
      // Comparar la contraseña proporcionada con el hash almacenado
      const passwordMatches = await bcrypt.compare(password, user.password_hash);
  
      if (!passwordMatches) {
        // La contraseña no coincide
        return res.status(401).json({ message: 'Credenciales inválidas' }); // 401 Unauthorized
      }
  
      // ¡Contraseña correcta! Generar un JWT
      const payload = {
        userId: user.id,
        username: user.username
        // Puedes añadir más datos si los necesitas, ej. roles
      };
  
      // Firmar el token usando el secreto de .env y establecer una expiración
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
  
      // Enviar el token al cliente
      res.status(200).json({
         message: 'Inicio de sesión exitoso',
         token: token // El cliente guardará este token para futuras peticiones
      });
  
    } catch (err) {
      console.error('Error en inicio de sesión:', err.message);
      res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión' });
    }
  };