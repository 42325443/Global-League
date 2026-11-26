import { describe, expect, it, vi, beforeEach } from 'vitest';

const query = vi.fn();
const getConnection = vi.fn();
const beginTransaction = vi.fn();
const commit = vi.fn();
const rollback = vi.fn();
const release = vi.fn();

vi.mock('../src/config/db.js', () => ({
  default: {
    query: (...args) => query(...args),
    getConnection: (...args) => getConnection(...args),
  },
}));

const {
  crearError,
  CRITERIOS_PERMITIDOS,
  obtenerCriterios,
  guardarCriterios,
  calcularTablaPosiciones,
} = await import('../src/services/posicionesService.js');

/**
 * Crea una conexión simulada que responde cada consulta de la tabla de
 * posiciones según el orden en que las hace calcularTablaPosiciones.
 */
const crearConnectionTabla = ({ torneo, criterios, reglas = [], equipos, partidos }) => ({
  query: vi.fn(async (sql) => {
    if (sql.includes('FROM torneo_criterio_desempate')) {
      return [criterios.map((criterio) => ({ criterio }))];
    }
    if (sql.includes('FROM torneo_regla_puntuacion')) return [reglas];
    if (sql.includes('FROM torneo_equipo')) return [equipos];
    if (sql.includes("estado = 'Finalizado'")) return [partidos];
    if (sql.includes('FROM torneo WHERE')) return [[torneo]];
    return [[]];
  }),
});

beforeEach(() => {
  vi.clearAllMocks();
  beginTransaction.mockResolvedValue(undefined);
  commit.mockResolvedValue(undefined);
  rollback.mockResolvedValue(undefined);
  release.mockResolvedValue(undefined);
});

describe('crearError y CRITERIOS_PERMITIDOS', () => {
  it('crearError adjunta status por defecto 400', () => {
    expect(crearError('x').status).toBe(400);
    expect(crearError('x', 409).status).toBe(409);
  });

  it('expone los cinco criterios de desempate permitidos', () => {
    expect(CRITERIOS_PERMITIDOS).toEqual([
      'Puntos', 'Diferencia de goles', 'Marcador a favor', 'Resultado directo', 'Fair play',
    ]);
  });
});

describe('obtenerCriterios', () => {
  it('devuelve los criterios guardados ordenados', async () => {
    const connection = {
      query: vi.fn(async () => [[{ criterio: 'Fair play' }, { criterio: 'Puntos' }]]),
    };
    expect(await obtenerCriterios(1, connection)).toEqual(['Fair play', 'Puntos']);
  });

  it('usa los criterios por defecto cuando el torneo no tiene configuración', async () => {
    const connection = { query: vi.fn(async () => [[]]) };
    expect(await obtenerCriterios(1, connection)).toEqual([
      'Puntos', 'Diferencia de goles', 'Marcador a favor', 'Resultado directo',
    ]);
  });
});

describe('guardarCriterios', () => {
  const torneoOk = [[{ idTorneo: 1 }]];

  it('guarda un orden válido en transacción', async () => {
    getConnection.mockResolvedValue({
      query: vi.fn(async (sql) => (sql.includes('FROM torneo ') ? torneoOk : [[]])),
      beginTransaction, commit, rollback, release,
    });

    const criterios = ['Fair play', 'Puntos', 'Diferencia de goles', 'Marcador a favor', 'Resultado directo'];
    const resultado = await guardarCriterios(1, criterios, 7);

    expect(resultado).toEqual(criterios);
    expect(commit).toHaveBeenCalled();
    expect(rollback).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });

  it('rechaza menos de dos criterios sin tocar la base', async () => {
    await expect(guardarCriterios(1, ['Puntos'], 7)).rejects.toThrow(/al menos dos criterios/);
    expect(getConnection).not.toHaveBeenCalled();
  });

  it('rechaza criterios no permitidos', async () => {
    await expect(
      guardarCriterios(1, ['Puntos', 'Sorteo'], 7)
    ).rejects.toThrow(/no está permitido/);
  });

  it('rechaza criterios repetidos', async () => {
    await expect(
      guardarCriterios(1, ['Puntos', 'Puntos'], 7)
    ).rejects.toThrow(/No podés repetir criterios/);
  });

  it('rechaza un arreglo que no sea array', async () => {
    await expect(guardarCriterios(1, 'Puntos,Diferencia', 7)).rejects.toThrow(/al menos dos criterios/);
  });

  it('hace rollback y libera la conexión si el torneo no pertenece al usuario', async () => {
    getConnection.mockResolvedValue({
      query: vi.fn(async () => [[]]),
      beginTransaction, commit, rollback, release,
    });

    await expect(
      guardarCriterios(999, ['Puntos', 'Diferencia de goles'], 7)
    ).rejects.toMatchObject({ status: 404 });

    expect(rollback).toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });
});

