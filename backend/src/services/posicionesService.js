import pool from '../config/db.js';

export const crearError = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });

export const CRITERIOS_PERMITIDOS = [
  'Puntos',
  'Diferencia de goles',
  'Marcador a favor',
  'Resultado directo',
  'Fair play',
];

const CRITERIOS_DEFECTO = ['Puntos', 'Diferencia de goles', 'Marcador a favor', 'Resultado directo'];

export const obtenerCriterios = async (idTorneo, connection = pool) => {
  const [filas] = await connection.query(`
    SELECT criterio
    FROM torneo_criterio_desempate
    WHERE idTorneo = ?
    ORDER BY orden
  `, [idTorneo]);

  const criterios = filas.map((fila) => fila.criterio);
  return criterios.length > 0 ? criterios : [...CRITERIOS_DEFECTO];
};

const validarCriterios = (criterios) => {
  if (!Array.isArray(criterios) || criterios.length < 2) {
    throw crearError('Definí al menos dos criterios de desempate.');
  }
  const limpios = criterios.map((criterio) => (typeof criterio === 'string' ? criterio.trim() : ''));
  for (const criterio of limpios) {
    if (!CRITERIOS_PERMITIDOS.includes(criterio)) {
      throw crearError(`El criterio '${criterio}' no está permitido.`);
    }
  }
  if (new Set(limpios).size !== limpios.length) {
    throw crearError('No podés repetir criterios de desempate.');
  }
  return limpios;
};

export const guardarCriterios = async (idTorneo, criterios, idUsuario) => {
  const validados = validarCriterios(criterios);
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[torneo]] = await connection.query(
      'SELECT idTorneo FROM torneo WHERE idTorneo = ? AND idUsuario = ?',
      [idTorneo, idUsuario]
    );
    if (!torneo) throw crearError('No se encontró el torneo.', 404);

    await connection.query('DELETE FROM torneo_criterio_desempate WHERE idTorneo = ?', [idTorneo]);
    await connection.query(
      'INSERT INTO torneo_criterio_desempate (idTorneo, orden, criterio) VALUES ?',
      [validados.map((criterio, indice) => [idTorneo, indice + 1, criterio])]
    );

    await connection.commit();
    return validados;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    connection?.release();
  }
};


const PUNTOS_DEFECTO = { victoria: 3, empate: 1, derrota: 0 };

const cargarReglasPuntuacion = async (idTorneo, connection) => {
  const [reglas] = await connection.query(`
    SELECT tipoResultado, puntosTabla
    FROM torneo_regla_puntuacion
    WHERE idTorneo = ?
    ORDER BY prioridad
  `, [idTorneo]);

  const puntos = { ...PUNTOS_DEFECTO, victoriaCustom: false, empateCustom: false, derrotaCustom: false };
  for (const regla of reglas) {
    const clave = String(regla.tipoResultado || '').toLowerCase();
    if (clave === 'victoria' && !puntos.victoriaCustom) {
      puntos.victoria = Number(regla.puntosTabla);
      puntos.victoriaCustom = true;
    } else if (clave === 'empate' && !puntos.empateCustom) {
      puntos.empate = Number(regla.puntosTabla);
      puntos.empateCustom = true;
    } else if (clave === 'derrota' && !puntos.derrotaCustom) {
      puntos.derrota = Number(regla.puntosTabla);
      puntos.derrotaCustom = true;
    }
  }
  return puntos;
};

// Puntos obtenidos por cada equipo en los partidos entre sí.
const compararDirecto = (a, b, partidosDirectos) => {
  let puntosA = 0;
  let puntosB = 0;
  const pares = [
    { local: a.idEquipo, visitante: b.idEquipo },
    { local: b.idEquipo, visitante: a.idEquipo },
  ];
  for (const par of pares) {
    const listado = partidosDirectos.get(`${par.local}-${par.visitante}`) || [];
    for (const partido of listado) {
      const golesA = Number(partido.marcadorLocal);
      const golesB = Number(partido.marcadorVisitante);
      if (golesA > golesB) puntosA += 3;
      else if (golesA < golesB) puntosB += 3;
      else {
        puntosA += 1;
        puntosB += 1;
      }
    }
  }
  return puntosB - puntosA;
};

