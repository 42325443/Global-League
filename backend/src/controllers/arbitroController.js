import pool from '../config/db.js';

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

const normalizarArbitro = (row) => ({
  id: row.idArbitro,
  idArbitro: row.idArbitro,
  nombre: row.nombre,
  apellido: row.apellido,
  dni: row.dni,
  email: row.email,
  telefono: row.telefono,
  localidad: row.localidad,
  estado: row.estado,
  idDeporte: row.idDeporte,
  deporte: row.nombreDeporte || '',
  idDisciplina: row.idDisciplina,
  especialidad: row.nombreDisciplina || ''
});

export const getArbitros = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.idArbitro,
        a.nombre,
        a.apellido,
        a.dni,
        a.email,
        a.telefono,
        a.localidad,
        a.estado,
        dep.idDeporte,
        dep.nombreDeporte,
        d.idDisciplina,
        d.nombreDisciplina
      FROM arbitro a
      LEFT JOIN arbitro_disciplina ad ON ad.idArbitro = a.idArbitro
      LEFT JOIN disciplina d ON d.idDisciplina = ad.idDisciplina
      LEFT JOIN deporte dep ON dep.idDeporte = d.idDeporte
      WHERE a.idUsuario = ?
      ORDER BY a.idArbitro DESC
    `, [req.user.idUsuario]);

    res.json(rows.map(normalizarArbitro));
  } catch (error) {
    console.error('Error al obtener árbitros:', error);
    res.status(500).json({ error: 'No se pudieron obtener los árbitros.' });
  }
};

export const createArbitro = async (req, res) => {
  const datos = {
    nombre: texto(req.body?.nombre),
    apellido: texto(req.body?.apellido),
    dni: texto(req.body?.dni),
    email: texto(req.body?.email).toLowerCase(),
    telefono: texto(req.body?.telefono),
    localidad: texto(req.body?.localidad)
  };
  const idDisciplina = Number(req.body?.idDisciplina);

  if (!datos.nombre || datos.nombre.length > 80) {
    return res.status(400).json({ error: 'El nombre es obligatorio y debe tener hasta 80 caracteres.' });
  }
  if (!datos.apellido || datos.apellido.length > 80) {
    return res.status(400).json({ error: 'El apellido es obligatorio y debe tener hasta 80 caracteres.' });
  }
  if (!datos.dni || datos.dni.length > 20) {
    return res.status(400).json({ error: 'El DNI es obligatorio y debe tener hasta 20 caracteres.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email) || datos.email.length > 254) {
    return res.status(400).json({ error: 'Ingresá un correo electrónico válido.' });
  }
  if (!datos.telefono || datos.telefono.length > 40) {
    return res.status(400).json({ error: 'El teléfono es obligatorio y debe tener hasta 40 caracteres.' });
  }
  if (!datos.localidad || datos.localidad.length > 100) {
    return res.status(400).json({ error: 'La localidad es obligatoria y debe tener hasta 100 caracteres.' });
  }
  if (!Number.isInteger(idDisciplina) || idDisciplina <= 0) {
    return res.status(400).json({ error: 'Seleccioná una disciplina válida.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[disciplina]] = await connection.query(`
      SELECT d.idDisciplina
      FROM disciplina d
      JOIN deporte dep ON dep.idDeporte = d.idDeporte
      WHERE d.idDisciplina = ?
    `, [idDisciplina]);

    if (!disciplina) {
      await connection.rollback();
      return res.status(400).json({ error: 'La disciplina seleccionada ya no está disponible.' });
    }

    const [resultado] = await connection.query(`
      INSERT INTO arbitro (
        idUsuario, nombre, apellido, dni, email, telefono, localidad, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')
    `, [
      req.user.idUsuario,
      datos.nombre,
      datos.apellido,
      datos.dni,
      datos.email,
      datos.telefono,
      datos.localidad
    ]);

    const idArbitro = resultado.insertId;
    await connection.query(`
      INSERT INTO arbitro_disciplina (idArbitro, idDisciplina)
      VALUES (?, ?)
    `, [idArbitro, idDisciplina]);

    const [[arbitroCreado]] = await connection.query(`
      SELECT
        a.idArbitro,
        a.nombre,
        a.apellido,
        a.dni,
        a.email,
        a.telefono,
        a.localidad,
        a.estado,
        dep.idDeporte,
        dep.nombreDeporte,
        d.idDisciplina,
        d.nombreDisciplina
      FROM arbitro a
      JOIN arbitro_disciplina ad ON ad.idArbitro = a.idArbitro
      JOIN disciplina d ON d.idDisciplina = ad.idDisciplina
      JOIN deporte dep ON dep.idDeporte = d.idDeporte
      WHERE a.idArbitro = ? AND a.idUsuario = ?
    `, [idArbitro, req.user.idUsuario]);

    await connection.commit();
    res.status(201).json(normalizarArbitro(arbitroCreado));
  } catch (error) {
    if (connection) await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      const campoDuplicado = error.message.includes('uq_arbitro_dni')
        ? 'DNI'
        : error.message.includes('uq_arbitro_email')
          ? 'correo electrónico'
          : 'DNI o correo electrónico';
      return res.status(409).json({ error: `Ya existe un árbitro registrado con ese ${campoDuplicado}.` });
    }

    console.error('Error al crear árbitro:', error);
    res.status(500).json({ error: 'No se pudo guardar el árbitro.' });
  } finally {
    connection?.release();
  }
};

export const actualizarEstadoArbitro = async (req, res) => {
  const idArbitro = Number(req.params.id);
  const estado = texto(req.body?.estado);

  if (!Number.isInteger(idArbitro) || idArbitro <= 0) {
    return res.status(400).json({ error: 'El identificador del árbitro no es válido.' });
  }
  if (!['Activo', 'Inactivo'].includes(estado)) {
    return res.status(400).json({ error: 'El estado debe ser Activo o Inactivo.' });
  }

  try {
    await pool.query(`
      UPDATE arbitro
      SET estado = ?
      WHERE idArbitro = ? AND idUsuario = ?
    `, [estado, idArbitro, req.user.idUsuario]);

    const [[arbitro]] = await pool.query(`
      SELECT idArbitro, estado
      FROM arbitro
      WHERE idArbitro = ? AND idUsuario = ?
    `, [idArbitro, req.user.idUsuario]);

    if (!arbitro) {
      return res.status(404).json({ error: 'No se encontró el árbitro.' });
    }

    res.json({
      id: arbitro.idArbitro,
      idArbitro: arbitro.idArbitro,
      estado: arbitro.estado
    });
  } catch (error) {
    console.error('Error al actualizar el estado del árbitro:', error);
    res.status(500).json({ error: 'No se pudo actualizar el estado del árbitro.' });
  }
};
