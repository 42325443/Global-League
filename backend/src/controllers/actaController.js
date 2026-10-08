import pool from '../config/db.js';
import {
  crearError,
  EQUIPOS_EVENTO,
  TIPOS_EVENTO,
  obtenerActaDePartido,
  obtenerIncidencias,
  obtenerPartidoPropio,
  validarArbitro,
  validarJugadorDelPartido,
  validarMarcador,
} from '../services/actaService.js';

const responderActa = async (res, idPartido, idUsuario) => {
  const partido = await obtenerPartidoPropio(idPartido, idUsuario);
  const acta = await obtenerActaDePartido(idPartido);
  const incidencias = await obtenerIncidencias(acta?.idActa, partido);
  const [arbitros] = await pool.query(`
    SELECT idArbitro, nombre, apellido
    FROM arbitro
    WHERE estado = 'Activo' AND (idUsuario IS NULL OR idUsuario = ?)
    ORDER BY apellido, nombre
  `, [idUsuario]);
  res.json({ partido, acta: acta || null, incidencias, tiposEvento: TIPOS_EVENTO, arbitros });
};

export const getActaDePartido = async (req, res) => {
  try {
    await responderActa(res, Number(req.params.idPartido), req.user.idUsuario);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al cargar el acta:', error);
    res.status(500).json({ error: 'No se pudo cargar el acta del partido.' });
  }
};

const validarBorrador = (body) => {
  const marcadorLocal = validarMarcador(body?.marcadorLocal, 'Local');
  const marcadorVisitante = validarMarcador(body?.marcadorVisitante, 'Visitante');
  const observaciones = typeof body?.observaciones === 'string' ? body.observaciones.trim() : '';
  if (observaciones.length > 2000) {
    throw crearError('Las observaciones no pueden superar los 2000 caracteres.');
  }
  return { marcadorLocal, marcadorVisitante, observaciones };
};

export const guardarBorradorActa = async (req, res) => {
  const idPartido = Number(req.params.idPartido);
  let connection;
  try {
    const datos = validarBorrador(req.body);
    const idArbitro = await validarArbitro(req.body?.idArbitro, req.user.idUsuario);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const partido = await obtenerPartidoPropio(idPartido, req.user.idUsuario, connection);
    if (partido.estado === 'Finalizado') {
      throw crearError('El partido ya tiene el acta firmada y no se puede editar.', 409);
    }

    const actaExistente = await obtenerActaDePartido(idPartido, connection);
    if (actaExistente?.estado && actaExistente.estado !== 'Borrador') {
      throw crearError('El acta ya fue firmada y no se puede editar.', 409);
    }

    if (actaExistente) {
      await connection.query(`
        UPDATE acta_partido
        SET idArbitro = ?, observaciones = NULLIF(?, '')
        WHERE idActa = ?
      `, [idArbitro, datos.observaciones, actaExistente.idActa]);
    } else {
      await connection.query(`
        INSERT INTO acta_partido (idPartido, idUsuarioCarga, idArbitro, estado, observaciones)
        VALUES (?, ?, ?, 'Borrador', NULLIF(?, ''))
      `, [idPartido, req.user.idUsuario, idArbitro, datos.observaciones]);
    }

    if (datos.marcadorLocal !== null && datos.marcadorVisitante !== null) {
      await connection.query(
        'UPDATE partido SET marcadorLocal = ?, marcadorVisitante = ? WHERE idPartido = ?',
        [datos.marcadorLocal, datos.marcadorVisitante, idPartido]
      );
    }

    await connection.commit();
    await responderActa(res, idPartido, req.user.idUsuario);
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al guardar el borrador del acta:', error);
    res.status(500).json({ error: 'No se pudo guardar el borrador del acta.' });
  } finally {
    connection?.release();
  }
};

const validarIncidencia = (body) => {
  const tipoEvento = typeof body?.tipoEvento === 'string' ? body.tipoEvento.trim() : '';
  if (!TIPOS_EVENTO.includes(tipoEvento)) {
    throw crearError('Seleccioná un tipo de incidencia válido.');
  }

  const equipo = typeof body?.equipo === 'string' ? body.equipo.trim() : '';
  if (!EQUIPOS_EVENTO.includes(equipo)) {
    throw crearError("Seleccioná el equipo ('Local' o 'Visitante') de la incidencia.");
  }

  const minutoRaw = body?.minuto;
  let minuto = null;
  if (minutoRaw !== null && minutoRaw !== undefined && minutoRaw !== '') {
    const numero = Number(minutoRaw);
    if (!Number.isInteger(numero) || numero < 0 || numero > 300) {
      throw crearError('El minuto debe ser un número entero entre 0 y 300.');
    }
    minuto = numero;
  }

  const observaciones = typeof body?.observaciones === 'string' ? body.observaciones.trim() : '';
  if (observaciones.length > 280) {
    throw crearError('Las observaciones de la incidencia no pueden superar los 280 caracteres.');
  }

  return { tipoEvento, equipo, minuto, observaciones };
};

