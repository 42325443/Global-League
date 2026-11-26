export const normalizarTexto = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase();

export const obtenerResultadoEquipo = (partido, idEquipo) => {
  const id = Number(idEquipo);
  const localId = Number(partido.idEquipoLocal);
  const visitanteId = Number(partido.idEquipoVisitante);
  const local = Number(partido.marcadorLocal);
  const visitante = Number(partido.marcadorVisitante);

  if (local > visitante) return id === localId ? 'Victoria' : 'Derrota';
  if (visitante > local) return id === visitanteId ? 'Victoria' : 'Derrota';
  if (Number(partido.idEquipoGanador) === id) return 'Victoria';
  if (Number(partido.idEquipoGanador) && Number(partido.idEquipoGanador) !== id) return 'Derrota';
  return 'Empate';
};

const coincideRango = (value, minimum, maximum) => (
  (minimum === null || minimum === undefined || value >= Number(minimum))
  && (maximum === null || maximum === undefined || value <= Number(maximum))
);

export const calcularPuntosResultado = ({
  reglas = [],
  resultado,
  tipoPuntuacion = 'Goles',
  setsFavor = 0,
  setsContra = 0,
  tipoResolucion = null
}) => {
  if (tipoResolucion === 'SinPuntos' || tipoResolucion === 'Anulado') return 0;

  const regla = reglas.find((item) => (
    normalizarTexto(item.tipoResultado) === normalizarTexto(resultado)
    && coincideRango(setsFavor, item.setsFavorMin, item.setsFavorMax)
    && coincideRango(setsContra, item.setsContraMin, item.setsContraMax)
  ));
  if (regla) return Number(regla.puntosTabla);

  if (tipoPuntuacion === 'Puntos') {
    if (resultado === 'Victoria') return 2;
    if (resultado === 'Derrota') return 1;
    return 0;
  }

  if (tipoPuntuacion === 'Sets') {
    if (resultado === 'Victoria') return setsContra >= 2 ? 2 : 3;
    if (resultado === 'Derrota') return setsFavor >= 2 ? 1 : 0;
    return 0;
  }

  if (resultado === 'Victoria') return 3;
  if (resultado === 'Empate') return 1;
  return 0;
};

export const crearIndicePeriodos = (periodos = []) => {
  const indice = new Map();
  for (const periodo of periodos) {
    const idPartido = Number(periodo.idPartido);
    const lista = indice.get(idPartido) || [];
    lista.push(periodo);
    indice.set(idPartido, lista);
  }
  return indice;
};

export const crearIndiceReglas = (reglas = []) => {
  const indice = new Map();
  for (const regla of reglas) {
    const idTorneo = Number(regla.idTorneo);
    const lista = indice.get(idTorneo) || [];
    lista.push(regla);
    indice.set(idTorneo, lista);
  }
  return indice;
};

const contarPeriodosGanados = (periodos = []) => ({
  local: periodos.filter((periodo) => Number(periodo.marcadorLocal) > Number(periodo.marcadorVisitante)).length,
  visitante: periodos.filter((periodo) => Number(periodo.marcadorVisitante) > Number(periodo.marcadorLocal)).length
});

export const crearEstadisticaEquipo = (row) => ({
  id: `${row.idTorneo}-${row.idEquipo}`,
  torneoId: Number(row.idTorneo),
  torneo: row.nombreTorneo,
  deporte: row.nombreDeporte,
  disciplina: row.nombreDisciplina,
  tipoPuntuacion: row.tipoPuntuacion,
  modalidad: row.nombreFormato,
  equipoId: Number(row.idEquipo),
  equipo: row.nombreEquipo,
  estadoParticipacion: row.estadoParticipacion,
  pj: 0,
  pg: 0,
  pe: 0,
  pp: 0,
  gf: 0,
  gc: 0,
  puntos: 0,
  fairPlay: 0
});

