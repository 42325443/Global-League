import pool from '../config/db.js';
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from '../services/authService.js';

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

export const registrarUsuario = async (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!nombre || nombre.length > 100) {
    return res.status(400).json({ error: 'Ingresá un nombre de hasta 100 caracteres.' });
  }
  if (!validarEmail(email)) return res.status(400).json({ error: 'Ingresá un correo electrónico válido.' });
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  }

  let connection;
  let lockTomado = false;
  try {
    connection = await pool.getConnection();
    const [[lock]] = await connection.query(
      "SELECT GET_LOCK('global_league_registro_inicial', 10) AS adquirido"
    );
    lockTomado = Number(lock.adquirido) === 1;
    if (!lockTomado) return res.status(503).json({ error: 'No se pudo iniciar el registro. Intentá nuevamente.' });

    await connection.beginTransaction();
    const [[{ cantidadUsuarios }]] = await connection.query(
      'SELECT COUNT(*) AS cantidadUsuarios FROM usuario'
    );
    const passwordHash = await hashPassword(password);
    const [resultado] = await connection.query(`
      INSERT INTO usuario (nombre, email, passwordHash)
      VALUES (?, ?, ?)
    `, [nombre, email, passwordHash]);

    const idUsuario = resultado.insertId;
    if (Number(cantidadUsuarios) === 0) {
      // La primera cuenta toma los datos heredados que todavía no tienen propietario.
      await connection.query('UPDATE torneo SET idUsuario = ? WHERE idUsuario IS NULL', [idUsuario]);
      await connection.query('UPDATE equipo SET idUsuario = ? WHERE idUsuario IS NULL', [idUsuario]);
      await connection.query('UPDATE arbitro SET idUsuario = ? WHERE idUsuario IS NULL', [idUsuario]);
      await connection.query('UPDATE cancha SET idUsuario = ? WHERE idUsuario IS NULL', [idUsuario]);
    }

    const sessionToken = createSessionToken(idUsuario);
    await connection.commit();
    setSessionCookie(res, sessionToken);
    res.status(201).json({ usuario: { idUsuario, nombre, email, rol: 'Organizador' } });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    }
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'No se pudo crear la cuenta.' });
  } finally {
    if (lockTomado && connection) {
      await connection.query("SELECT RELEASE_LOCK('global_league_registro_inicial')").catch(() => {});
    }
    connection?.release();
  }
};

export const iniciarSesion = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!validarEmail(email) || !password) {
    return res.status(400).json({ error: 'Ingresá tu correo y contraseña.' });
  }

  try {
    const [[usuario]] = await pool.query(`
      SELECT idUsuario, nombre, email, passwordHash, rol
      FROM usuario
      WHERE email = ? AND estado = 'Activo'
    `, [email]);

    if (!usuario || !(await verifyPassword(password, usuario.passwordHash))) {
      return res.status(401).json({ error: 'El correo o la contraseña no son correctos.' });
    }

    setSessionCookie(res, createSessionToken(usuario.idUsuario));
    res.json({
      usuario: {
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
};

export const obtenerSesion = (req, res) => res.json({ usuario: req.user });

export const cerrarSesion = (_req, res) => {
  clearSessionCookie(res);
  res.json({ message: 'Sesión cerrada.' });
};
