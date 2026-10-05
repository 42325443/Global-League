import pool from '../config/db.js';
import { generarFixtureEnTransaccion } from '../services/fixtureService.js';

const crearError = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });

const normalizarIdsEquipos = (equiposIds) => {
  if (!Array.isArray(equiposIds)) throw crearError('Seleccioná al menos 2 equipos para el torneo.');
  const ids = equiposIds.map(Number);
  if (ids.length < 2) throw crearError('Seleccioná al menos 2 equipos para el torneo.');
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw crearError('La selección contiene un equipo no válido.');
  }
  if (new Set(ids).size !== ids.length) throw crearError('La selección contiene equipos duplicados.');
  return ids;
};

const validarEquiposDeDisciplina = async (connection, idsEquipos, idDisciplina, idUsuario) => {
  const placeholders = idsEquipos.map(() => '?').join(', ');
  const [equipos] = await connection.query(
    `SELECT idEquipo FROM equipo WHERE idDisciplina = ? AND idUsuario = ? AND idEquipo IN (${placeholders})`,
    [idDisciplina, idUsuario, ...idsEquipos]
  );
  if (equipos.length !== idsEquipos.length) {
    throw crearError('Todos los equipos deben pertenecer a la disciplina del torneo.');
  }
};

export const getTorneos = async (req, res) => {
  try {
    let query = `
      SELECT 
        t.idTorneo, t.nombreTorneo, t.idDisciplina, t.idFormato, t.fechaInicio, 
        t.fechaFin, t.ubicacion, t.cantidadEquipos, t.descripcionTorneo,
        d.nombreDisciplina, dep.nombreDeporte, f.nombreFormato,
        (SELECT COUNT(*) FROM torneo_equipo te WHERE te.idTorneo = t.idTorneo) AS equiposInscriptos
      FROM torneo t
      LEFT JOIN disciplina d ON t.idDisciplina = d.idDisciplina
      LEFT JOIN deporte dep ON d.idDeporte = dep.idDeporte
      LEFT JOIN formato f ON t.idFormato = f.idFormato
      WHERE t.idUsuario = ?
      ORDER BY t.idTorneo DESC
    `;

    let rows;
    try {
      [rows] = await pool.query(query, [req.user.idUsuario]);
    } catch {
      const fallbackQuery = `
        SELECT 
          t.idTorneo, t.nombreTorneo, t.idDisciplina, t.idFormato, t.fechaInicio, 
          t.fechaFin, t.ubicacion, t.cantidadEquipos, t.descripcionTorneo,
          d.nombreDisciplina, dep.nombreDeporte, f.nombreFormato,
          0 AS equiposInscriptos
        FROM torneo t
        LEFT JOIN disciplina d ON t.idDisciplina = d.idDisciplina
        LEFT JOIN deporte dep ON d.idDeporte = dep.idDeporte
        LEFT JOIN formato f ON t.idFormato = f.idFormato
        WHERE t.idUsuario = ?
        ORDER BY t.idTorneo DESC
      `;
      [rows] = await pool.query(fallbackQuery, [req.user.idUsuario]);
    }

    const torneosNormalizados = rows.map(row => {
      const idVal = row.idTorneo ?? row.id_torneo ?? row.id;
      const nombreVal = row.nombreTorneo ?? row.nombre_torneo ?? row.nombre ?? '';
      const limiteVal = row.cantidadEquipos ?? row.cantidadEquiposMax ?? 'Sin limite';

      return {
        ...row,
        id: idVal, idTorneo: idVal,
        nombre: nombreVal, nombreTorneo: nombreVal,
        deporte: row.nombreDeporte ?? 'Sin deporte',
        disciplina: row.nombreDisciplina ?? 'Sin disciplina',
        modalidad: row.nombreFormato ?? 'Liga',
        ubicacion: row.ubicacion || 'Sin asignar',
        cantidadEquiposMax: limiteVal,
        equiposInscriptos: row.equiposInscriptos || 0,
        estado: 'Próximo'
      };
    });
    res.json(torneosNormalizados);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener torneos', details: error.message });
  }
};

