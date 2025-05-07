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

require('./config/db');
const app = express();

// --- Configuración de CORS ---
const MAIN_FRONTEND_URL = process.env.MAIN_PRODUCTION_URL || 'https://gestor-de-citas-para-estudio-de-tatuajes-toparpa-tattoo.vercel.app';
const VERCEL_DEPLOYMENT_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const LOCAL_DEV_URL = 'http://localhost:5173';

// Lista de orígenes permitidos
const whitelist = [LOCAL_DEV_URL, MAIN_FRONTEND_URL];
if (VERCEL_DEPLOYMENT_URL && whitelist.indexOf(VERCEL_DEPLOYMENT_URL) === -1) {
  whitelist.push(VERCEL_DEPLOYMENT_URL); // Añadir la URL del despliegue si existe y no está ya incluida
}

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.includes(origin) || !origin) {
      callback(null, true); // Permitir
    } else {
      console.warn(`CORS Check - Origin '${origin}' NOT in whitelist, blocking.`);
      callback(new Error('Not allowed by CORS')); // Bloquear
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/artists', artistRoutes);

app.get('/', (req, res) => {
  res.send('¡Backend TOPARPA TATTOO funcionando correctamente!');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.info(`Servidor corriendo en el puerto ${PORT}`);
});