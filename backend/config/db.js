const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Evento para verificar la conexión al iniciar
pool.on('connect', () => {
  console.log('Conexión exitosa a la base de datos PostgreSQL');
});

// Evento para capturar errores en el pool
pool.on('error', (err, client) => {
  console.error('Error inesperado en el cliente del pool de la DB', err);
  process.exit(-1); // Salir si hay un error grave con el pool
});

// Exportamos un objeto con un método 'query' para poder usarlo fácilmente
module.exports = {
  query: (text, params) => pool.query(text, params),

};

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("Error al ejecutar consulta de prueba en DB:", err);
  } else {
    // Modifiquemos un poco el mensaje de éxito aquí para ser claros
    console.log("Consulta de prueba a la DB exitosa:", res.rows[0]);
  }
});