import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import torneoRoutes from './routes/torneoRoutes.js';
import catalogosRoutes from './routes/catalogosRoutes.js';
import equipoRoutes from './routes/equipoRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', torneoRoutes);
app.use('/api/catalogos', catalogosRoutes); // <-- Registro de ruta Catalogos
app.use('/api', equipoRoutes); // <-- Registro de ruta Equipos

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});