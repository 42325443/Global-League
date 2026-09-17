import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import torneoRoutes from './routes/torneoRoutes.js';
import catalogosRoutes from './routes/catalogosRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/torneos', torneoRoutes); // <-- Registro de ruta Torneos
app.use('/api/catalogos', catalogosRoutes); // <-- Registro de ruta Catalogos

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});