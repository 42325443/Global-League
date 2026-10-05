import pool from '../config/db.js';
import { getSessionCookie, verifySessionToken } from '../services/authService.js';

export const requireAuth = async (req, res, next) => {
  const session = verifySessionToken(getSessionCookie(req));
  if (!session) return res.status(401).json({ error: 'Iniciá sesión para continuar.' });

  try {
    const [[usuario]] = await pool.query(`
      SELECT idUsuario, nombre, email, rol
      FROM usuario
      WHERE idUsuario = ? AND estado = 'Activo'
    `, [session.idUsuario]);

    if (!usuario) return res.status(401).json({ error: 'La sesión venció o la cuenta está inactiva.' });
    req.user = usuario;
    next();
  } catch (error) {
    console.error('Error al validar la sesión:', error);
    res.status(500).json({ error: 'No se pudo validar la sesión.' });
  }
};
