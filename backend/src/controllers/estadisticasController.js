import pool from '../config/db.js';
import {
  calcularEstadisticasEquipos,
  ordenarPosiciones
} from '../services/competitionService.js';

const etiquetaDeporte = (nombre = '') => {
  const normalizado = nombre.trim().toLocaleLowerCase();
  if (normalizado === 'basketball') return 'Básquet';
  if (normalizado === 'volleyball') return 'Vóley';
  return nombre;
};

export const getEstadisticas = async (req, res) => {
  try {
    const idUsuario = req.user.idUsuario;
    const [equipos, partidos, periodos, reglas, criterios, eventosFairPlay, destacados] = await Promise.all([
      pool.query(`
        SELECT
          t.idTorneo, t.nombreTorneo, d.nombreDisciplina, d.tipoPuntuacion,
          dep.nombreDeporte, f.nombreFormato, te.estadoParticipacion,
          e.idEquipo, e.nombreEquipo
        FROM torneo t
        JOIN torneo_equipo te ON te.idTorneo = t.idTorneo
        JOIN equipo e ON e.idEquipo = te.idEquipo
        JOIN disciplina d ON d.idDisciplina = t.idDisciplina
        JOIN deporte dep ON dep.idDeporte = d.idDeporte
        JOIN formato f ON f.idFormato = t.idFormato
        WHERE t.idUsuario = ? AND e.idUsuario = ?
        ORDER BY t.idTorneo DESC, e.nombreEquipo
      `, [idUsuario, idUsuario]),
      pool.query(`
        SELECT
          p.idPartido, p.idTorneo, p.idEquipoLocal, p.idEquipoVisitante,
          p.marcadorLocal, p.marcadorVisitante, p.idEquipoGanador,
          p.tipoEtapa, p.tipoResolucion
        FROM partido p
        JOIN torneo t ON t.idTorneo = p.idTorneo
        LEFT JOIN acta_partido ap ON ap.idPartido = p.idPartido
        WHERE t.idUsuario = ?
          AND (p.fechaCierre IS NOT NULL OR ap.fechaCierre IS NOT NULL)
          AND p.idEquipoLocal IS NOT NULL AND p.idEquipoVisitante IS NOT NULL
          AND p.marcadorLocal IS NOT NULL AND p.marcadorVisitante IS NOT NULL
          AND (p.tipoResolucion IS NULL OR p.tipoResolucion <> 'Anulado')
        ORDER BY p.idPartido
      `, [idUsuario]),
      pool.query(`
        SELECT pp.idPartido, pp.numeroPeriodo, pp.marcadorLocal, pp.marcadorVisitante
        FROM partido_periodo pp
        JOIN partido p ON p.idPartido = pp.idPartido
        JOIN torneo t ON t.idTorneo = p.idTorneo
        LEFT JOIN acta_partido ap ON ap.idPartido = p.idPartido
        WHERE t.idUsuario = ?
          AND (p.fechaCierre IS NOT NULL OR ap.fechaCierre IS NOT NULL)
        ORDER BY pp.idPartido, pp.numeroPeriodo
      `, [idUsuario]),
      pool.query(`
        SELECT r.idTorneo, r.prioridad, r.tipoResultado,
          r.setsFavorMin, r.setsFavorMax, r.setsContraMin, r.setsContraMax,
          r.puntosTabla
        FROM torneo_regla_puntuacion r
        JOIN torneo t ON t.idTorneo = r.idTorneo
        WHERE t.idUsuario = ?
        ORDER BY r.idTorneo, r.prioridad
      `, [idUsuario]),
      pool.query(`
        SELECT c.idTorneo, c.orden, c.criterio
        FROM torneo_criterio_desempate c
        JOIN torneo t ON t.idTorneo = c.idTorneo
        WHERE t.idUsuario = ?
        ORDER BY c.idTorneo, c.orden
      `, [idUsuario]),
      pool.query(`
        SELECT p.idTorneo, j.idEquipo, pe.tipoEvento, pe.valor
        FROM partido_evento pe
        JOIN acta_partido ap ON ap.idActa = pe.idActa
        JOIN partido p ON p.idPartido = ap.idPartido
        JOIN torneo t ON t.idTorneo = p.idTorneo
        JOIN jugador j ON j.idJugador = pe.idJugador
        WHERE t.idUsuario = ?
          AND (p.fechaCierre IS NOT NULL OR ap.fechaCierre IS NOT NULL)
      `, [idUsuario]),
      pool.query(`
        SELECT p.idTorneo, t.nombreTorneo, dep.nombreDeporte, d.tipoPuntuacion,
          j.idJugador, CONCAT(j.nombre, ' ', j.apellido) AS jugador,
          e.nombreEquipo AS equipo,
          SUM(CASE WHEN LOWER(pe.tipoEvento) LIKE '%gol%' OR LOWER(pe.tipoEvento) LIKE '%punto%' THEN pe.valor ELSE 0 END) AS anotaciones,
          SUM(CASE WHEN LOWER(pe.tipoEvento) LIKE '%asistencia%' THEN pe.valor ELSE 0 END) AS asistencias,
          SUM(CASE WHEN LOWER(pe.tipoEvento) LIKE '%amarilla%' THEN pe.valor ELSE 0 END) AS amarillas,
          SUM(CASE WHEN LOWER(pe.tipoEvento) LIKE '%roja%' THEN pe.valor ELSE 0 END) AS rojas
        FROM partido_evento pe
        JOIN acta_partido ap ON ap.idActa = pe.idActa
        JOIN partido p ON p.idPartido = ap.idPartido
        JOIN torneo t ON t.idTorneo = p.idTorneo
        JOIN disciplina d ON d.idDisciplina = t.idDisciplina
        JOIN deporte dep ON dep.idDeporte = d.idDeporte
        JOIN jugador j ON j.idJugador = pe.idJugador
        JOIN equipo e ON e.idEquipo = j.idEquipo
        WHERE t.idUsuario = ? AND ap.estado = 'Cerrada' AND pe.idJugador IS NOT NULL
        GROUP BY p.idTorneo, t.nombreTorneo, dep.nombreDeporte, d.tipoPuntuacion,
          j.idJugador, j.nombre, j.apellido, e.nombreEquipo
        ORDER BY anotaciones DESC, asistencias DESC, jugador
      `, [idUsuario])
    ]);

    const calculadas = calcularEstadisticasEquipos({
      equipos: equipos[0],
      partidos: partidos[0],
      periodos: periodos[0],
      reglas: reglas[0],
      eventosFairPlay: eventosFairPlay[0]
    });
    const criteriosPorTorneo = new Map();
    for (const criterio of criterios[0]) {
      const lista = criteriosPorTorneo.get(Number(criterio.idTorneo)) || [];
      lista.push(criterio.criterio);
      criteriosPorTorneo.set(Number(criterio.idTorneo), lista);
    }

    const idsTorneo = [...new Set(calculadas.estadisticas.map((item) => item.torneoId))];
    const ordenadas = idsTorneo.flatMap((idTorneo) => {
      const deTorneo = calculadas.estadisticas.filter((item) => item.torneoId === idTorneo);
      const partidosDeTorneo = calculadas.partidosCerrados.filter((item) => item.torneoId === idTorneo);
      const posiciones = ordenarPosiciones({
        estadisticas: deTorneo,
        partidos: partidosDeTorneo,
        criterios: criteriosPorTorneo.get(idTorneo) || ['Diferencia', 'MarcadorAFavor', 'ResultadoDirecto'],
        reglas: reglas[0].filter((regla) => Number(regla.idTorneo) === idTorneo)
      });
      return posiciones.map((item) => ({
        ...item,
        deporte: etiquetaDeporte(item.deporte)
      }));
    });

    const torneos = [...new Map(ordenadas.map((item) => [item.torneoId, {
      id: item.torneoId,
      nombre: item.torneo,
      deporte: etiquetaDeporte(item.deporte),
      disciplina: item.disciplina,
      modalidad: item.modalidad
    }])).values()];

    res.json({
      torneos,
      estadisticas: ordenadas,
      destacados: destacados[0].map((item) => ({
        ...item,
        idJugador: Number(item.idJugador),
        anotaciones: Number(item.anotaciones || 0),
        asistencias: Number(item.asistencias || 0),
        amarillas: Number(item.amarillas || 0),
        rojas: Number(item.rojas || 0),
        deporte: etiquetaDeporte(item.nombreDeporte)
      })),
      partidosCerrados: calculadas.partidosCerrados.map((partido) => ({
        ...partido,
        deporte: etiquetaDeporte(partido.deporte)
      }))
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'No se pudieron cargar las estadísticas.' });
  }
};

