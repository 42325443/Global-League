import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexiones reutilizables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'global_league',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba rápida de conexión al iniciar
try {
  const connection = await pool.getConnection();
  console.log('✅ Conexión exitosa a la base de datos MySQL');
  connection.release();
} catch (error) {
  console.error('❌ Error al conectar con la base de datos:', error.message);
}

export default pool;