// Calcula la tabla completa de un torneo a partir de los partidos finalizados.
export const calcularTablaPosiciones = async (idTorneo, connection = pool) => {
  const [[torneo]] = await connection.query(
    'SELECT idTorneo, nombreTorneo FROM torneo WHERE idTorneo = ?',
    [idTorneo]
  );
  if (!torneo) throw crearError('No se encontró el torneo.', 404);

  const criterios = await obtenerCriterios(idTorneo, connection);
  const reglas = await cargarReglasPuntuacion(idTorneo, connection);

  const [equiposInscriptos] = await connection.query(`
    SELECT e.idEquipo, e.nombreEquipo
    FROM torneo_equipo te
    JOIN equipo e ON e.idEquipo = te.idEquipo
    WHERE te.idTorneo = ?
    ORDER BY e.nombreEquipo
  `, [idTorneo]);

  const [partidos] = await connection.query(`
    SELECT p.idPartido, p.idEquipoLocal, p.idEquipoVisitante, p.marcadorLocal, p.marcadorVisitante
    FROM partido p
    WHERE p.idTorneo = ?
      AND p.estado = 'Finalizado'
      AND p.marcadorLocal IS NOT NULL
      AND p.marcadorVisitante IS NOT NULL
  `, [idTorneo]);

  const filas = new Map();
  const asegurarFila = (idEquipo, nombreEquipo) => {
    const clave = Number(idEquipo);
    if (!filas.has(clave)) {
      filas.set(clave, {
        idEquipo: clave,
        nombreEquipo,
        pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0,
      });
    }
    return filas.get(clave);
  };

  for (const equipo of equiposInscriptos) {
    asegurarFila(equipo.idEquipo, equipo.nombreEquipo);
  }

  const partidosDirectos = new Map();
  for (const partido of partidos) {
    if (!partido.idEquipoLocal || !partido.idEquipoVisitante) continue;
    const filaLocal = asegurarFila(partido.idEquipoLocal, `Equipo ${partido.idEquipoLocal}`);
    const filaVisitante = asegurarFila(partido.idEquipoVisitante, `Equipo ${partido.idEquipoVisitante}`);
    const golesLocal = Number(partido.marcadorLocal);
    const golesVisitante = Number(partido.marcadorVisitante);

    filaLocal.pj += 1;
    filaVisitante.pj += 1;
    filaLocal.gf += golesLocal;
    filaLocal.gc += golesVisitante;
    filaVisitante.gf += golesVisitante;
    filaVisitante.gc += golesLocal;

    if (golesLocal > golesVisitante) {
      filaLocal.pg += 1;
      filaVisitante.pp += 1;
      filaLocal.pts += reglas.victoria;
      filaVisitante.pts += reglas.derrota;
    } else if (golesLocal < golesVisitante) {
      filaVisitante.pg += 1;
      filaLocal.pp += 1;
      filaVisitante.pts += reglas.victoria;
      filaLocal.pts += reglas.derrota;
    } else {
      filaLocal.pe += 1;
      filaVisitante.pe += 1;
      filaLocal.pts += reglas.empate;
      filaVisitante.pts += reglas.empate;
    }

    const claveDirecta = `${partido.idEquipoLocal}-${partido.idEquipoVisitante}`;
    if (!partidosDirectos.has(claveDirecta)) partidosDirectos.set(claveDirecta, []);
    partidosDirectos.get(claveDirecta).push(partido);
  }

  const tabla = [...filas.values()].map((fila) => ({ ...fila, dg: fila.gf - fila.gc }));

  const comparadores = {
    'Puntos': (a, b) => b.pts - a.pts,
    'Diferencia de goles': (a, b) => b.dg - a.dg,
    'Marcador a favor': (a, b) => b.gf - a.gf,
    'Resultado directo': (a, b) => compararDirecto(a, b, partidosDirectos),
    'Fair play': () => 0,
  };

  const comparadorPorCriterios = (a, b) => {
    for (const criterio of criterios) {
      const comparador = comparadores[criterio];
      if (!comparador) continue;
      const resultado = comparador(a, b);
      if (resultado !== 0) return resultado;
    }
    if (a.pj !== b.pj) return b.pj - a.pj;
    return String(a.nombreEquipo).localeCompare(String(b.nombreEquipo), 'es');
  };

  tabla.sort(comparadorPorCriterios);

  return {
    torneo,
    criterios,
    tabla: tabla.map((fila, indice) => ({ posicion: indice + 1, ...fila })),
  };
};