export const calcularEstadisticasEquipos = ({
  equipos = [],
  partidos = [],
  periodos = [],
  reglas = [],
  eventosFairPlay = []
}) => {
  const estadisticas = new Map(equipos.map((row) => {
    const item = crearEstadisticaEquipo(row);
    return [item.id, item];
  }));
  const equipoPorTorneo = new Map([...estadisticas.values()].map((item) => (
    [`${item.torneoId}-${item.equipoId}`, item]
  )));
  const periodosPorPartido = crearIndicePeriodos(periodos);
  const reglasPorTorneo = crearIndiceReglas(reglas);
  const partidosCerrados = [];

  for (const partido of partidos) {
    const idTorneo = Number(partido.idTorneo);
    const local = equipoPorTorneo.get(`${idTorneo}-${Number(partido.idEquipoLocal)}`);
    const visitante = equipoPorTorneo.get(`${idTorneo}-${Number(partido.idEquipoVisitante)}`);
    if (!local || !visitante) continue;

    const marcadorLocal = Number(partido.marcadorLocal);
    const marcadorVisitante = Number(partido.marcadorVisitante);
    const periodosPartido = periodosPorPartido.get(Number(partido.idPartido)) || [];
    const sets = contarPeriodosGanados(periodosPartido);
    const setsLocal = local.tipoPuntuacion === 'Sets' && periodosPartido.length === 0 ? marcadorLocal : sets.local;
    const setsVisitante = local.tipoPuntuacion === 'Sets' && periodosPartido.length === 0 ? marcadorVisitante : sets.visitante;
    const resultadoLocal = obtenerResultadoEquipo(partido, local.equipoId);
    const resultadoVisitante = obtenerResultadoEquipo(partido, visitante.equipoId);

    for (const [equipo, marcadorFavor, marcadorContra, resultado, setsFavor, setsContra] of [
      [local, marcadorLocal, marcadorVisitante, resultadoLocal, setsLocal, setsVisitante],
      [visitante, marcadorVisitante, marcadorLocal, resultadoVisitante, setsVisitante, setsLocal]
    ]) {
      equipo.pj += 1;
      equipo.gf += marcadorFavor;
      equipo.gc += marcadorContra;
      if (resultado === 'Victoria') equipo.pg += 1;
      else if (resultado === 'Derrota') equipo.pp += 1;
      else equipo.pe += 1;
      equipo.puntos += calcularPuntosResultado({
        reglas: reglasPorTorneo.get(idTorneo) || [],
        resultado,
        tipoPuntuacion: equipo.tipoPuntuacion,
        setsFavor,
        setsContra,
        tipoResolucion: partido.tipoResolucion
      });
    }

    partidosCerrados.push({
      id: Number(partido.idPartido),
      torneoId: idTorneo,
      idEquipoLocal: local.equipoId,
      idEquipoVisitante: visitante.equipoId,
      idEquipoGanador: partido.idEquipoGanador ? Number(partido.idEquipoGanador) : null,
      deporte: local.deporte,
      tipoPuntuacion: local.tipoPuntuacion,
      marcadorLocal,
      marcadorVisitante,
      tipoResolucion: partido.tipoResolucion,
      tipoEtapa: partido.tipoEtapa
    });
  }

  for (const evento of eventosFairPlay) {
    const equipo = equipoPorTorneo.get(`${Number(evento.idTorneo)}-${Number(evento.idEquipo)}`);
    if (!equipo) continue;
    const tipo = normalizarTexto(evento.tipoEvento);
    if (tipo.includes('amarilla')) equipo.fairPlay += Number(evento.valor || 1);
    if (tipo.includes('roja')) equipo.fairPlay += Number(evento.valor || 1) * 3;
  }

  return { estadisticas: [...estadisticas.values()], partidosCerrados };
};

const valorDesempate = (equipo, criterio, tablaDirecta) => {
  const tipo = normalizarTexto(criterio);
  if (tipo.includes('direct') || tipo.includes('mutuo')) return tablaDirecta.get(equipo.equipoId) || 0;
  if (tipo.includes('fair')) return -equipo.fairPlay;
  if (tipo.includes('favor') || tipo.includes('goles') || tipo.includes('marcador')) return equipo.gf;
  if (tipo.includes('diferencia')) return equipo.gf - equipo.gc;
  if (tipo.includes('victoria')) return equipo.pg;
  return null;
};

