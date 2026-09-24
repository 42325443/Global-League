import pool from '../config/db.js';

const normalizarEquipo = (row) => ({
  id: row.idEquipo,
  idEquipo: row.idEquipo,
  nombre: row.nombreEquipo,
  nombreEquipo: row.nombreEquipo,
  idDeporte: row.idDeporte,
  idDisciplina: row.idDisciplina,
  deporte: row.nombreDeporte || '',
  disciplina: row.nombreDisciplina || '',
  localidad: row.localidad,
  capitan: row.capitan,
  cantidadJugadores: Number(row.cantidadJugadores || 0)
});

export const getEquipos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.idEquipo,
        e.nombreEquipo,
        dep.idDeporte,
        e.idDisciplina,
        e.localidad,
        e.capitan,
        d.nombreDisciplina,
        dep.nombreDeporte,
        (SELECT COUNT(*) FROM jugador j WHERE j.idEquipo = e.idEquipo) AS cantidadJugadores
      FROM equipo e
      JOIN disciplina d ON d.idDisciplina = e.idDisciplina
      JOIN deporte dep ON dep.idDeporte = d.idDeporte
      ORDER BY e.idEquipo DESC
    `);

    res.json(rows.map(normalizarEquipo));
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'No se pudieron obtener los equipos.' });
  }
};

export const getEquipoById = async (req, res) => {
  const idEquipo = Number(req.params.id);
  if (!Number.isInteger(idEquipo) || idEquipo <= 0) {
    return res.status(400).json({ error: 'El identificador del equipo no es válido.' });
  }

  try {
    const [rows] = await pool.query(`
      SELECT
        e.idEquipo,
        e.nombreEquipo,
        dep.idDeporte,
        e.idDisciplina,
        e.localidad,
        e.capitan,
        d.nombreDisciplina,
        dep.nombreDeporte,
        (SELECT COUNT(*) FROM jugador j WHERE j.idEquipo = e.idEquipo) AS cantidadJugadores
      FROM equipo e
      JOIN disciplina d ON d.idDisciplina = e.idDisciplina
      JOIN deporte dep ON dep.idDeporte = d.idDeporte
      WHERE e.idEquipo = ?
    `, [idEquipo]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el equipo.' });
    }

    const [jugadores] = await pool.query(`
      SELECT idJugador, nombre, apellido, dni
      FROM jugador
      WHERE idEquipo = ?
      ORDER BY apellido, nombre, idJugador
    `, [idEquipo]);

    res.json({
      ...normalizarEquipo(rows[0]),
      jugadores
    });
  } catch (error) {
    console.error('Error al obtener el equipo:', error);
    res.status(500).json({ error: 'No se pudo obtener el equipo.' });
  }
};

export const createEquipo = async (req, res) => {
  const {
    nombreEquipo,
    idDisciplina,
    localidad,
    capitan,
    jugadores = []
  } = req.body || {};

  const disciplinaId = Number(idDisciplina);
  const datosEquipo = {
    nombreEquipo: typeof nombreEquipo === 'string' ? nombreEquipo.trim() : '',
    localidad: typeof localidad === 'string' ? localidad.trim() : '',
    capitan: typeof capitan === 'string' ? capitan.trim() : ''
  };

  if (!datosEquipo.nombreEquipo || datosEquipo.nombreEquipo.length > 100) {
    return res.status(400).json({ error: 'El nombre del equipo es obligatorio y debe tener hasta 100 caracteres.' });
  }
  if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
    return res.status(400).json({ error: 'Seleccioná una disciplina válida.' });
  }
  if (!datosEquipo.localidad || datosEquipo.localidad.length > 100) {
    return res.status(400).json({ error: 'La localidad es obligatoria y debe tener hasta 100 caracteres.' });
  }
  if (!datosEquipo.capitan || datosEquipo.capitan.length > 120) {
    return res.status(400).json({ error: 'El capitán es obligatorio y debe tener hasta 120 caracteres.' });
  }
  if (!Array.isArray(jugadores)) {
    return res.status(400).json({ error: 'La lista de jugadores no es válida.' });
  }

  const jugadoresNormalizados = [];
  for (const jugador of jugadores) {
    const nombre = typeof jugador?.nombre === 'string' ? jugador.nombre.trim() : '';
    const apellido = typeof jugador?.apellido === 'string' ? jugador.apellido.trim() : '';
    const dni = typeof jugador?.dni === 'string' ? jugador.dni.trim() : '';

    if (!nombre || nombre.length > 80 || !apellido || apellido.length > 80 || dni.length > 20) {
      return res.status(400).json({
        error: 'Cada jugador necesita nombre y apellido de hasta 80 caracteres; el DNI admite hasta 20.'
      });
    }

    jugadoresNormalizados.push({ nombre, apellido, dni: dni || null });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [equipoResult] = await connection.query(`
      INSERT INTO equipo (nombreEquipo, idDisciplina, localidad, capitan)
      VALUES (?, ?, ?, ?)
    `, [datosEquipo.nombreEquipo, disciplinaId, datosEquipo.localidad, datosEquipo.capitan]);

    const nuevoIdEquipo = equipoResult.insertId;

    for (const jugador of jugadoresNormalizados) {
      await connection.query(`
        INSERT INTO jugador (idEquipo, nombre, apellido, dni)
        VALUES (?, ?, ?, ?)
      `, [nuevoIdEquipo, jugador.nombre, jugador.apellido, jugador.dni]);
    }

    await connection.commit();

    res.status(201).json({
      id: nuevoIdEquipo,
      idEquipo: nuevoIdEquipo,
      nombre: datosEquipo.nombreEquipo,
      nombreEquipo: datosEquipo.nombreEquipo,
      idDisciplina: disciplinaId,
      localidad: datosEquipo.localidad,
      capitan: datosEquipo.capitan,
      cantidadJugadores: jugadoresNormalizados.length,
      message: 'Equipo y jugadores guardados correctamente.'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al crear equipo y jugadores:', error);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'La disciplina seleccionada no existe.' });
    }

    res.status(500).json({ error: 'No se pudo guardar el equipo y sus jugadores.' });
  } finally {
    connection?.release();
  }
};
