import pool from '../config/db.js';
import { propagarResultadoEliminatoria } from '../services/bracketService.js';
import { cerrarTorneoSiCorresponde } from '../services/competitionService.js';

const errorHttp = (message, status = 400) => Object.assign(new Error(message), { status });
const numero = (value, { min = 0, max = 999 } = {}) => (
  Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max
);
const enterosUnicos = (values) => (
  Array.isArray(values)
    && values.every((value) => Number.isInteger(Number(value)) && Number(value) > 0)
    && new Set(values.map(Number)).size === values.length
);

const cargarPartidoPropio = async (connection, idPartido, idUsuario, bloquear = false) => {
  const [[partido]] = await connection.query(`
    SELECT
      p.idPartido, p.idTorneo, p.idEquipoLocal, p.idEquipoVisitante,
      p.marcadorLocal, p.marcadorVisitante, p.idEquipoGanador, p.tipoEtapa,
      p.nombreRonda, p.numeroPartido, p.estado, p.tipoResolucion, p.fechaCierre,
      p.fechaHoraInicio, p.fechaHoraFin,
      t.nombreTorneo, t.idDisciplina, f.nombreFormato,
      d.tipoPuntuacion, d.nombreDisciplina,
      local.nombreEquipo AS equipoLocal, visitante.nombreEquipo AS equipoVisitante
    FROM partido p
    JOIN torneo t ON t.idTorneo = p.idTorneo
    JOIN formato f ON f.idFormato = t.idFormato
    JOIN disciplina d ON d.idDisciplina = t.idDisciplina
    JOIN equipo local ON local.idEquipo = p.idEquipoLocal
    JOIN equipo visitante ON visitante.idEquipo = p.idEquipoVisitante
    WHERE p.idPartido = ? AND t.idUsuario = ?
    ${bloquear ? 'FOR UPDATE' : ''}
  `, [idPartido, idUsuario]);
  if (!partido) throw errorHttp('No se encontró el partido.', 404);
  return partido;
};

export const getPartidosArbitro = async (req, res) => {
  const idArbitro = Number(req.params.id);
  if (!Number.isInteger(idArbitro) || idArbitro <= 0) {
    return res.status(400).json({ error: 'El árbitro seleccionado no es válido.' });
  }
  try {
    const [partidos] = await pool.query(`
      SELECT
        p.idPartido, p.idTorneo, t.nombreTorneo, p.jornada, p.tipoEtapa,
        p.nombreRonda, p.numeroPartido, p.estado, p.marcadorLocal,
        p.marcadorVisitante,
        DATE_FORMAT(p.fechaHoraInicio, '%Y-%m-%dT%H:%i:%s') AS fechaHoraInicio,
        DATE_FORMAT(p.fechaHoraFin, '%Y-%m-%dT%H:%i:%s') AS fechaHoraFin,
        local.idEquipo AS idEquipoLocal, local.nombreEquipo AS equipoLocal,
        visitante.idEquipo AS idEquipoVisitante, visitante.nombreEquipo AS equipoVisitante,
        ap.estado AS estadoActa, ap.fechaCierre AS fechaCierreActa,
        a.rol AS rolArbitro
      FROM partido_arbitro a
      JOIN arbitro arb ON arb.idArbitro = a.idArbitro AND arb.idUsuario = ?
      JOIN partido p ON p.idPartido = a.idPartido
      JOIN torneo t ON t.idTorneo = p.idTorneo AND t.idUsuario = ?
      LEFT JOIN equipo local ON local.idEquipo = p.idEquipoLocal
      LEFT JOIN equipo visitante ON visitante.idEquipo = p.idEquipoVisitante
      LEFT JOIN acta_partido ap ON ap.idPartido = p.idPartido
      WHERE a.idArbitro = ?
      ORDER BY p.fechaHoraInicio IS NULL, p.fechaHoraInicio, p.jornada, p.numeroPartido
    `, [req.user.idUsuario, req.user.idUsuario, idArbitro]);
    res.json(partidos);
  } catch (error) {
    console.error('Error al cargar partidos del árbitro:', error);
    res.status(500).json({ error: 'No se pudieron cargar los partidos del árbitro.' });
  }
};

