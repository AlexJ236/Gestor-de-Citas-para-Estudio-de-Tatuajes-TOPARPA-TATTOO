 require('dotenv').config();
 const express = require('express');
 const cors = require('cors');
 const clientRoutes = require('./routes/clientRoutes');
 const authRoutes = require('./routes/auth');
 const appointmentRoutes = require('./routes/appointmentRoutes');
 const expenseRoutes = require('./routes/expenseRoutes');
 const reportRoutes = require('./routes/reportRoutes');

 require('./config/db');
 
 const app = express();
 
 // Middlewares
 app.use(cors());
 app.use(express.json());
 
 // Rutas
 app.use('/api/auth', authRoutes);
 app.use('/api/clients', clientRoutes);
 app.use('/api/appointments', appointmentRoutes);
 app.use('/api/expenses', expenseRoutes);
 app.use('/api/reports', reportRoutes);
 
 // Ruta de prueba básica
 app.get('/', (req, res) => {
   res.send('¡Backend funcionando!');
 });
 
 const PORT = process.env.PORT || 5001;
 
 app.listen(PORT, () => {
   console.log(`Servidor corriendo en el puerto ${PORT}`);
 });