export const agregarIncidenciaActa = async (req, res) => {
  const idPartido = Number(req.params.idPartido);
  let connection;
  try {
    const incidencia = validarIncidencia(req.body);
    if (incidencia.minuto === null) {
      throw crearError('Indicá el minuto de la incidencia.');
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const partido = await obtenerPartidoPropio(idPartido, req.user.idUsuario, connection);
    if (partido.estado === 'Finalizado') {
      throw crearError('El partido ya tiene el acta firmada y no se puede editar.', 409);
    }

    let acta = await obtenerActaDePartido(idPartido, connection);
    if (!acta) {
      const [resultado] = await connection.query(`
        INSERT INTO acta_partido (idPartido, idUsuarioCarga, estado)
        VALUES (?, ?, 'Borrador')
      `, [idPartido, req.user.idUsuario]);
      acta = { idActa: resultado.insertId, estado: 'Borrador' };
    } else if (acta.estado !== 'Borrador') {
      throw crearError('El acta ya fue firmada y no se puede editar.', 409);
    }

    const idJugador = await validarJugadorDelPartido(req.body?.idJugador, partido, connection);
    if (idJugador) {
      const [[jugador]] = await connection.query(
        'SELECT idEquipo FROM jugador WHERE idJugador = ?',
        [idJugador]
      );
      const idEquipoEsperado = incidencia.equipo === 'Local'
        ? partido.idEquipoLocal
        : partido.idEquipoVisitante;
      if (Number(jugador.idEquipo) !== Number(idEquipoEsperado)) {
        throw crearError('El jugador seleccionado no pertenece al equipo indicado.');
      }
    }

    // Sin jugador identificado se conserva el equipo elegido como prefijo de texto.
    const observacionesFinales = idJugador
      ? incidencia.observaciones || null
      : `[${incidencia.equipo}] ${incidencia.observaciones}`.trim().slice(0, 300);

    await connection.query(`
      INSERT INTO partido_evento (idActa, idJugador, tipoEvento, minuto, observaciones)
      VALUES (?, ?, ?, ?, ?)
    `, [acta.idActa, idJugador, incidencia.tipoEvento, incidencia.minuto, observacionesFinales]);

    await connection.commit();
    await responderActa(res, idPartido, req.user.idUsuario);
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al agregar la incidencia:', error);
    res.status(500).json({ error: 'No se pudo agregar la incidencia.' });
  } finally {
    connection?.release();
  }
};

export const eliminarIncidenciaActa = async (req, res) => {
  const idPartido = Number(req.params.idPartido);
  const idEvento = Number(req.params.idEvento);
  let connection;
  try {
    if (!Number.isInteger(idEvento) || idEvento <= 0) {
      throw crearError('La incidencia no es válida.');
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const partido = await obtenerPartidoPropio(idPartido, req.user.idUsuario, connection);
    if (partido.estado === 'Finalizado') {
      throw crearError('El partido ya tiene el acta firmada y no se puede editar.', 409);
    }

    const acta = await obtenerActaDePartido(idPartido, connection);
    if (!acta) throw crearError('El partido todavía no tiene un acta cargado.', 404);
    if (acta.estado !== 'Borrador') {
      throw crearError('El acta ya fue firmada y no se puede editar.', 409);
    }

    const [resultado] = await connection.query(
      'DELETE FROM partido_evento WHERE idEvento = ? AND idActa = ?',
      [idEvento, acta.idActa]
    );
    if (resultado.affectedRows === 0) throw crearError('No se encontró la incidencia.', 404);

    await connection.commit();
    await responderActa(res, idPartido, req.user.idUsuario);
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al eliminar la incidencia:', error);
    res.status(500).json({ error: 'No se pudo eliminar la incidencia.' });
  } finally {
    connection?.release();
  }
};

export const firmarActa = async (req, res) => {
  const idPartido = Number(req.params.idPartido);
  let connection;
  try {
    if (req.body?.conformidad !== true) {
      throw crearError('Debés confirmar la conformidad con los datos del acta antes de firmar.');
    }

    const datos = validarBorrador(req.body);
    if (datos.marcadorLocal === null || datos.marcadorVisitante === null) {
      throw crearError('Cargá el marcador final del partido antes de firmar el acta.');
    }
    const idArbitro = await validarArbitro(req.body?.idArbitro, req.user.idUsuario);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const partido = await obtenerPartidoPropio(idPartido, req.user.idUsuario, connection);
    if (partido.estado === 'Finalizado') {
      throw crearError('El acta de este partido ya fue firmado.', 409);
    }
    if (!partido.idEquipoLocal || !partido.idEquipoVisitante) {
      throw crearError('El partido debe tener sus dos equipos definidos para firmar el acta.', 409);
    }

    let acta = await obtenerActaDePartido(idPartido, connection);
    if (!acta) {
      const [resultado] = await connection.query(`
        INSERT INTO acta_partido (idPartido, idUsuarioCarga, idArbitro, estado, observaciones)
        VALUES (?, ?, ?, 'Borrador', NULLIF(?, ''))
      `, [idPartido, req.user.idUsuario, idArbitro, datos.observaciones]);
      acta = { idActa: resultado.insertId };
    } else if (acta.estado !== 'Borrador') {
      throw crearError('El acta de este partido ya fue firmado.', 409);
    }

    await connection.query(`
      UPDATE acta_partido
      SET idArbitro = ?, observaciones = NULLIF(?, ''), estado = 'Firmada', fechaCierre = NOW()
      WHERE idActa = ?
    `, [idArbitro, datos.observaciones, acta.idActa]);

    await connection.query(`
      UPDATE partido
      SET marcadorLocal = ?, marcadorVisitante = ?, estado = 'Finalizado', fechaCierre = NOW()
      WHERE idPartido = ?
    `, [datos.marcadorLocal, datos.marcadorVisitante, idPartido]);

    await connection.commit();
    await responderActa(res, idPartido, req.user.idUsuario);
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al firmar el acta:', error);
    res.status(500).json({ error: 'No se pudo firmar el acta.' });
  } finally {
    connection?.release();
  }
};