export const ordenarPosiciones = ({
  estadisticas = [],
  partidos = [],
  periodos = [],
  criterios = [],
  reglas = []
}) => {
  const gruposPorPuntos = new Map();
  for (const equipo of estadisticas) {
    const lista = gruposPorPuntos.get(equipo.puntos) || [];
    lista.push(equipo);
    gruposPorPuntos.set(equipo.puntos, lista);
  }

  const ordenados = [];
  const periodosPorPartido = crearIndicePeriodos(periodos);
  for (const puntos of [...gruposPorPuntos.keys()].sort((a, b) => b - a)) {
    let grupos = [gruposPorPuntos.get(puntos)];
    for (const criterio of criterios) {
      const gruposNuevos = [];
      for (const grupo of grupos) {
        if (grupo.length < 2) {
          gruposNuevos.push(grupo);
          continue;
        }

        const ids = new Set(grupo.map((item) => item.equipoId));
        const tablaDirecta = new Map(grupo.map((item) => [item.equipoId, 0]));
        if (normalizarTexto(criterio).includes('direct') || normalizarTexto(criterio).includes('mutuo')) {
          for (const partido of partidos) {
            if (!ids.has(Number(partido.idEquipoLocal)) || !ids.has(Number(partido.idEquipoVisitante))) continue;
            const idTorneo = Number(partido.idTorneo);
            const [local, visitante] = [Number(partido.idEquipoLocal), Number(partido.idEquipoVisitante)];
            const resultadoLocal = obtenerResultadoEquipo(partido, local);
            const resultadoVisitante = obtenerResultadoEquipo(partido, visitante);
            const equipoLocal = grupo.find((item) => item.equipoId === local);
            const reglasTorneo = reglas.filter((item) => Number(item.idTorneo) === idTorneo);
            const periodosPartido = periodosPorPartido.get(Number(partido.idPartido)) || [];
            const setsLocal = periodosPartido.filter((item) => Number(item.marcadorLocal) > Number(item.marcadorVisitante)).length;
            const setsVisitante = periodosPartido.filter((item) => Number(item.marcadorVisitante) > Number(item.marcadorLocal)).length;
            const localPuntos = calcularPuntosResultado({
              reglas: reglasTorneo,
              resultado: resultadoLocal,
              tipoPuntuacion: equipoLocal?.tipoPuntuacion,
              setsFavor: equipoLocal?.tipoPuntuacion === 'Sets' ? setsLocal : 0,
              setsContra: equipoLocal?.tipoPuntuacion === 'Sets' ? setsVisitante : 0,
              tipoResolucion: partido.tipoResolucion
            });
            const visitantePuntos = calcularPuntosResultado({
              reglas: reglasTorneo,
              resultado: resultadoVisitante,
              tipoPuntuacion: equipoLocal?.tipoPuntuacion,
              setsFavor: equipoLocal?.tipoPuntuacion === 'Sets' ? setsVisitante : 0,
              setsContra: equipoLocal?.tipoPuntuacion === 'Sets' ? setsLocal : 0,
              tipoResolucion: partido.tipoResolucion
            });
            tablaDirecta.set(local, tablaDirecta.get(local) + localPuntos);
            tablaDirecta.set(visitante, tablaDirecta.get(visitante) + visitantePuntos);
          }
        }

        const valores = grupo.map((item) => ({
          item,
          valor: valorDesempate(item, criterio, tablaDirecta)
        }));
        if (valores.every(({ valor }) => valor === null)) {
          gruposNuevos.push(grupo);
          continue;
        }
        valores.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
        let subgrupo = [];
        let valorAnterior;
        for (const elemento of valores) {
          if (subgrupo.length && elemento.valor !== valorAnterior) {
            gruposNuevos.push(subgrupo);
            subgrupo = [];
          }
          subgrupo.push(elemento.item);
          valorAnterior = elemento.valor;
        }
        if (subgrupo.length) gruposNuevos.push(subgrupo);
      }
      grupos = gruposNuevos;
    }
    ordenados.push(...grupos.flat());
  }

  return ordenados.map((equipo, index) => ({
    ...equipo,
    posicion: index + 1,
    diferencia: equipo.gf - equipo.gc
  }));
};

export const cerrarTorneoSiCorresponde = async (connection, idTorneo) => {
  const [[estado]] = await connection.query(`
    SELECT
      EXISTS (SELECT 1 FROM partido WHERE idTorneo = ?) AS tienePartidos,
      NOT EXISTS (
        SELECT 1 FROM partido
        WHERE idTorneo = ? AND COALESCE(estado, 'Pendiente') NOT IN ('Finalizado', 'Anulado', 'Pase libre')
      ) AS todosResueltos
  `, [idTorneo, idTorneo]);

  if (!Number(estado.tienePartidos) || !Number(estado.todosResueltos)) return false;

  await connection.query(`
    UPDATE torneo
    SET estadoGestion = 'Cerrado', fechaCierre = COALESCE(fechaCierre, CURRENT_TIMESTAMP)
    WHERE idTorneo = ? AND estadoGestion NOT IN ('Cancelado', 'Suspendido')
  `, [idTorneo]);
  return true;
};
