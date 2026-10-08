import pool from '../config/db.js';

const crearError = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });
const esFechaValida = (fecha) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return false;
  const fechaUtc = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(fechaUtc.getTime()) && fechaUtc.toISOString().slice(0, 10) === fecha;
};
const esHoraValida = (hora) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora || '');
const minutosDesdeMedianoche = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};
const obtenerFechaHoraLocalActual = () => {
  const ahora = new Date();
  const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  return { fecha, hora };
};

export const getCalendario = async (req, res) => {
  try {
    const [partidos] = await pool.query(`
      SELECT
        p.idPartido,
        p.idTorneo,
        t.nombreTorneo,
        DATE_FORMAT(t.fechaInicio, '%Y-%m-%d') AS fechaInicioTorneo,
        DATE_FORMAT(t.fechaFin, '%Y-%m-%d') AS fechaFinTorneo,
        p.idEquipoLocal,
        local.nombreEquipo AS equipoLocal,
        p.idEquipoVisitante,
        visitante.nombreEquipo AS equipoVisitante,
        p.jornada,
        p.tipoEtapa,
        p.nombreRonda,
        p.numeroPartido,
        p.estado,
        p.marcadorLocal AS golesLocal,
        p.marcadorVisitante AS golesVisitante,
        DATE_FORMAT(p.fechaHoraInicio, '%Y-%m-%dT%H:%i:%s') AS fechaHoraInicio,
        DATE_FORMAT(p.fechaHoraFin, '%Y-%m-%dT%H:%i:%s') AS fechaHoraFin,
        p.idCancha,
        c.nombreCancha,
        c.ubicacion AS ubicacionCancha
      FROM partido p
      JOIN torneo t ON t.idTorneo = p.idTorneo
      LEFT JOIN equipo local ON local.idEquipo = p.idEquipoLocal
      LEFT JOIN equipo visitante ON visitante.idEquipo = p.idEquipoVisitante
      LEFT JOIN cancha c ON c.idCancha = p.idCancha
      WHERE t.idUsuario = ?
      ORDER BY p.fechaHoraInicio IS NULL DESC, p.fechaHoraInicio, t.fechaInicio, p.jornada, p.numeroPartido
    `, [req.user.idUsuario]);
    res.json(partidos);
  } catch (error) {
    console.error('Error al cargar el calendario:', error);
    res.status(500).json({ error: 'No se pudo cargar el calendario.' });
  }
};

export const getCanchas = async (req, res) => {
  try {
    const [canchas] = await pool.query(`
      SELECT idCancha, nombreCancha, ubicacion, descripcion
      FROM cancha
      WHERE idUsuario = ? AND estado = 'Activa'
      ORDER BY nombreCancha
    `, [req.user.idUsuario]);
    res.json(canchas);
  } catch (error) {
    console.error('Error al cargar las canchas:', error);
    res.status(500).json({ error: 'No se pudieron cargar las canchas.' });
  }
};