export const getPartidosSinArbitro = async (req, res) => {
  try {
    const [partidos] = await pool.query(`
      SELECT
        p.idPartido, p.idTorneo, t.nombreTorneo, p.jornada, p.tipoEtapa,
        p.nombreRonda, p.numeroPartido, p.estado, p.marcadorLocal,
        p.marcadorVisitante,
        DATE_FORMAT(p.fechaHoraInicio, '%Y-%m-%dT%H:%i:%s') AS fechaHoraInicio,
        local.idEquipo AS idEquipoLocal, local.nombreEquipo AS equipoLocal,
        visitante.idEquipo AS idEquipoVisitante, visitante.nombreEquipo AS equipoVisitante,
        ap.estado AS estadoActa
      FROM partido p
      JOIN torneo t ON t.idTorneo = p.idTorneo AND t.idUsuario = ?
      LEFT JOIN equipo local ON local.idEquipo = p.idEquipoLocal
      LEFT JOIN equipo visitante ON visitante.idEquipo = p.idEquipoVisitante
      LEFT JOIN acta_partido ap ON ap.idPartido = p.idPartido
      WHERE p.idEquipoLocal IS NOT NULL AND p.idEquipoVisitante IS NOT NULL
        AND p.estado NOT IN ('Finalizado', 'Anulado', 'Pase libre')
        AND p.fechaCierre IS NULL AND (ap.idActa IS NULL OR ap.estado <> 'Cerrada')
        AND NOT EXISTS (
          SELECT 1 FROM partido_arbitro pa WHERE pa.idPartido = p.idPartido
        )
      ORDER BY p.fechaHoraInicio IS NULL, p.fechaHoraInicio, p.jornada, p.numeroPartido
    `, [req.user.idUsuario]);
    res.json(partidos);
  } catch (error) {
    console.error('Error al cargar partidos sin árbitro:', error);
    res.status(500).json({ error: 'No se pudieron cargar los partidos sin árbitro.' });
  }
};