export const createTorneo = async (req, res) => {
  const { nombreTorneo, idDisciplina, idFormato, fechaInicio, descripcionTorneo, fechaFin, ubicacion, cantidadEquipos, cantidadEquiposMax, equiposIds } = req.body;

  let idsEquipos;
  try {
    idsEquipos = normalizarIdsEquipos(equiposIds);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  const disciplinaId = Number(idDisciplina);
  const formatoId = Number(idFormato);
  const valorLimite = cantidadEquiposMax ?? cantidadEquipos;
  const limiteEquipos = !valorLimite || valorLimite === 'Sin limite' ? null : Number(valorLimite);
  if (!nombreTorneo?.trim() || !Number.isInteger(disciplinaId) || disciplinaId <= 0 || !Number.isInteger(formatoId) || formatoId <= 0 || !fechaInicio) {
    return res.status(400).json({ error: 'Completá el nombre, la disciplina, el formato y la fecha de inicio del torneo.' });
  }
  if (limiteEquipos !== null && (!Number.isInteger(limiteEquipos) || limiteEquipos < 2)) {
    return res.status(400).json({ error: 'El límite de equipos debe ser de al menos 2.' });
  }
  if (limiteEquipos !== null && idsEquipos.length > limiteEquipos) {
    return res.status(400).json({ error: `El torneo permite hasta ${limiteEquipos} equipos.` });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await validarEquiposDeDisciplina(connection, idsEquipos, disciplinaId, req.user.idUsuario);
    const [[formato]] = await connection.query(
      'SELECT nombreFormato FROM formato WHERE idFormato = ?',
      [formatoId]
    );
    if (!formato) throw crearError('El formato seleccionado no existe.');

    const [result] = await connection.query(
      `INSERT INTO torneo (idUsuario, nombreTorneo, idDisciplina, idFormato, fechaInicio, descripcionTorneo, fechaFin, ubicacion, cantidadEquipos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.idUsuario, nombreTorneo.trim(), disciplinaId, formatoId, fechaInicio, descripcionTorneo || null, fechaFin || null, ubicacion || null, limiteEquipos]
    );

    const nuevoIdTorneo = result.insertId;

    const inscripciones = idsEquipos.map((idEquipo) => [nuevoIdTorneo, idEquipo]);
    await connection.query('INSERT INTO torneo_equipo (idTorneo, idEquipo) VALUES ?', [inscripciones]);
    const fixture = await generarFixtureEnTransaccion(connection, nuevoIdTorneo, idsEquipos, formato.nombreFormato);

    await connection.commit();
    res.status(201).json({ id: nuevoIdTorneo, message: 'Torneo y partidos creados con éxito', ...fixture });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al crear el torneo:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al crear el torneo', details: error.status ? undefined : error.message });
  } finally {
    connection?.release();
  }
};

export const deleteTorneo = async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await pool.query(
      'DELETE FROM torneo WHERE idTorneo = ? AND idUsuario = ?',
      [id, req.user.idUsuario]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ error: 'No se encontró el torneo.' });
    res.json({ message: 'Torneo eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar torneo', details: error.message });
  }
};

export const actualizarEquiposTorneo = async (req, res) => {
  const { id } = req.params;
  const { equiposIds } = req.body;

  let idsEquipos;
  try {
    idsEquipos = normalizarIdsEquipos(equiposIds);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[torneo]] = await connection.query(
      'SELECT idDisciplina FROM torneo WHERE idTorneo = ? AND idUsuario = ? FOR UPDATE',
      [id, req.user.idUsuario]
    );
    if (!torneo) throw crearError('No se encontró el torneo.', 404);

    const [[{ cantidadPartidos }]] = await connection.query(
      'SELECT COUNT(*) AS cantidadPartidos FROM partido WHERE idTorneo = ?', [id]
    );
    if (Number(cantidadPartidos) > 0) {
      throw crearError('No se pueden cambiar los participantes después de generar los partidos.');
    }
    await validarEquiposDeDisciplina(connection, idsEquipos, torneo.idDisciplina, req.user.idUsuario);
    await connection.query('DELETE FROM torneo_equipo WHERE idTorneo = ?', [id]);
    await connection.query(
      'INSERT INTO torneo_equipo (idTorneo, idEquipo) VALUES ?',
      [idsEquipos.map((idEquipo) => [id, idEquipo])]
    );
    await connection.commit();
    res.json({ message: 'Equipos actualizados correctamente' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al actualizar equipos', details: error.status ? undefined : error.message });
  } finally {
    connection?.release();
  }
};

export const generarFixture = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[torneo]] = await connection.query(`
      SELECT t.idTorneo, f.nombreFormato
      FROM torneo t
      JOIN formato f ON f.idFormato = t.idFormato
      WHERE t.idTorneo = ? AND t.idUsuario = ?
      FOR UPDATE
    `, [id, req.user.idUsuario]);
    if (!torneo) throw crearError('No se encontró el torneo.', 404);

    const [[{ cantidadPartidos }]] = await connection.query(
      'SELECT COUNT(*) AS cantidadPartidos FROM partido WHERE idTorneo = ?', [id]
    );
    if (Number(cantidadPartidos) > 0) {
      throw crearError('Este torneo ya tiene partidos generados.');
    }

    const [equipos] = await connection.query(
      'SELECT idEquipo FROM torneo_equipo WHERE idTorneo = ? ORDER BY idEquipo', [id]
    );
    const fixture = await generarFixtureEnTransaccion(
      connection,
      Number(id),
      equipos.map((equipo) => equipo.idEquipo),
      torneo.nombreFormato
    );
    await connection.commit();
    res.json({ message: 'Fixture generado con éxito', ...fixture });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al generar fixture', details: error.status ? undefined : error.message });
  } finally {
    connection?.release();
  }
};

export const getPartidosTorneo = async (req, res) => {
  const { id } = req.params;
  try {
    const [partidos] = await pool.query(`
      SELECT
        p.idPartido,
        p.idTorneo,
        p.idEquipoLocal,
        local.nombreEquipo AS equipoLocal,
        p.idEquipoVisitante,
        visitante.nombreEquipo AS equipoVisitante,
        p.marcadorLocal AS golesLocal,
        p.marcadorVisitante AS golesVisitante,
        p.jornada,
        p.tipoEtapa,
        p.nombreRonda,
        p.numeroPartido,
        p.idPartidoOrigenLocal,
        p.idPartidoOrigenVisitante,
        p.estado
      FROM partido p
      JOIN torneo t ON t.idTorneo = p.idTorneo AND t.idUsuario = ?
      LEFT JOIN equipo local ON local.idEquipo = p.idEquipoLocal
      LEFT JOIN equipo visitante ON visitante.idEquipo = p.idEquipoVisitante
      WHERE p.idTorneo = ?
      ORDER BY p.jornada, p.numeroPartido, p.idPartido
    `, [req.user.idUsuario, id]);
    res.json(partidos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los partidos del torneo', details: error.message });
  }
};