export const createCancha = async (req, res) => {
  const nombreCancha = typeof req.body?.nombreCancha === 'string' ? req.body.nombreCancha.trim() : '';
  const ubicacion = typeof req.body?.ubicacion === 'string' ? req.body.ubicacion.trim() : '';
  const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';

  if (!nombreCancha || nombreCancha.length > 100 || !ubicacion || ubicacion.length > 150 || descripcion.length > 500) {
    return res.status(400).json({ error: 'Completá un nombre y una ubicación válidos para la cancha.' });
  }

  try {
    const [resultado] = await pool.query(`
      INSERT INTO cancha (idUsuario, nombreCancha, ubicacion, descripcion)
      VALUES (?, ?, ?, ?)
    `, [req.user.idUsuario, nombreCancha, ubicacion, descripcion || null]);
    res.status(201).json({
      idCancha: resultado.insertId,
      nombreCancha,
      ubicacion,
      descripcion: descripcion || null,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una cancha con ese nombre en tu cuenta.' });
    }
    console.error('Error al crear la cancha:', error);
    res.status(500).json({ error: 'No se pudo guardar la cancha.' });
  }
};

export const programarPartido = async (req, res) => {
  const idPartido = Number(req.params.id);
  const idCancha = Number(req.body?.idCancha);
  const { fecha, horaInicio, horaFin } = req.body || {};

  if (!Number.isInteger(idPartido) || idPartido <= 0) {
    return res.status(400).json({ error: 'El partido seleccionado no es válido.' });
  }
  if (!Number.isInteger(idCancha) || idCancha <= 0 || !esFechaValida(fecha)
    || !esHoraValida(horaInicio) || !esHoraValida(horaFin)
    || minutosDesdeMedianoche(horaFin) <= minutosDesdeMedianoche(horaInicio)) {
    return res.status(400).json({ error: 'Ingresá una fecha, una cancha y un horario de fin posterior al de inicio.' });
  }

  const fechaHoraActual = obtenerFechaHoraLocalActual();
  if (fecha < fechaHoraActual.fecha
    || (fecha === fechaHoraActual.fecha && horaInicio <= fechaHoraActual.hora)) {
    return res.status(400).json({ error: 'El partido debe comenzar en una fecha y hora futuras.' });
  }

  const fechaHoraInicio = `${fecha} ${horaInicio}:00`;
  const fechaHoraFin = `${fecha} ${horaFin}:00`;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[partido]] = await connection.query(`
      SELECT
        p.idPartido,
        p.idEquipoLocal,
        p.idEquipoVisitante,
        DATE_FORMAT(t.fechaInicio, '%Y-%m-%d') AS fechaInicioTorneo,
        DATE_FORMAT(t.fechaFin, '%Y-%m-%d') AS fechaFinTorneo
      FROM partido p
      JOIN torneo t ON t.idTorneo = p.idTorneo
      WHERE p.idPartido = ? AND t.idUsuario = ?
      FOR UPDATE
    `, [idPartido, req.user.idUsuario]);

    if (!partido) throw crearError('No se encontró el partido.', 404);
    if (!partido.idEquipoLocal || !partido.idEquipoVisitante) {
      throw crearError('El partido todavía espera que se definan sus dos equipos.', 409);
    }
    if (fecha < partido.fechaInicioTorneo || (partido.fechaFinTorneo && fecha > partido.fechaFinTorneo)) {
      throw crearError('La fecha del partido debe estar dentro del período del torneo.');
    }

    const [[cancha]] = await connection.query(`
      SELECT idCancha
      FROM cancha
      WHERE idCancha = ? AND idUsuario = ? AND estado = 'Activa'
      FOR UPDATE
    `, [idCancha, req.user.idUsuario]);
    if (!cancha) throw crearError('No se encontró una cancha activa de tu cuenta.', 404);

    const equiposIds = [...new Set([Number(partido.idEquipoLocal), Number(partido.idEquipoVisitante)])].sort((a, b) => a - b);
    const placeholdersEquipos = equiposIds.map(() => '?').join(', ');
    const [equiposBloqueados] = await connection.query(`
      SELECT idEquipo
      FROM equipo
      WHERE idUsuario = ? AND idEquipo IN (${placeholdersEquipos})
      ORDER BY idEquipo
      FOR UPDATE
    `, [req.user.idUsuario, ...equiposIds]);
    if (equiposBloqueados.length !== equiposIds.length) {
      throw crearError('Los equipos del partido no pertenecen a tu cuenta.', 404);
    }

    const [[conflictoCancha]] = await connection.query(`
      SELECT p.idPartido
      FROM partido p
      JOIN torneo t ON t.idTorneo = p.idTorneo
      WHERE t.idUsuario = ?
        AND p.idCancha = ?
        AND p.idPartido <> ?
        AND p.fechaHoraInicio < ?
        AND p.fechaHoraFin > ?
      LIMIT 1
    `, [req.user.idUsuario, idCancha, idPartido, fechaHoraFin, fechaHoraInicio]);
    if (conflictoCancha) throw crearError('La cancha ya está ocupada en ese horario.', 409);

    const [[conflictoReserva]] = await connection.query(`
      SELECT idReserva
      FROM reserva_cancha
      WHERE idCancha = ?
        AND estado <> 'Cancelada'
        AND fechaHoraInicio < ?
        AND fechaHoraFin > ?
      LIMIT 1
    `, [idCancha, fechaHoraFin, fechaHoraInicio]);
    if (conflictoReserva) throw crearError('La cancha tiene una reserva que se superpone con ese horario.', 409);

    const [[conflictoEquipo]] = await connection.query(`
      SELECT p.idPartido
      FROM partido p
      JOIN torneo t ON t.idTorneo = p.idTorneo
      WHERE t.idUsuario = ?
        AND p.idPartido <> ?
        AND (p.idEquipoLocal IN (${placeholdersEquipos}) OR p.idEquipoVisitante IN (${placeholdersEquipos}))
        AND p.fechaHoraInicio < ?
        AND p.fechaHoraFin > ?
      LIMIT 1
    `, [req.user.idUsuario, idPartido, ...equiposIds, ...equiposIds, fechaHoraFin, fechaHoraInicio]);
    if (conflictoEquipo) throw crearError('Uno de los equipos ya tiene otro partido en ese horario.', 409);

    await connection.query(`
      UPDATE partido
      SET idCancha = ?, fechaHoraInicio = ?, fechaHoraFin = ?
      WHERE idPartido = ?
    `, [idCancha, fechaHoraInicio, fechaHoraFin, idPartido]);

    await connection.commit();
    res.json({ message: 'Partido programado correctamente.' });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al programar el partido:', error);
    res.status(500).json({ error: 'No se pudo programar el partido.' });
  } finally {
    connection?.release();
  }
};
