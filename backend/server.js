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

require('./config/db'); // Configuración de la base de datos

const app = express();

// Configuración de CORS
const whitelist = ['http://localhost:5173', 'https://gestor-de-citas-para-estudio-de-tatuajes-toparpa-tattoo.vercel.app/']; // <-- REEMPLAZA con tu URL de Vercel
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET','POST','DELETE','PUT','OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Cabeceras permitidas
};
app.use(cors(corsOptions)); // Usar configuración de CORS

// Middlewares
app.use(express.json()); // Para parsear JSON bodies

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/artists', artistRoutes);

// Ruta de prueba básica
app.get('/', (req, res) => {
  res.send('¡Backend funcionando!');
});

// Puerto
const PORT = process.env.PORT || 5001;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});