require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar Rutas
const clientRoutes = require('./routes/clientRoutes');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointmentRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const artistRoutes = require('./routes/artistRoutes');

// Importar configuración de la base de datos (inicia la conexión)
require('./config/db');

const app = express();
const VERCEL_FRONTEND_URL = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';

// Lista de orígenes permitidos
const whitelist = ['http://localhost:5173', VERCEL_FRONTEND_URL];

const corsOptions = {
  origin: function (origin, callback) {

    // Permitir si el origen está en la whitelist O si no hay origen (peticiones no-navegador)
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Permitir
    } else {
      console.warn(`CORS Check - Origin '${origin}' NOT in whitelist, blocking.`); // Advertir si se bloquea
      callback(new Error('Not allowed by CORS')); // Bloquear
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas en la petición
  credentials: true // Si necesitas manejar cookies o cabeceras de autorización complejas 
};

// Aplicar el middleware CORS con las opciones configuradas
app.use(cors(corsOptions));

// --- Otros Middlewares ---
app.use(express.json());

// --- Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/artists', artistRoutes);

// --- Ruta de Verificación Base ---
// Útil para verificar rápidamente si el servidor está corriendo
app.get('/', (req, res) => {
  res.send('¡Backend TOPARPA TATTOO funcionando correctamente!');
});

// --- Puerto de Escucha ---
const PORT = process.env.PORT || 5001; // Usar 5001 como fallback para desarrollo local

// --- Iniciar el Servidor ---
app.listen(PORT, () => {
  console.info(`Servidor corriendo en el puerto ${PORT}`);
});