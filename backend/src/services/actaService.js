import pool from '../config/db.js';

export const crearError = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });

export const TIPOS_EVENTO = ['Gol', 'Tarjeta Amarilla', 'Tarjeta Roja', 'Asistencia', 'Sanción', 'Otro'];
export const EQUIPOS_EVENTO = ['Local', 'Visitante'];

export const validarMarcador = (valor, campo) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0 || numero > 999) {
    throw crearError(`El marcador de ${campo} debe ser un número entero entre 0 y 999.`);
  }
  return numero;
};

// Devuelve el partido solo si pertenece al usuario autenticado.
export const obtenerPartidoPropio = async (idPartido, idUsuario, connection = pool) => {
  const [[partido]] = await connection.query(`
    SELECT
      p.idPartido,
      p.idTorneo,
      p.idEquipoLocal,
      p.idEquipoVisitante,
      p.marcadorLocal,
      p.marcadorVisitante,
      p.estado,
      p.tipoEtapa,
      p.jornada,
      local.nombreEquipo AS equipoLocal,
      visitante.nombreEquipo AS equipoVisitante
    FROM partido p
    JOIN torneo t ON t.idTorneo = p.idTorneo
    LEFT JOIN equipo local ON local.idEquipo = p.idEquipoLocal
    LEFT JOIN equipo visitante ON visitante.idEquipo = p.idEquipoVisitante
    WHERE p.idPartido = ? AND t.idUsuario = ?
  `, [idPartido, idUsuario]);

  if (!partido) throw crearError('No se encontró el partido.', 404);
  return partido;
};

export const obtenerActaDePartido = async (idPartido, connection = pool) => {
  const [[acta]] = await connection.query(
    'SELECT * FROM acta_partido WHERE idPartido = ?',
    [idPartido]
  );
  return acta || null;
};

export const obtenerIncidencias = async (idActa, partido, connection = pool) => {
  if (!idActa) return [];
  const [filas] = await connection.query(`
    SELECT
      e.idEvento,
      e.idJugador,
      e.tipoEvento,
      e.minuto,
      e.valor,
      e.observaciones,
      j.nombre AS nombreJugador,
      j.apellido AS apellidoJugador,
      j.idEquipo AS idEquipoJugador
    FROM partido_evento e
    LEFT JOIN jugador j ON j.idJugador = e.idJugador
    WHERE e.idActa = ?
    ORDER BY e.minuto IS NULL, e.minuto, e.idEvento
  `, [idActa]);

  return filas.map((fila) => {
    const observacionesOriginales = fila.observaciones || '';
    let equipo = null;
    if (Number(fila.idEquipoJugador) === Number(partido.idEquipoLocal)) equipo = 'Local';
    else if (Number(fila.idEquipoJugador) === Number(partido.idEquipoVisitante)) equipo = 'Visitante';

    let observaciones = observacionesOriginales;
    if (!equipo) {
      const prefijo = observaciones.match(/^\[(Local|Visitante)\]\s*/i);
      if (prefijo) {
        equipo = prefijo[1].toLowerCase() === 'local' ? 'Local' : 'Visitante';
        observaciones = observaciones.slice(prefijo[0].length);
      }
    }

    return {
      idEvento: fila.idEvento,
      idJugador: fila.idJugador,
      nombreJugador: fila.nombreJugador ? `${fila.nombreJugador} ${fila.apellidoJugador}` : null,
      tipoEvento: fila.tipoEvento,
      minuto: fila.minuto,
      valor: fila.valor,
      equipo,
      observaciones,
    };
  });
};

export const validarArbitro = async (idArbitro, idUsuario, connection = pool) => {
  if (idArbitro === null || idArbitro === undefined || idArbitro === '') return null;
  const numero = Number(idArbitro);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw crearError('El árbitro seleccionado no es válido.');
  }
  const [[arbitro]] = await connection.query(`
    SELECT idArbitro
    FROM arbitro
    WHERE idArbitro = ? AND estado = 'Activo' AND (idUsuario IS NULL OR idUsuario = ?)
  `, [numero, idUsuario]);
  if (!arbitro) throw crearError('No se encontró el árbitro seleccionado.', 404);
  return numero;
};

export const validarJugadorDelPartido = async (idJugador, partido, connection = pool) => {
  if (idJugador === null || idJugador === undefined || idJugador === '') return null;
  const numero = Number(idJugador);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw crearError('El jugador seleccionado no es válido.');
  }
  const [[jugador]] = await connection.query(
    'SELECT idJugador FROM jugador WHERE idJugador = ?',
    [numero]
  );
  if (!jugador) throw crearError('No se encontró el jugador seleccionado.', 404);
  return numero;
};