export const asignarArbitrosPartido = async (req, res) => {
  const idPartido = Number(req.params.id);
  const idsArbitros = req.body?.idsArbitros;
  if (!Number.isInteger(idPartido) || idPartido <= 0 || !enterosUnicos(idsArbitros)) {
    return res.status(400).json({ error: 'La selección de partido o árbitros no es válida.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const partido = await cargarPartidoPropio(connection, idPartido, req.user.idUsuario, true);
    if (partido.fechaCierre || ['Finalizado', 'Anulado', 'Pase libre'].includes(partido.estado)) {
      throw errorHttp('No se pueden cambiar los árbitros de un partido finalizado.', 409);
    }
    const [[actaEnBorrador]] = await connection.query(
      'SELECT idArbitro FROM acta_partido WHERE idPartido = ? AND estado = \'Borrador\' FOR UPDATE',
      [idPartido]
    );
    if (actaEnBorrador?.idArbitro
      && !idsArbitros.map(Number).includes(Number(actaEnBorrador.idArbitro))) {
      throw errorHttp('El árbitro que inició el borrador debe seguir asignado hasta cerrar el acta.', 409);
    }

    if (idsArbitros.length) {
      const placeholders = idsArbitros.map(() => '?').join(', ');
      const [arbitros] = await connection.query(`
        SELECT a.idArbitro
        FROM arbitro a
        JOIN arbitro_disciplina ad ON ad.idArbitro = a.idArbitro
        WHERE a.idUsuario = ? AND a.estado = 'Activo'
          AND ad.idDisciplina = ? AND a.idArbitro IN (${placeholders})
      `, [req.user.idUsuario, partido.idDisciplina, ...idsArbitros.map(Number)]);
      if (arbitros.length !== idsArbitros.length) {
        throw errorHttp('Elegí árbitros activos y habilitados para la disciplina del torneo.');
      }

      if (partido.fechaHoraInicio && partido.fechaHoraFin) {
        const [conflictos] = await connection.query(`
          SELECT pa.idArbitro, a.nombre, a.apellido
          FROM partido_arbitro pa
          JOIN arbitro a ON a.idArbitro = pa.idArbitro
          JOIN partido otro ON otro.idPartido = pa.idPartido
          JOIN torneo t ON t.idTorneo = otro.idTorneo
          WHERE t.idUsuario = ? AND pa.idArbitro IN (${placeholders})
            AND otro.idPartido <> ? AND otro.fechaHoraInicio < ? AND otro.fechaHoraFin > ?
            AND otro.fechaCierre IS NULL
          LIMIT 1
        `, [req.user.idUsuario, ...idsArbitros.map(Number), idPartido, partido.fechaHoraFin, partido.fechaHoraInicio]);
        if (conflictos.length) {
          throw errorHttp(`El árbitro ${conflictos[0].nombre} ${conflictos[0].apellido} ya está asignado a otro partido en ese horario.`, 409);
        }
      }
    }

    await connection.query('DELETE FROM partido_arbitro WHERE idPartido = ?', [idPartido]);
    if (idsArbitros.length) {
      await connection.query(`
        INSERT INTO partido_arbitro (idPartido, idArbitro, rol, idUsuarioAsignador)
        VALUES ?
      `, [idsArbitros.map((idArbitro, index) => [idPartido, Number(idArbitro), index === 0 ? 'Principal' : 'Asistente', req.user.idUsuario])]);
    }
    await connection.commit();
    res.json({ message: 'Árbitros asignados correctamente.', idsArbitros: idsArbitros.map(Number) });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al asignar árbitros:', error);
    res.status(500).json({ error: 'No se pudieron asignar los árbitros.' });
  } finally {
    connection?.release();
  }
};

export const getActaPartido = async (req, res) => {
  const idPartido = Number(req.params.id);
  const idArbitro = req.query.idArbitro ? Number(req.query.idArbitro) : null;
  if (!Number.isInteger(idPartido) || idPartido <= 0
    || (idArbitro !== null && (!Number.isInteger(idArbitro) || idArbitro <= 0))) {
    return res.status(400).json({ error: 'El partido o árbitro seleccionado no es válido.' });
  }
  try {
    const partido = await cargarPartidoPropio(pool, idPartido, req.user.idUsuario);
    if (!partido.idEquipoLocal || !partido.idEquipoVisitante) {
      throw errorHttp('El partido todavía no tiene definidos sus dos equipos.', 409);
    }
    const [[acta]] = await pool.query(`
      SELECT idActa, idUsuarioCarga, idArbitro, estado, observaciones,
        DATE_FORMAT(fechaCierre, '%Y-%m-%dT%H:%i:%s') AS fechaCierre
      FROM acta_partido WHERE idPartido = ?
    `, [idPartido]);
    if (['Anulado', 'Pase libre'].includes(partido.estado)
      || (partido.estado === 'Finalizado' && acta?.estado !== 'Cerrada')) {
      throw errorHttp('Este encuentro fue resuelto automáticamente y no necesita acta.', 409);
    }
    const [[{ totalArbitros }]] = await pool.query(
      'SELECT COUNT(*) AS totalArbitros FROM partido_arbitro WHERE idPartido = ?', [idPartido]
    );
    if (idArbitro) {
      const [[asignado]] = await pool.query(`
        SELECT pa.idArbitro FROM partido_arbitro pa
        JOIN arbitro a ON a.idArbitro = pa.idArbitro
        WHERE pa.idPartido = ? AND pa.idArbitro = ? AND a.idUsuario = ?
      `, [idPartido, idArbitro, req.user.idUsuario]);
      if (!asignado) throw errorHttp('Este árbitro no está asignado al partido.', 403);
    } else if (Number(totalArbitros) > 0) {
      throw errorHttp('Este encuentro tiene árbitros asignados. Abrí el acta desde uno de ellos.', 403);
    }

    if (acta?.idArbitro && Number(acta.idArbitro) !== Number(idArbitro)) {
      throw errorHttp('El borrador de acta fue iniciado por otro árbitro asignado.', 409);
    }
    const [local] = await pool.query(`
      SELECT j.idJugador, j.nombre, j.apellido, j.dni,
        COALESCE(SUM(CASE WHEN js.estado = 'Activa' THEN js.partidosPendientes ELSE 0 END), 0) AS partidosSuspension
      FROM jugador j JOIN equipo e ON e.idEquipo = j.idEquipo
      LEFT JOIN jugador_sancion js ON js.idJugador = j.idJugador AND js.idTorneo = ?
      WHERE j.idEquipo = ? AND e.idUsuario = ? AND j.estado = 'Activo'
      GROUP BY j.idJugador, j.nombre, j.apellido, j.dni
      ORDER BY j.apellido, j.nombre
    `, [partido.idTorneo, partido.idEquipoLocal, req.user.idUsuario]);
    const [visitante] = await pool.query(`
      SELECT j.idJugador, j.nombre, j.apellido, j.dni,
        COALESCE(SUM(CASE WHEN js.estado = 'Activa' THEN js.partidosPendientes ELSE 0 END), 0) AS partidosSuspension
      FROM jugador j JOIN equipo e ON e.idEquipo = j.idEquipo
      LEFT JOIN jugador_sancion js ON js.idJugador = j.idJugador AND js.idTorneo = ?
      WHERE j.idEquipo = ? AND e.idUsuario = ? AND j.estado = 'Activo'
      GROUP BY j.idJugador, j.nombre, j.apellido, j.dni
      ORDER BY j.apellido, j.nombre
    `, [partido.idTorneo, partido.idEquipoVisitante, req.user.idUsuario]);
    const [[asignaciones]] = await pool.query(`
      SELECT COUNT(*) AS cantidad FROM partido_arbitro WHERE idPartido = ?
    `, [idPartido]);
    const [arbitros] = await pool.query(`
      SELECT a.idArbitro, a.nombre, a.apellido, pa.rol
      FROM partido_arbitro pa JOIN arbitro a ON a.idArbitro = pa.idArbitro
      WHERE pa.idPartido = ? ORDER BY pa.rol, a.apellido
    `, [idPartido]);
    const periodos = acta ? (await pool.query(`
      SELECT numeroPeriodo, nombrePeriodo, marcadorLocal, marcadorVisitante
      FROM partido_periodo WHERE idPartido = ? ORDER BY numeroPeriodo
    `, [idPartido]))[0] : [];
    const eventos = acta ? (await pool.query(`
      SELECT pe.idEvento, pe.idJugador, j.nombre, j.apellido, pe.tipoEvento,
        pe.numeroPeriodo, pe.minuto, pe.valor, pe.observaciones
      FROM partido_evento pe
      LEFT JOIN jugador j ON j.idJugador = pe.idJugador
      WHERE pe.idActa = ? ORDER BY pe.numeroPeriodo, pe.minuto, pe.idEvento
    `, [acta.idActa]))[0] : [];

    res.json({
      partido,
      acta: acta || null,
      idArbitro,
      tieneArbitrosAsignados: Number(asignaciones.cantidad) > 0,
      arbitros,
      equipos: [
        { idEquipo: Number(partido.idEquipoLocal), nombre: partido.equipoLocal, jugadores: local },
        { idEquipo: Number(partido.idEquipoVisitante), nombre: partido.equipoVisitante, jugadores: visitante }
      ],
      periodos,
      eventos
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al obtener el acta:', error);
    res.status(500).json({ error: 'No se pudo cargar el acta del partido.' });
  }
};

const validarPeriodos = (periodos, tipoPuntuacion, nombreDisciplina, cerrar) => {
  if (!Array.isArray(periodos)) throw errorHttp('La lista de períodos no es válida.');
  if (periodos.length > 20) throw errorHttp('El acta no puede tener más de 20 períodos.');
  const periodosCompletos = periodos.filter((periodo, index) => {
    const localVacio = periodo.marcadorLocal === '' || periodo.marcadorLocal == null;
    const visitanteVacio = periodo.marcadorVisitante === '' || periodo.marcadorVisitante == null;
    if (localVacio && visitanteVacio && !cerrar) return false;
    if (localVacio || visitanteVacio) throw errorHttp(`Completá ambos marcadores del período ${index + 1}.`);
    return true;
  });
  const voleyPlaya = String(nombreDisciplina || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().includes('playa');
  const setsParaGanar = voleyPlaya ? 2 : 3;
  const maxSets = setsParaGanar * 2 - 1;
  const normalizados = periodosCompletos.map((periodo, index) => {
    if (!numero(periodo.marcadorLocal) || !numero(periodo.marcadorVisitante)) {
      throw errorHttp(`Revisá el marcador del período ${index + 1}.`);
    }
    if (tipoPuntuacion === 'Sets' && Number(periodo.marcadorLocal) === Number(periodo.marcadorVisitante)) {
      throw errorHttp(`El período ${index + 1} de vóley no puede terminar empatado.`);
    }
    return {
      numeroPeriodo: index + 1,
      nombrePeriodo: String(periodo.nombrePeriodo || `Período ${index + 1}`).trim().slice(0, 40),
      marcadorLocal: Number(periodo.marcadorLocal),
      marcadorVisitante: Number(periodo.marcadorVisitante)
    };
  });
  if (tipoPuntuacion === 'Sets' && cerrar) {
    if (normalizados.length < setsParaGanar || normalizados.length > maxSets) {
      throw errorHttp(`El acta debe contener entre ${setsParaGanar} y ${maxSets} sets.`);
    }
    let setsLocal = 0;
    let setsVisitante = 0;
    normalizados.forEach((periodo, index) => {
      if (setsLocal === setsParaGanar || setsVisitante === setsParaGanar) {
        throw errorHttp('No se pueden cargar sets posteriores al set que define el partido.');
      }
      if (periodo.marcadorLocal > periodo.marcadorVisitante) setsLocal += 1;
      else setsVisitante += 1;
      if (index < normalizados.length - 1 && (setsLocal === setsParaGanar || setsVisitante === setsParaGanar)) {
        throw errorHttp('El acta termina después del set que definió el partido.');
      }
    });
    if (Math.max(setsLocal, setsVisitante) !== setsParaGanar) {
      throw errorHttp(`El partido debe llegar a ${setsParaGanar} sets ganados.`);
    }
  }
  return normalizados;
};

export const guardarActaPartido = async (req, res) => {
  const idPartido = Number(req.params.id);
  const idArbitro = req.body?.idArbitro == null || req.body.idArbitro === '' ? null : Number(req.body.idArbitro);
  const cerrar = req.body?.cerrar === true;
  const eventos = req.body?.eventos ?? [];
  const participantes = req.body?.participantes ?? [];
  if (!Number.isInteger(idPartido) || idPartido <= 0
    || (idArbitro !== null && (!Number.isInteger(idArbitro) || idArbitro <= 0))
    || !Array.isArray(eventos) || eventos.length > 200
    || !enterosUnicos(participantes) || participantes.length > 60) {
    return res.status(400).json({ error: 'Los datos del acta no son válidos.' });
  }
  if (!numero(req.body?.marcadorLocal) || !numero(req.body?.marcadorVisitante)) {
    return res.status(400).json({ error: 'Ingresá marcadores válidos para los dos equipos.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const partido = await cargarPartidoPropio(connection, idPartido, req.user.idUsuario, true);
    if (!partido.idEquipoLocal || !partido.idEquipoVisitante) {
      throw errorHttp('El partido todavía no tiene definidos sus dos equipos.', 409);
    }
    if (partido.fechaCierre || ['Finalizado', 'Anulado', 'Pase libre'].includes(partido.estado)) {
      throw errorHttp('El partido ya fue cerrado y su acta no se puede modificar.', 409);
    }

    const [asignaciones] = await connection.query(`
      SELECT pa.idArbitro FROM partido_arbitro pa
      JOIN arbitro a ON a.idArbitro = pa.idArbitro
      WHERE pa.idPartido = ? AND a.idUsuario = ?
    `, [idPartido, req.user.idUsuario]);
    if (asignaciones.length) {
      if (!idArbitro || !asignaciones.some((item) => Number(item.idArbitro) === idArbitro)) {
        throw errorHttp('Seleccioná el árbitro asignado desde el que se está cargando el acta.', 403);
      }
    } else if (idArbitro !== null) {
      throw errorHttp('Los partidos sin árbitro deben cargarse desde la bandeja de partidos sin asignación.', 403);
    }

    const [[actaExistente]] = await connection.query(
      'SELECT idActa, estado, idArbitro FROM acta_partido WHERE idPartido = ? FOR UPDATE', [idPartido]
    );
    if (actaExistente?.estado === 'Cerrada') throw errorHttp('El acta ya está cerrada.', 409);
    if (actaExistente?.idArbitro && Number(actaExistente.idArbitro) !== Number(idArbitro)) {
      throw errorHttp('El borrador de acta pertenece a otro árbitro.', 409);
    }

    const periodos = validarPeriodos(req.body?.periodos ?? [], partido.tipoPuntuacion, partido.nombreDisciplina, cerrar);
    let marcadorLocal = Number(req.body.marcadorLocal);
    let marcadorVisitante = Number(req.body.marcadorVisitante);
    if (partido.tipoPuntuacion === 'Sets') {
      if (periodos.length) {
        marcadorLocal = periodos.filter((periodo) => periodo.marcadorLocal > periodo.marcadorVisitante).length;
        marcadorVisitante = periodos.filter((periodo) => periodo.marcadorVisitante > periodo.marcadorLocal).length;
      } else if (cerrar) {
        throw errorHttp('Agregá los resultados de los sets antes de cerrar el acta.');
      }
    }
    const esEliminatoria = String(partido.tipoEtapa).toLocaleLowerCase().includes('elimin');
    const ganadorMarcador = marcadorLocal > marcadorVisitante
      ? Number(partido.idEquipoLocal)
      : marcadorVisitante > marcadorLocal ? Number(partido.idEquipoVisitante) : null;
    const ganadorSolicitado = req.body?.idEquipoGanador == null || req.body.idEquipoGanador === ''
      ? null : Number(req.body.idEquipoGanador);
    if (ganadorSolicitado && ![Number(partido.idEquipoLocal), Number(partido.idEquipoVisitante)].includes(ganadorSolicitado)) {
      throw errorHttp('El ganador debe ser uno de los equipos que disputan el partido.');
    }
    if (cerrar && esEliminatoria && !ganadorMarcador && !ganadorSolicitado) {
      throw errorHttp('Un partido de eliminación directa no puede cerrarse empatado: indicá quién ganó la definición.');
    }
    if (cerrar && ganadorSolicitado && ganadorMarcador && ganadorSolicitado !== ganadorMarcador) {
      throw errorHttp('El ganador seleccionado no coincide con el marcador final.');
    }
    const ganador = ganadorMarcador || ganadorSolicitado;
    const tipoResolucion = ganadorSolicitado && !ganadorMarcador ? 'Penales' : 'Normal';

    for (const [indice, evento] of eventos.entries()) {
      if (!String(evento.tipoEvento || '').trim() || String(evento.tipoEvento).trim().length > 30
        || !numero(evento.valor ?? 1, { min: 1, max: 999 })
        || (evento.numeroPeriodo != null && evento.numeroPeriodo !== '' && !numero(evento.numeroPeriodo, { min: 1, max: 20 }))
        || (evento.minuto != null && evento.minuto !== '' && !numero(evento.minuto, { min: 0, max: 999 }))) {
        throw errorHttp(`Revisá los datos del evento ${indice + 1}.`);
      }
      const tipoEvento = String(evento.tipoEvento).trim();
      if (['Tarjeta Amarilla', 'Tarjeta Roja'].includes(tipoEvento)
        && !numero(evento.idJugador, { min: 1 })) {
        throw errorHttp(`Seleccioná el jugador que recibió la tarjeta del evento ${indice + 1}.`);
      }
    }
    const jugadorIds = [...new Set([
      ...participantes.map(Number),
      ...eventos.map((evento) => Number(evento.idJugador)).filter((id) => id > 0)
    ])];
    if (eventos.some((evento) => evento.idJugador != null && evento.idJugador !== '' && !numero(evento.idJugador, { min: 1 }))) {
      throw errorHttp('Hay un jugador inválido en los eventos del acta.');
    }
    if (jugadorIds.length) {
      const [jugadores] = await connection.query(`
        SELECT j.idJugador
        FROM jugador j JOIN equipo e ON e.idEquipo = j.idEquipo
        WHERE e.idUsuario = ? AND j.estado = 'Activo'
          AND j.idEquipo IN (?, ?) AND j.idJugador IN (${jugadorIds.map(() => '?').join(', ')})
      `, [req.user.idUsuario, partido.idEquipoLocal, partido.idEquipoVisitante, ...jugadorIds]);
      if (jugadores.length !== jugadorIds.length) {
        throw errorHttp('Todos los jugadores de los eventos deben pertenecer a uno de los equipos y estar activos.');
      }
    }
    const jugadoresEvento = eventos.map((evento) => Number(evento.idJugador)).filter((id) => id > 0);
    if (jugadoresEvento.some((idJugador) => !participantes.map(Number).includes(idJugador))) {
      throw errorHttp('Marcá como participantes a los jugadores registrados en goles, puntos, asistencias o tarjetas.');
    }
    if (cerrar && participantes.length) {
      const [suspendidos] = await connection.query(`
        SELECT js.idJugador, SUM(js.partidosPendientes) AS pendientes,
          CONCAT(j.nombre, ' ', j.apellido) AS nombre
        FROM jugador_sancion js JOIN jugador j ON j.idJugador = js.idJugador
        WHERE js.idTorneo = ? AND js.estado = 'Activa' AND js.partidosPendientes > 0
          AND js.idJugador IN (${participantes.map(() => '?').join(', ')})
        GROUP BY js.idJugador, j.nombre, j.apellido
      `, [partido.idTorneo, ...participantes.map(Number)]);
      if (suspendidos.length) {
        throw errorHttp(`${suspendidos[0].nombre} tiene una suspensión pendiente y no puede figurar como participante.`, 409);
      }
    }

    const observaciones = String(req.body?.observaciones || '').trim().slice(0, 6000) || null;
    let sancionesCreadas = 0;
    await connection.query(`
      INSERT IGNORE INTO torneo_jugador (idTorneo, idJugador, idEquipo)
      SELECT ?, j.idJugador, j.idEquipo
      FROM jugador j
      WHERE j.idEquipo IN (?, ?) AND j.estado = 'Activo'
    `, [partido.idTorneo, partido.idEquipoLocal, partido.idEquipoVisitante]);
    let idActa = actaExistente?.idActa;
    if (idActa) {
      await connection.query(`
        UPDATE acta_partido
        SET idArbitro = ?, observaciones = ?, estado = ?, fechaCierre = ${cerrar ? 'CURRENT_TIMESTAMP' : 'NULL'}
        WHERE idActa = ?
      `, [idArbitro, observaciones, cerrar ? 'Cerrada' : 'Borrador', idActa]);
      await connection.query('DELETE FROM partido_evento WHERE idActa = ?', [idActa]);
    } else {
      const [insertada] = await connection.query(`
        INSERT INTO acta_partido (idPartido, idUsuarioCarga, idArbitro, estado, observaciones, fechaCierre)
        VALUES (?, ?, ?, ?, ?, ${cerrar ? 'CURRENT_TIMESTAMP' : 'NULL'})
      `, [idPartido, req.user.idUsuario, idArbitro, cerrar ? 'Cerrada' : 'Borrador', observaciones]);
      idActa = insertada.insertId;
    }
    if (periodos.length) {
      await connection.query(`
        DELETE FROM partido_periodo WHERE idPartido = ?
      `, [idPartido]);
      await connection.query(`
        INSERT INTO partido_periodo (idPartido, numeroPeriodo, nombrePeriodo, marcadorLocal, marcadorVisitante)
        VALUES ?
      `, [periodos.map((periodo) => [idPartido, periodo.numeroPeriodo, periodo.nombrePeriodo, periodo.marcadorLocal, periodo.marcadorVisitante])]);
    } else {
      await connection.query('DELETE FROM partido_periodo WHERE idPartido = ?', [idPartido]);
    }
    const eventosParaGuardar = [
      ...eventos,
      ...participantes.map((idJugador) => ({
        idJugador: Number(idJugador), tipoEvento: 'Participación', valor: 1,
        numeroPeriodo: null, minuto: null, observaciones: null
      }))
    ];
    if (eventosParaGuardar.length) {
      await connection.query(`
        INSERT INTO partido_evento (
          idActa, idJugador, tipoEvento, numeroPeriodo, minuto, valor, observaciones
        ) VALUES ?
      `, [eventosParaGuardar.map((evento) => [
        idActa,
        evento.idJugador ? Number(evento.idJugador) : null,
        String(evento.tipoEvento).trim(),
        evento.numeroPeriodo ? Number(evento.numeroPeriodo) : null,
        evento.minuto === '' || evento.minuto == null ? null : Number(evento.minuto),
        Number(evento.valor || 1),
        String(evento.observaciones || '').trim().slice(0, 300) || null
      ])]);
    }

    if (cerrar) {
      await connection.query(`
        UPDATE jugador_sancion
        SET estado = CASE WHEN partidosPendientes <= 1 THEN 'Cumplida' ELSE estado END,
            fechaFin = CASE WHEN partidosPendientes <= 1 THEN CURRENT_TIMESTAMP ELSE fechaFin END,
            partidosPendientes = GREATEST(partidosPendientes - 1, 0)
        WHERE idTorneo = ? AND estado = 'Activa' AND partidosPendientes > 0
          AND idJugador IN (
            SELECT j.idJugador FROM jugador j
            WHERE j.idEquipo IN (?, ?)
          )
      `, [partido.idTorneo, partido.idEquipoLocal, partido.idEquipoVisitante]);

      await connection.query(`
        INSERT IGNORE INTO torneo_regla_sancion (
          idTorneo, tipoEvento, cantidadAcumulada, partidosSuspension, reiniciarAcumulacion
        ) VALUES (?, 'Tarjeta Amarilla', 3, 1, 1), (?, 'Tarjeta Roja', 1, 1, 1)
      `, [partido.idTorneo, partido.idTorneo]);

      const [reglasSancion] = await connection.query(`
        SELECT idReglaSancion, tipoEvento, cantidadAcumulada, partidosSuspension
        FROM torneo_regla_sancion WHERE idTorneo = ? ORDER BY cantidadAcumulada
      `, [partido.idTorneo]);
      for (const evento of eventos) {
        const idJugador = Number(evento.idJugador);
        if (!idJugador) continue;
        const regla = reglasSancion.find((item) => item.tipoEvento === String(evento.tipoEvento).trim());
        if (!regla) continue;
        const [[{ totalEventos }]] = await connection.query(`
          SELECT COALESCE(SUM(pe.valor), 0) AS totalEventos
          FROM partido_evento pe
          JOIN acta_partido ap ON ap.idActa = pe.idActa AND ap.estado = 'Cerrada'
          JOIN partido p ON p.idPartido = ap.idPartido
          WHERE p.idTorneo = ? AND pe.idJugador = ? AND pe.tipoEvento = ?
        `, [partido.idTorneo, idJugador, regla.tipoEvento]);
        const [[{ sancionesExistentes }]] = await connection.query(`
          SELECT COUNT(*) AS sancionesExistentes
          FROM jugador_sancion WHERE idTorneo = ? AND idJugador = ? AND idReglaSancion = ?
        `, [partido.idTorneo, idJugador, regla.idReglaSancion]);
        const cantidadSanciones = Math.floor(Number(totalEventos) / Number(regla.cantidadAcumulada))
          - Number(sancionesExistentes);
        for (let indice = 0; indice < cantidadSanciones; indice += 1) {
          const [[eventoOrigen]] = await connection.query(`
            SELECT pe.idEvento FROM partido_evento pe
            JOIN acta_partido ap ON ap.idActa = pe.idActa
            JOIN partido p ON p.idPartido = ap.idPartido
            WHERE p.idTorneo = ? AND pe.idJugador = ? AND pe.tipoEvento = ?
            ORDER BY pe.idEvento DESC LIMIT 1
          `, [partido.idTorneo, idJugador, regla.tipoEvento]);
          await connection.query(`
            INSERT INTO jugador_sancion (
              idTorneo, idJugador, idReglaSancion, idEventoOrigen,
              motivo, partidosPendientes, estado
            ) VALUES (?, ?, ?, ?, ?, ?, 'Activa')
          `, [
            partido.idTorneo, idJugador, regla.idReglaSancion, eventoOrigen?.idEvento || null,
            `${regla.tipoEvento}: acumulación de ${regla.cantidadAcumulada}`, regla.partidosSuspension
          ]);
          sancionesCreadas += 1;
        }
      }

      await connection.query(`
        UPDATE partido
        SET marcadorLocal = ?, marcadorVisitante = ?, idEquipoGanador = ?,
          tipoResolucion = ?, estado = 'Finalizado', fechaCierre = CURRENT_TIMESTAMP
        WHERE idPartido = ?
      `, [marcadorLocal, marcadorVisitante, ganador, tipoResolucion, idPartido]);

      if (esEliminatoria && ganador) {
        await propagarResultadoEliminatoria(connection, partido.idTorneo, idPartido, ganador);
      }
      await cerrarTorneoSiCorresponde(connection, partido.idTorneo);
    }

    await connection.commit();
    res.json({
      message: cerrar ? 'Acta cerrada y resultado actualizado.' : 'Borrador de acta guardado.',
      idActa,
      estado: cerrar ? 'Cerrada' : 'Borrador',
      marcadorLocal,
      marcadorVisitante,
      idEquipoGanador: ganador,
      sancionesCreadas: cerrar ? sancionesCreadas : 0
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al guardar el acta:', error);
    res.status(500).json({ error: 'No se pudo guardar el acta del partido.' });
  } finally {
    connection?.release();
  }
};