export const getEstadisticasTorneo = async (req, res) => {
  const idTorneo = Number(req.params.id);
  if (!Number.isInteger(idTorneo) || idTorneo <= 0) {
    return res.status(400).json({ error: 'El torneo seleccionado no es válido.' });
  }
  try {
    const [[torneo]] = await pool.query(`
      SELECT t.idTorneo, d.tipoPuntuacion
      FROM torneo t JOIN disciplina d ON d.idDisciplina = t.idDisciplina
      WHERE t.idTorneo = ? AND t.idUsuario = ?
    `, [idTorneo, req.user.idUsuario]);
    if (!torneo) return res.status(404).json({ error: 'No se encontró el torneo.' });
    const [eventos] = await pool.query(`
      SELECT pe.tipoEvento, pe.valor, j.idJugador,
        CONCAT(j.nombre, ' ', j.apellido) AS jugador,
        e.nombreEquipo AS equipo
      FROM partido_evento pe
      JOIN acta_partido ap ON ap.idActa = pe.idActa AND ap.estado = 'Cerrada'
      JOIN partido p ON p.idPartido = ap.idPartido
      JOIN torneo t ON t.idTorneo = p.idTorneo
      JOIN jugador j ON j.idJugador = pe.idJugador
      JOIN equipo e ON e.idEquipo = j.idEquipo
      WHERE p.idTorneo = ? AND t.idUsuario = ? AND pe.idJugador IS NOT NULL
    `, [idTorneo, req.user.idUsuario]);
    const [incidenciasRows] = await pool.query(`
      SELECT p.idPartido, p.jornada, p.nombreRonda, p.numeroPartido,
        local.nombreEquipo AS equipoLocal, visitante.nombreEquipo AS equipoVisitante,
        DATE_FORMAT(ap.fechaCierre, '%Y-%m-%dT%H:%i:%s') AS fechaCierre,
        pe.idEvento, pe.tipoEvento, pe.numeroPeriodo, pe.minuto, pe.valor,
        pe.observaciones AS observacionEvento,
        CONCAT(j.nombre, ' ', j.apellido) AS jugador,
        equipo.nombreEquipo AS equipoJugador,
        ap.observaciones AS observacionesActa
      FROM acta_partido ap
      JOIN partido p ON p.idPartido = ap.idPartido
      JOIN torneo t ON t.idTorneo = p.idTorneo
      LEFT JOIN partido_evento pe ON pe.idActa = ap.idActa
      LEFT JOIN jugador j ON j.idJugador = pe.idJugador
      LEFT JOIN equipo ON equipo.idEquipo = j.idEquipo
      LEFT JOIN equipo local ON local.idEquipo = p.idEquipoLocal
      LEFT JOIN equipo visitante ON visitante.idEquipo = p.idEquipoVisitante
      WHERE p.idTorneo = ? AND t.idUsuario = ? AND ap.estado = 'Cerrada'
        AND (
          pe.tipoEvento IN ('Tarjeta Amarilla', 'Tarjeta Roja', 'Otro')
          OR pe.observaciones IS NOT NULL
          OR ap.observaciones IS NOT NULL
        )
      ORDER BY ap.fechaCierre DESC, pe.idEvento DESC
    `, [idTorneo, req.user.idUsuario]);
    const [sanciones] = await pool.query(`
      SELECT js.idSancion, js.motivo, js.partidosPendientes,
        CONCAT(j.nombre, ' ', j.apellido) AS jugador, equipo.nombreEquipo AS equipo
      FROM jugador_sancion js
      JOIN torneo t ON t.idTorneo = js.idTorneo
      JOIN jugador j ON j.idJugador = js.idJugador
      JOIN equipo ON equipo.idEquipo = j.idEquipo
      WHERE js.idTorneo = ? AND t.idUsuario = ?
        AND js.estado = 'Activa' AND js.partidosPendientes > 0
      ORDER BY js.partidosPendientes DESC, j.apellido, j.nombre
    `, [idTorneo, req.user.idUsuario]);
    const porJugador = new Map();
    for (const evento of eventos) {
      const item = porJugador.get(Number(evento.idJugador)) || {
        idJugador: Number(evento.idJugador), jugador: evento.jugador, equipo: evento.equipo,
        goles: 0, puntos: 0, asistencias: 0, amarillas: 0, rojas: 0
      };
      const tipo = String(evento.tipoEvento).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
      const cantidad = Number(evento.valor || 1);
      if (tipo.includes('gol')) item.goles += cantidad;
      if (tipo.includes('punto')) item.puntos += cantidad;
      if (tipo.includes('asistencia')) item.asistencias += cantidad;
      if (tipo.includes('amarilla')) item.amarillas += cantidad;
      if (tipo.includes('roja')) item.rojas += cantidad;
      porJugador.set(item.idJugador, item);
    }
    const jugadores = [...porJugador.values()];
    const incidencias = [];
    const actasConObservacion = new Set();
    for (const row of incidenciasRows) {
      const partido = `${row.equipoLocal || 'Equipo por definir'} vs. ${row.equipoVisitante || 'Equipo por definir'}`;
      const ronda = row.nombreRonda || `Jornada ${row.jornada}`;
      if (row.idEvento != null) {
        const referencia = [
          ronda,
          `Partido ${row.numeroPartido || row.idPartido}`,
          row.minuto != null ? `min. ${row.minuto}` : null,
          row.numeroPeriodo != null ? `período ${row.numeroPeriodo}` : null
        ].filter(Boolean).join(' · ');
        incidencias.push({
          id: `evento-${row.idEvento}`,
          tipo: row.tipoEvento,
          partido,
          referencia,
          jugador: row.jugador || null,
          equipo: row.equipoJugador || null,
          detalle: row.observacionEvento || null,
          fecha: row.fechaCierre
        });
      }
      if (row.observacionesActa && !actasConObservacion.has(Number(row.idPartido))) {
        actasConObservacion.add(Number(row.idPartido));
        incidencias.push({
          id: `acta-${row.idPartido}`,
          tipo: 'Observación del acta',
          partido,
          referencia: `${ronda} · Partido ${row.numeroPartido || row.idPartido}`,
          jugador: null,
          equipo: null,
          detalle: row.observacionesActa,
          fecha: row.fechaCierre
        });
      }
    }
    res.json({
      goleadores: jugadores.filter((item) => item.goles > 0).sort((a, b) => b.goles - a.goles || a.jugador.localeCompare(b.jugador)),
      anotadores: jugadores.filter((item) => item.puntos > 0).sort((a, b) => b.puntos - a.puntos || a.jugador.localeCompare(b.jugador)),
      asistidores: jugadores.filter((item) => item.asistencias > 0).sort((a, b) => b.asistencias - a.asistencias || a.jugador.localeCompare(b.jugador)),
      amarillas: jugadores.filter((item) => item.amarillas > 0).sort((a, b) => b.amarillas - a.amarillas || a.jugador.localeCompare(b.jugador)),
      rojas: jugadores.filter((item) => item.rojas > 0).sort((a, b) => b.rojas - a.rojas || a.jugador.localeCompare(b.jugador)),
      incidencias,
      sanciones: sanciones.map((item) => ({
        ...item,
        idSancion: Number(item.idSancion),
        partidosPendientes: Number(item.partidosPendientes)
      })),
      tipoPuntuacion: torneo.tipoPuntuacion
    });
  } catch (error) {
    console.error('Error al calcular estadísticas del torneo:', error);
    res.status(500).json({ error: 'No se pudieron cargar las estadísticas del torneo.' });
  }
};