describe('calcularTablaPosiciones', () => {
  const torneo = { idTorneo: 1, nombreTorneo: 'Liga Test', modalidad: 'Todos contra todos' };
  const criteriosPuntos = ['Puntos', 'Diferencia de goles', 'Marcador a favor', 'Resultado directo'];
  const equipo = (idEquipo, nombreEquipo) => ({ idEquipo, nombreEquipo });
  const partido = (local, visitante, gl, gv) => ({
    idPartido: Math.floor(Math.random() * 1e6),
    idEquipoLocal: local, idEquipoVisitante: visitante,
    marcadorLocal: gl, marcadorVisitante: gv,
  });

  it('calcula PJ, PG, PE, PP, GF, GC, DG y PTS con reglas por defecto (3/1/0)', async () => {
    const connection = crearConnectionTabla({
      torneo, criterios: criteriosPuntos,
      equipos: [equipo(1, 'Atlas'), equipo(2, 'Boca')],
      partidos: [
        partido(1, 2, 2, 1),   // Atlas gana: 3 pts
        partido(2, 1, 0, 0),   // Empate: 1 pt c/u
        partido(2, 1, 1, 3),   // Atlas gana de visitante: 3 pts
      ],
    });

    const { tabla } = await calcularTablaPosiciones(1, connection);
    const atlas = tabla[0];
    const boca = tabla[1];

    expect(tabla).toHaveLength(2);
    expect(atlas).toMatchObject({
      nombreEquipo: 'Atlas', pj: 3, pg: 2, pe: 1, pp: 0,
      gf: 5, gc: 2, dg: 3, pts: 7, posicion: 1,
    });
    expect(boca).toMatchObject({
      nombreEquipo: 'Boca', pj: 3, pg: 0, pe: 1, pp: 2,
      gf: 2, gc: 5, dg: -3, pts: 1, posicion: 2,
    });
  });

  it('ordena primero por puntos', async () => {
    const connection = crearConnectionTabla({
      torneo, criterios: criteriosPuntos,
      equipos: [equipo(1, 'Líder'), equipo(2, 'Segundo')],
      partidos: [partido(1, 2, 1, 0), partido(2, 1, 0, 2)],
    });

    const { tabla } = await calcularTablaPosiciones(1, connection);
    expect(tabla[0].nombreEquipo).toBe('Líder');
    expect(tabla[0].pts).toBeGreaterThan(tabla[1].pts);
  });

  it('respeta el orden de criterios configurable (Marcador a favor antes que Puntos)', async () => {
    const connection = crearConnectionTabla({
      torneo,
      criterios: ['Marcador a favor', 'Puntos'],
      equipos: [equipo(1, 'PocosPtsMuchosGoles'), equipo(2, 'MuchosPtsPocosGoles')],
      partidos: [
        partido(1, 2, 5, 0),
        partido(2, 1, 1, 0),
        partido(2, 1, 1, 0),
        partido(2, 1, 1, 0),
      ],
    });

    const { criterios, tabla } = await calcularTablaPosiciones(1, connection);
    expect(criterios[0]).toBe('Marcador a favor');
    expect(tabla[0].nombreEquipo).toBe('PocosPtsMuchosGoles');
    expect(tabla[0].gf).toBeGreaterThan(tabla[1].gf);
  });


  it('incluye equipos inscriptos aunque no tengan partidos finalizados (PJ=0)', async () => {
    const connection = crearConnectionTabla({
      torneo, criterios: criteriosPuntos,
      equipos: [equipo(1, 'ConPartidos'), equipo(2, 'SinPartidos'), equipo(3, 'Rival')],
      partidos: [partido(1, 3, 1, 0)],
    });

    const { tabla } = await calcularTablaPosiciones(1, connection);
    expect(tabla).toHaveLength(3);
    const sinPartidos = tabla.find((fila) => fila.nombreEquipo === 'SinPartidos');
    expect(sinPartidos).toMatchObject({ pj: 0, pts: 0, gf: 0, gc: 0, dg: 0 });
  });

  it('usa reglas de puntuación personalizadas del torneo si existen', async () => {
    const connection = crearConnectionTabla({
      torneo, criterios: criteriosPuntos,
      reglas: [
        { tipoResultado: 'victoria', puntosTabla: 2 },
        { tipoResultado: 'empate', puntosTabla: 1 },
        { tipoResultado: 'derrota', puntosTabla: 0 },
      ],
      equipos: [equipo(1, 'Ganador'), equipo(2, 'Perdedor')],
      partidos: [partido(1, 2, 1, 0)],
    });

    const { tabla } = await calcularTablaPosiciones(1, connection);
    expect(tabla[0].pts).toBe(2);
  });

  it('devuelve equipos con PJ=0 cuando no hay partidos finalizados', async () => {
    const connection = crearConnectionTabla({
      torneo, criterios: criteriosPuntos,
      equipos: [equipo(1, 'A'), equipo(2, 'B')],
      partidos: [],
    });

    const { tabla } = await calcularTablaPosiciones(1, connection);
    expect(tabla.every((fila) => fila.pj === 0 && fila.pts === 0)).toBe(true);
  });

  it('numera posiciones consecutivamente desde 1', async () => {
    const connection = crearConnectionTabla({
      torneo, criterios: criteriosPuntos,
      equipos: [equipo(1, 'A'), equipo(2, 'B'), equipo(3, 'C')],
      partidos: [partido(1, 2, 1, 0), partido(2, 3, 1, 0), partido(3, 1, 1, 0)],
    });

    const { tabla } = await calcularTablaPosiciones(1, connection);
    expect(tabla.map((fila) => fila.posicion)).toEqual([1, 2, 3]);
  });

  it('devuelve torneo, criterios y tabla en la respuesta', async () => {
    const connection = crearConnectionTabla({
      torneo, criterios: criteriosPuntos,
      equipos: [equipo(1, 'A')], partidos: [],
    });

    const datos = await calcularTablaPosiciones(1, connection);
    expect(datos.torneo).toEqual(torneo);
    expect(datos.criterios).toHaveLength(4);
    expect(Array.isArray(datos.tabla)).toBe(true);
  });
});

