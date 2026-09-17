import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import torneoRoutes from './routes/torneoRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/torneos', torneoRoutes);

// Ruta de health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    res.json({ 
      status: 'OK', 
      message: 'Servidor y BD funcionando correctamente', 
      resultado: rows[0].resultado 
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});