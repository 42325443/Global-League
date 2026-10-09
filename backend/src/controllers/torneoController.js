import pool from '../config/db.js';
import { esFormatoEliminacion, generarFixtureEnTransaccion } from '../services/fixtureService.js';
import {
  calcularEstadisticasEquipos,
  cerrarTorneoSiCorresponde,
  ordenarPosiciones
} from '../services/competitionService.js';
import { propagarResultadoEliminatoria } from '../services/bracketService.js';

const crearError = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });
const CRITERIOS_DESEMPATE = ['Diferencia', 'MarcadorAFavor', 'ResultadoDirecto', 'FairPlay'];
const CRITERIOS_DESEMPATE_PREDETERMINADOS = ['Diferencia', 'MarcadorAFavor', 'ResultadoDirecto'];

const normalizarCriteriosDesempate = (criterios) => {
  const seleccionados = criterios === undefined ? CRITERIOS_DESEMPATE_PREDETERMINADOS : criterios;
  if (!Array.isArray(seleccionados) || seleccionados.length !== 3
    || seleccionados.some((criterio) => !CRITERIOS_DESEMPATE.includes(criterio))
    || new Set(seleccionados).size !== 3) {
    throw crearError('Seleccioná exactamente tres criterios de desempate distintos.');
  }
  return seleccionados;
};

const normalizarReglasSancion = (reglas) => {
  const seleccionadas = reglas === undefined
    ? [
      { tipoEvento: 'Tarjeta Amarilla', cantidadAcumulada: 3, partidosSuspension: 1 },
      { tipoEvento: 'Tarjeta Roja', cantidadAcumulada: 1, partidosSuspension: 1 }
    ]
    : reglas;
  const tiposPermitidos = ['Tarjeta Amarilla', 'Tarjeta Roja'];
  if (!Array.isArray(seleccionadas) || seleccionadas.length !== 2
    || new Set(seleccionadas.map((regla) => regla?.tipoEvento)).size !== 2
    || seleccionadas.some((regla) => (
      !tiposPermitidos.includes(regla?.tipoEvento)
      || !Number.isInteger(Number(regla.cantidadAcumulada))
      || Number(regla.cantidadAcumulada) < 1 || Number(regla.cantidadAcumulada) > 100
      || !Number.isInteger(Number(regla.partidosSuspension))
      || Number(regla.partidosSuspension) < 1 || Number(regla.partidosSuspension) > 20
    ))) {
    throw crearError('Configurá reglas válidas para tarjetas amarillas y rojas.');
  }
  return seleccionadas.map((regla) => ({
    tipoEvento: regla.tipoEvento,
    cantidadAcumulada: Number(regla.cantidadAcumulada),
    partidosSuspension: Number(regla.partidosSuspension)
  }));
};

const crearReglasDePuntuacion = async (connection, idTorneo, tipoPuntuacion, nombreDisciplina = '') => {
  let reglas;
  if (tipoPuntuacion === 'Sets') {
    const voleyPlaya = String(nombreDisciplina).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().includes('playa');
    reglas = voleyPlaya
      ? [
        [1, 'Victoria', 2, null, null, 0, 3],
        [2, 'Victoria', 2, null, 1, null, 2],
        [3, 'Derrota', 1, null, 2, null, 1],
        [4, 'Derrota', null, null, null, null, 0]
      ]
      : [
        [1, 'Victoria', 3, null, null, 1, 3],
        [2, 'Victoria', 3, null, 2, null, 2],
        [3, 'Derrota', 2, null, 3, null, 1],
        [4, 'Derrota', null, null, null, null, 0]
      ];
  } else if (tipoPuntuacion === 'Puntos') {
    reglas = [
      [1, 'Victoria', null, null, null, null, 2],
      [2, 'Derrota', null, null, null, null, 1],
      [3, 'Empate', null, null, null, null, 0]
    ];
  } else {
    reglas = [
      [1, 'Victoria', null, null, null, null, 3],
      [2, 'Empate', null, null, null, null, 1],
      [3, 'Derrota', null, null, null, null, 0]
    ];
  }

  await connection.query(`
    INSERT INTO torneo_regla_puntuacion (
      idTorneo, prioridad, tipoResultado,
      setsFavorMin, setsFavorMax, setsContraMin, setsContraMax, puntosTabla
    ) VALUES ?
  `, [reglas.map((regla) => [idTorneo, ...regla])]);
};

