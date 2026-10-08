// Ejecuta database/migracion_acta_posiciones.sql de forma idempotente.
// Uso: node backend/scripts/aplicarMigracionActa.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ruta = path.join(__dirname, '..', '..', 'database', 'migracion_acta_posiciones.sql');

const sql = fs.readFileSync(ruta, 'utf8')
  .split('\n')
  .filter((linea) => !linea.trim().startsWith('--'))
  .join('\n')
  .replace(/^\s*USE\s+global_league\s*;?\s*$/gim, '')
  .trim();

const sentencias = sql
  .split(';')
  .map((sentencia) => sentencia.trim())
  .filter(Boolean);

try {
  for (const sentencia of sentencias) {
    await pool.query(sentencia);
  }
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM torneo_criterio_desempate');
  const [[actas]] = await pool.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = 'global_league' AND table_name = 'acta_partido'");
  console.log(`Migración aplicada. acta_partido existe: ${actas.n > 0 ? 'sí' : 'no'}; criterios sembrados: ${n}`);
  process.exit(0);
} catch (error) {
  console.error('Error al aplicar la migración:', error.message);
  process.exit(1);
}
