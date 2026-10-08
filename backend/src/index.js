import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import torneoRoutes from './routes/torneoRoutes.js';
import catalogosRoutes from './routes/catalogosRoutes.js';
import equipoRoutes from './routes/equipoRoutes.js';
import calendarioRoutes from './routes/calendarioRoutes.js';
import authRoutes from './routes/authRoutes.js';
import arbitroRoutes from './routes/arbitroRoutes.js';
import { requireAuth } from './middleware/requireAuth.js';
import { assertAuthConfiguration } from './services/authService.js';

dotenv.config();
assertAuthConfiguration();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api', requireAuth, torneoRoutes);
app.use('/api', requireAuth, equipoRoutes);
app.use('/api', requireAuth, calendarioRoutes);
app.use('/api', requireAuth, arbitroRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