const estadoTorneoCalculadoSql = `
  CASE
    WHEN t.estadoGestion = 'Cancelado' THEN 'Cancelado'
    WHEN t.estadoGestion = 'Suspendido' THEN 'Suspendido'
    WHEN t.estadoGestion = 'Cerrado' OR (
      EXISTS (SELECT 1 FROM partido p WHERE p.idTorneo = t.idTorneo)
      AND NOT EXISTS (
        SELECT 1 FROM partido p
        WHERE p.idTorneo = t.idTorneo
          AND COALESCE(p.estado, 'Pendiente') NOT IN ('Finalizado', 'Anulado', 'Pase libre')
      )
    ) THEN 'Finalizado'
    WHEN CURDATE() < t.fechaInicio THEN 'Próximo'
    ELSE 'En Curso'
  END AS estadoCalculado
`;

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
        ${estadoTorneoCalculadoSql},
        (DATE_SUB(CAST(t.fechaInicio AS DATETIME), INTERVAL 24 HOUR) > CURRENT_TIMESTAMP
          AND t.estadoGestion NOT IN ('Cerrado', 'Cancelado', 'Suspendido')) AS permiteCambiarEquipos,
        d.nombreDisciplina, dep.nombreDeporte, f.nombreFormato,
        (SELECT COUNT(*) FROM torneo_equipo te WHERE te.idTorneo = t.idTorneo AND te.estadoParticipacion <> 'Baja') AS equiposInscriptos
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
          ${estadoTorneoCalculadoSql},
          (DATE_SUB(CAST(t.fechaInicio AS DATETIME), INTERVAL 24 HOUR) > CURRENT_TIMESTAMP
            AND t.estadoGestion NOT IN ('Cerrado', 'Cancelado', 'Suspendido')) AS permiteCambiarEquipos,
          d.nombreDisciplina, dep.nombreDeporte, f.nombreFormato,
          (SELECT COUNT(*) FROM torneo_equipo te WHERE te.idTorneo = t.idTorneo AND te.estadoParticipacion <> 'Baja') AS equiposInscriptos
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
        estado: row.estadoCalculado || 'Próximo'
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
  let criteriosDesempate;
  let reglasSancion;
  try {
    idsEquipos = normalizarIdsEquipos(equiposIds);
    criteriosDesempate = normalizarCriteriosDesempate(req.body?.criteriosDesempate);
    reglasSancion = normalizarReglasSancion(req.body?.reglasSancion);
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
    const [[disciplina]] = await connection.query(
      'SELECT tipoPuntuacion, nombreDisciplina FROM disciplina WHERE idDisciplina = ?',
      [disciplinaId]
    );
    if (!disciplina) throw crearError('La disciplina seleccionada no existe.');
    const [[formato]] = await connection.query('SELECT nombreFormato FROM formato WHERE idFormato = ?', [formatoId]);
    if (!formato) throw crearError('El formato seleccionado no existe.');

    const [result] = await connection.query(
      `INSERT INTO torneo (idUsuario, nombreTorneo, idDisciplina, idFormato, fechaInicio, descripcionTorneo, fechaFin, ubicacion, cantidadEquipos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.idUsuario, nombreTorneo.trim(), disciplinaId, formatoId, fechaInicio, descripcionTorneo || null, fechaFin || null, ubicacion || null, limiteEquipos]
    );

    const nuevoIdTorneo = result.insertId;

    const inscripciones = idsEquipos.map((idEquipo) => [nuevoIdTorneo, idEquipo]);
    await connection.query('INSERT INTO torneo_equipo (idTorneo, idEquipo) VALUES ?', [inscripciones]);
    await connection.query(`
      INSERT INTO torneo_jugador (idTorneo, idJugador, idEquipo)
      SELECT ?, j.idJugador, j.idEquipo
      FROM jugador j
      JOIN torneo_equipo te ON te.idEquipo = j.idEquipo AND te.idTorneo = ?
      WHERE j.estado = 'Activo'
    `, [nuevoIdTorneo, nuevoIdTorneo]);
    await connection.query(
      'INSERT INTO torneo_criterio_desempate (idTorneo, orden, criterio) VALUES ?',
      [criteriosDesempate.map((criterio, indice) => [nuevoIdTorneo, indice + 1, criterio])]
    );
    await crearReglasDePuntuacion(connection, nuevoIdTorneo, disciplina.tipoPuntuacion, disciplina.nombreDisciplina);
    await connection.query(`
      INSERT INTO torneo_regla_sancion (
        idTorneo, tipoEvento, cantidadAcumulada, partidosSuspension, reiniciarAcumulacion
      ) VALUES ?
    `, [reglasSancion.map((regla) => [nuevoIdTorneo, regla.tipoEvento, regla.cantidadAcumulada, regla.partidosSuspension, 1])]);
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
  const idTorneo = Number(req.params.id);
  const equiposIds = req.body?.equiposIds;

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
    const [[torneoVisible]] = await connection.query(
      'SELECT idTorneo FROM torneo WHERE idTorneo = ? AND idUsuario = ?', [idTorneo, req.user.idUsuario]
    );
    if (!torneoVisible) throw crearError('No se encontró el torneo.', 404);
    const [partidosBloqueados] = await connection.query(
      'SELECT idPartido, idEquipoLocal, idEquipoVisitante FROM partido WHERE idTorneo = ? ORDER BY idPartido FOR UPDATE', [idTorneo]
    );
    const [[torneo]] = await connection.query(`
      SELECT t.idDisciplina, t.cantidadEquipos, t.estadoGestion,
        f.nombreFormato,
        DATE_SUB(CAST(t.fechaInicio AS DATETIME), INTERVAL 24 HOUR) > CURRENT_TIMESTAMP AS dentroDelPlazo
      FROM torneo t JOIN formato f ON f.idFormato = t.idFormato
      WHERE t.idTorneo = ? AND t.idUsuario = ? FOR UPDATE
    `, [idTorneo, req.user.idUsuario]);
    if (!torneo) throw crearError('No se encontró el torneo.', 404);
    if (!Number(torneo.dentroDelPlazo) || ['Cerrado', 'Cancelado', 'Suspendido'].includes(torneo.estadoGestion)) {
      throw crearError('Los equipos solo se pueden cambiar hasta 24 horas antes del inicio del torneo.', 409);
    }
    if (torneo.cantidadEquipos != null && idsEquipos.length > Number(torneo.cantidadEquipos)) {
      throw crearError(`El torneo permite hasta ${torneo.cantidadEquipos} equipos.`);
    }

    await validarEquiposDeDisciplina(connection, idsEquipos, torneo.idDisciplina, req.user.idUsuario);
    const [[{ cantidadActas }]] = await connection.query(`
      SELECT COUNT(*) AS cantidadActas
      FROM acta_partido ap JOIN partido p ON p.idPartido = ap.idPartido
      WHERE p.idTorneo = ?
    `, [idTorneo]);
    if (Number(cantidadActas) > 0) {
      throw crearError('No se puede rehacer el fixture cuando ya existe un acta cargada.', 409);
    }

    const [inscripciones] = await connection.query(`
      SELECT idEquipo, estadoParticipacion FROM torneo_equipo WHERE idTorneo = ? FOR UPDATE
    `, [idTorneo]);
    const idsActuales = inscripciones
      .filter((item) => item.estadoParticipacion !== 'Baja')
      .map((item) => Number(item.idEquipo))
      .sort((a, b) => a - b);
    const idsSolicitados = [...idsEquipos].sort((a, b) => a - b);
    const participantesCambiaron = idsActuales.length !== idsSolicitados.length
      || idsActuales.some((idEquipo, indice) => idEquipo !== idsSolicitados[indice]);
    const cantidadPartidos = partidosBloqueados.length;
    const fixtureIncluyeEquipoRetirado = partidosBloqueados.some((partido) => (
      [partido.idEquipoLocal, partido.idEquipoVisitante].some((idEquipo) => (
        idEquipo != null && !idsSolicitados.includes(Number(idEquipo))
      ))
    ));

    if (!participantesCambiaron && Number(cantidadPartidos) > 0 && !fixtureIncluyeEquipoRetirado) {
      await connection.commit();
      return res.json({ message: 'Los participantes no cambiaron; se conservó el fixture actual.', fixtureRegenerado: false });
    }

    if (Number(cantidadPartidos) > 0) {
      await connection.query(`
        UPDATE reserva_cancha SET idPartido = NULL, estado = 'Cancelada'
        WHERE idPartido IN (SELECT idPartido FROM partido WHERE idTorneo = ?)
      `, [idTorneo]);
      await connection.query(
        'DELETE FROM partido_arbitro WHERE idPartido IN (SELECT idPartido FROM partido WHERE idTorneo = ?)',
        [idTorneo]
      );
      await connection.query('DELETE FROM partido WHERE idTorneo = ?', [idTorneo]);
    }

    const placeholders = idsEquipos.map(() => '?').join(', ');
    await connection.query(`
      DELETE FROM torneo_equipo
      WHERE idTorneo = ? AND idEquipo NOT IN (${placeholders})
    `, [idTorneo, ...idsEquipos]);
    await connection.query(`
      INSERT INTO torneo_equipo (idTorneo, idEquipo, estadoParticipacion)
      VALUES ?
      ON DUPLICATE KEY UPDATE estadoParticipacion = 'Inscripto', fechaBaja = NULL,
        motivoBaja = NULL, politicaBaja = NULL
    `, [idsEquipos.map((idEquipo) => [idTorneo, idEquipo, 'Inscripto'])]);
    await connection.query(`
      INSERT INTO torneo_jugador (idTorneo, idJugador, idEquipo)
      SELECT ?, j.idJugador, j.idEquipo
      FROM jugador j
      WHERE j.estado = 'Activo' AND j.idEquipo IN (${placeholders})
      ON DUPLICATE KEY UPDATE estado = 'Habilitado'
    `, [idTorneo, ...idsEquipos]);

    const fixture = await generarFixtureEnTransaccion(
      connection, idTorneo, idsEquipos, torneo.nombreFormato
    );
    await connection.commit();
    res.json({ message: 'Participantes actualizados y fixture regenerado correctamente.', fixtureRegenerado: true, ...fixture });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al actualizar equipos', details: error.status ? undefined : error.message });
  } finally {
    connection?.release();
  }
};

export const actualizarCriteriosDesempate = async (req, res) => {
  const idTorneo = Number(req.params.id);
  let criterios;
  try {
    criterios = normalizarCriteriosDesempate(req.body?.criteriosDesempate);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[torneoVisible]] = await connection.query(
      'SELECT idTorneo FROM torneo WHERE idTorneo = ? AND idUsuario = ?', [idTorneo, req.user.idUsuario]
    );
    if (!torneoVisible) throw crearError('No se encontró el torneo.', 404);
    await connection.query(
      'SELECT idPartido FROM partido WHERE idTorneo = ? ORDER BY idPartido FOR UPDATE', [idTorneo]
    );
    const [[torneo]] = await connection.query(`
      SELECT t.idTorneo,
        CAST(t.fechaInicio AS DATETIME) > CURRENT_TIMESTAMP AS antesDelInicio,
        t.estadoGestion
      FROM torneo t WHERE t.idTorneo = ? AND t.idUsuario = ? FOR UPDATE
    `, [idTorneo, req.user.idUsuario]);
    if (!torneo) throw crearError('No se encontró el torneo.', 404);
    if (!Number(torneo.antesDelInicio) || ['Cerrado', 'Cancelado', 'Suspendido'].includes(torneo.estadoGestion)) {
      throw crearError('Los criterios se pueden editar únicamente antes del inicio del torneo.', 409);
    }
    const [[{ cantidadActasCerradas }]] = await connection.query(`
      SELECT COUNT(*) AS cantidadActasCerradas
      FROM acta_partido ap JOIN partido p ON p.idPartido = ap.idPartido
      WHERE p.idTorneo = ? AND ap.estado = 'Cerrada'
    `, [idTorneo]);
    if (Number(cantidadActasCerradas) > 0) {
      throw crearError('No se puede cambiar el desempate luego de cerrar la primera acta.', 409);
    }

    await connection.query('DELETE FROM torneo_criterio_desempate WHERE idTorneo = ?', [idTorneo]);
    await connection.query(
      'INSERT INTO torneo_criterio_desempate (idTorneo, orden, criterio) VALUES ?',
      [criterios.map((criterio, indice) => [idTorneo, indice + 1, criterio])]
    );
    await connection.commit();
    res.json({ message: 'Orden de desempate actualizado.', criteriosDesempate: criterios });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al actualizar criterios de desempate:', error);
    res.status(500).json({ error: 'No se pudo actualizar el orden de desempate.' });
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
        p.idEquipoGanador,
        p.tipoResolucion,
        p.fechaCierre,
        p.estado,
        DATE_FORMAT(p.fechaHoraInicio, '%Y-%m-%dT%H:%i:%s') AS fechaHoraInicio,
        DATE_FORMAT(p.fechaHoraFin, '%Y-%m-%dT%H:%i:%s') AS fechaHoraFin
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

export const getPosicionesTorneo = async (req, res) => {
  const idTorneo = Number(req.params.id);
  if (!Number.isInteger(idTorneo) || idTorneo <= 0) {
    return res.status(400).json({ error: 'El torneo seleccionado no es válido.' });
  }
  try {
    const [[torneo]] = await pool.query(`
      SELECT t.idTorneo, t.nombreTorneo, d.nombreDisciplina, d.tipoPuntuacion,
        dep.nombreDeporte, f.nombreFormato,
        (CAST(t.fechaInicio AS DATETIME) > CURRENT_TIMESTAMP
          AND t.estadoGestion NOT IN ('Cerrado', 'Cancelado', 'Suspendido')) AS permiteModificarCriterios
      FROM torneo t
      JOIN disciplina d ON d.idDisciplina = t.idDisciplina
      JOIN deporte dep ON dep.idDeporte = d.idDeporte
      JOIN formato f ON f.idFormato = t.idFormato
      WHERE t.idTorneo = ? AND t.idUsuario = ?
    `, [idTorneo, req.user.idUsuario]);
    if (!torneo) return res.status(404).json({ error: 'No se encontró el torneo.' });

    const [equipos, partidos, periodos, reglas, criterios, eventosFairPlay] = await Promise.all([
      pool.query(`
        SELECT t.idTorneo, t.nombreTorneo, d.nombreDisciplina, d.tipoPuntuacion,
          dep.nombreDeporte, f.nombreFormato, te.estadoParticipacion,
          e.idEquipo, e.nombreEquipo
        FROM torneo_equipo te
        JOIN torneo t ON t.idTorneo = te.idTorneo
        JOIN equipo e ON e.idEquipo = te.idEquipo
        JOIN disciplina d ON d.idDisciplina = t.idDisciplina
        JOIN deporte dep ON dep.idDeporte = d.idDeporte
        JOIN formato f ON f.idFormato = t.idFormato
        WHERE te.idTorneo = ? AND t.idUsuario = ? AND e.idUsuario = ?
        ORDER BY e.nombreEquipo
      `, [idTorneo, req.user.idUsuario, req.user.idUsuario]),
      pool.query(`
        SELECT p.idPartido, p.idTorneo, p.idEquipoLocal, p.idEquipoVisitante,
          p.marcadorLocal, p.marcadorVisitante, p.idEquipoGanador,
          p.tipoEtapa, p.tipoResolucion
        FROM partido p
        JOIN torneo t ON t.idTorneo = p.idTorneo
        LEFT JOIN acta_partido ap ON ap.idPartido = p.idPartido
        WHERE p.idTorneo = ? AND t.idUsuario = ?
          AND (p.fechaCierre IS NOT NULL OR ap.fechaCierre IS NOT NULL)
          AND p.idEquipoLocal IS NOT NULL AND p.idEquipoVisitante IS NOT NULL
          AND p.marcadorLocal IS NOT NULL AND p.marcadorVisitante IS NOT NULL
          AND (p.tipoResolucion IS NULL OR p.tipoResolucion <> 'Anulado')
      `, [idTorneo, req.user.idUsuario]),
      pool.query(`
        SELECT pp.idPartido, pp.numeroPeriodo, pp.marcadorLocal, pp.marcadorVisitante
        FROM partido_periodo pp JOIN partido p ON p.idPartido = pp.idPartido
        JOIN torneo t ON t.idTorneo = p.idTorneo
        LEFT JOIN acta_partido ap ON ap.idPartido = p.idPartido
        WHERE p.idTorneo = ? AND t.idUsuario = ?
          AND (p.fechaCierre IS NOT NULL OR ap.fechaCierre IS NOT NULL)
        ORDER BY pp.idPartido, pp.numeroPeriodo
      `, [idTorneo, req.user.idUsuario]),
      pool.query(`
        SELECT r.idTorneo, r.prioridad, r.tipoResultado,
          r.setsFavorMin, r.setsFavorMax, r.setsContraMin, r.setsContraMax,
          r.puntosTabla
        FROM torneo_regla_puntuacion r JOIN torneo t ON t.idTorneo = r.idTorneo
        WHERE r.idTorneo = ? AND t.idUsuario = ? ORDER BY r.prioridad
      `, [idTorneo, req.user.idUsuario]),
      pool.query(`
        SELECT c.orden, c.criterio
        FROM torneo_criterio_desempate c JOIN torneo t ON t.idTorneo = c.idTorneo
        WHERE c.idTorneo = ? AND t.idUsuario = ? ORDER BY c.orden
      `, [idTorneo, req.user.idUsuario]),
      pool.query(`
        SELECT p.idTorneo, j.idEquipo, pe.tipoEvento, pe.valor
        FROM partido_evento pe JOIN acta_partido ap ON ap.idActa = pe.idActa
        JOIN partido p ON p.idPartido = ap.idPartido
        JOIN torneo t ON t.idTorneo = p.idTorneo
        JOIN jugador j ON j.idJugador = pe.idJugador
        WHERE p.idTorneo = ? AND t.idUsuario = ?
          AND (p.fechaCierre IS NOT NULL OR ap.fechaCierre IS NOT NULL)
      `, [idTorneo, req.user.idUsuario])
    ]);
    const calculadas = calcularEstadisticasEquipos({
      equipos: equipos[0], partidos: partidos[0], periodos: periodos[0],
      reglas: reglas[0], eventosFairPlay: eventosFairPlay[0]
    });
    const posiciones = ordenarPosiciones({
      estadisticas: calculadas.estadisticas,
      partidos: calculadas.partidosCerrados,
      periodos: periodos[0],
      criterios: criterios[0].map((item) => item.criterio),
      reglas: reglas[0]
    });
    res.json({
      torneo,
      posiciones,
      criteriosDesempate: criterios[0].map((item) => item.criterio),
      permiteModificarCriterios: Boolean(Number(torneo.permiteModificarCriterios))
    });
  } catch (error) {
    console.error('Error al calcular la tabla del torneo:', error);
    res.status(500).json({ error: 'No se pudo calcular la tabla de posiciones.' });
  }
};

export const darDeBajaEquipo = async (req, res) => {
  const idTorneo = Number(req.params.id);
  const idEquipo = Number(req.body?.idEquipo);
  const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo.trim() : '';
  const politicaSolicitada = req.body?.politicaBaja;
  if (!Number.isInteger(idTorneo) || idTorneo <= 0 || !Number.isInteger(idEquipo) || idEquipo <= 0
    || !motivo || motivo.length > 500) {
    return res.status(400).json({ error: 'Seleccioná un equipo y agregá un motivo de hasta 500 caracteres.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[torneo]] = await connection.query(`
      SELECT t.idTorneo, f.nombreFormato, d.tipoPuntuacion, d.nombreDisciplina,
        (CURDATE() >= t.fechaInicio OR EXISTS (
          SELECT 1 FROM partido p WHERE p.idTorneo = t.idTorneo AND p.fechaCierre IS NOT NULL
        )) AS iniciado
      FROM torneo t JOIN formato f ON f.idFormato = t.idFormato
      JOIN disciplina d ON d.idDisciplina = t.idDisciplina
      WHERE t.idTorneo = ? AND t.idUsuario = ? FOR UPDATE
    `, [idTorneo, req.user.idUsuario]);
    if (!torneo) throw crearError('No se encontró el torneo.', 404);
    const [[inscripcion]] = await connection.query(`
      SELECT estadoParticipacion FROM torneo_equipo
      WHERE idTorneo = ? AND idEquipo = ? FOR UPDATE
    `, [idTorneo, idEquipo]);
    if (!inscripcion) throw crearError('El equipo no está inscripto en este torneo.', 404);
    if (inscripcion.estadoParticipacion === 'Baja') throw crearError('El equipo ya fue dado de baja.', 409);

    const eliminatoria = esFormatoEliminacion(torneo.nombreFormato);
    const iniciado = Boolean(torneo.iniciado);
    if (!iniciado) {
      throw crearError('Antes del inicio, quitá el equipo desde “Administrar equipos” para regenerar el fixture sin asignar puntos ni avances automáticos.', 409);
    }
    if (iniciado && !eliminatoria && !['VictoriaAdministrativa', 'SinPuntos'].includes(politicaSolicitada)) {
      throw crearError('Para una baja en curso elegí victoria administrativa o no asignar puntos.');
    }
    const politicaBaja = iniciado && !eliminatoria ? politicaSolicitada : 'Pendiente';
    await connection.query(`
      UPDATE torneo_equipo
      SET estadoParticipacion = 'Baja', fechaBaja = CURRENT_TIMESTAMP,
        motivoBaja = ?, politicaBaja = ?
      WHERE idTorneo = ? AND idEquipo = ?
    `, [motivo, politicaBaja, idTorneo, idEquipo]);

    const [pendientes] = await connection.query(`
      SELECT idPartido, idEquipoLocal, idEquipoVisitante, tipoEtapa
      FROM partido
      WHERE idTorneo = ? AND (idEquipoLocal = ? OR idEquipoVisitante = ?)
        AND fechaCierre IS NULL AND estado NOT IN ('Finalizado', 'Anulado')
      FOR UPDATE
    `, [idTorneo, idEquipo, idEquipo]);
    let partidosResueltos = 0;
    for (const partido of pendientes) {
      const rival = Number(partido.idEquipoLocal) === idEquipo
        ? (partido.idEquipoVisitante ? Number(partido.idEquipoVisitante) : null)
        : (partido.idEquipoLocal ? Number(partido.idEquipoLocal) : null);
      await connection.query(`
        UPDATE reserva_cancha SET estado = 'Cancelada'
        WHERE idPartido = ? AND estado <> 'Cancelada'
      `, [partido.idPartido]);
      await connection.query('DELETE FROM partido_arbitro WHERE idPartido = ?', [partido.idPartido]);

      if (!eliminatoria && !iniciado) {
        await connection.query(`
          UPDATE partido SET idCancha = NULL, fechaHoraInicio = NULL, fechaHoraFin = NULL,
            marcadorLocal = NULL, marcadorVisitante = NULL, idEquipoGanador = NULL,
            tipoResolucion = 'Anulado', estado = 'Anulado'
          WHERE idPartido = ?
        `, [partido.idPartido]);
        partidosResueltos += 1;
        continue;
      }

      if (!eliminatoria) {
        const ganaLocal = politicaSolicitada === 'VictoriaAdministrativa'
          ? (Number(partido.idEquipoLocal) === idEquipo ? rival : Number(partido.idEquipoLocal))
          : null;
        const disciplinaNormalizada = String(torneo.nombreDisciplina || '')
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
        const marcadorForfeit = politicaSolicitada !== 'VictoriaAdministrativa'
          ? 0
          : torneo.tipoPuntuacion === 'Goles'
            ? 3
            : torneo.tipoPuntuacion === 'Sets'
              ? disciplinaNormalizada.includes('playa') ? 2 : 3
              : 0;
        const marcadorLocal = ganaLocal && Number(partido.idEquipoLocal) === ganaLocal ? marcadorForfeit : 0;
        const marcadorVisitante = ganaLocal && Number(partido.idEquipoVisitante) === ganaLocal ? marcadorForfeit : 0;
        await connection.query(`
          UPDATE partido SET idCancha = NULL, fechaHoraInicio = NULL, fechaHoraFin = NULL,
            marcadorLocal = ?, marcadorVisitante = ?, idEquipoGanador = ?,
            tipoResolucion = ?, estado = 'Finalizado', fechaCierre = CURRENT_TIMESTAMP
          WHERE idPartido = ?
        `, [marcadorLocal, marcadorVisitante, ganaLocal, politicaSolicitada, partido.idPartido]);
        partidosResueltos += 1;
        continue;
      }

      const estado = rival ? 'Pase libre' : 'Anulado';
      await connection.query(`
        UPDATE partido SET idCancha = NULL, fechaHoraInicio = NULL, fechaHoraFin = NULL,
          marcadorLocal = NULL, marcadorVisitante = NULL, idEquipoGanador = ?,
          tipoResolucion = ?, estado = ?
        WHERE idPartido = ?
      `, [rival, rival ? 'PaseRival' : 'Anulado', estado, partido.idPartido]);
      await propagarResultadoEliminatoria(connection, idTorneo, partido.idPartido, rival);
      partidosResueltos += 1;
    }

    await cerrarTorneoSiCorresponde(connection, idTorneo);

    await connection.commit();
    res.json({
      message: 'La baja fue registrada y se procesaron los partidos pendientes.',
      idTorneo, idEquipo, partidosResueltos, politicaBaja
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error al dar de baja el equipo:', error);
    res.status(500).json({ error: 'No se pudo registrar la baja del equipo.' });
  } finally {
    connection?.release();
  }
};
