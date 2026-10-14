import { describe, expect, it, vi } from 'vitest';

// Mock del pool de BD: los servicios reciben `connection` como parámetro opcional,
// pero importan pool como defecto; lo mockeamos para evitar conexiones reales.
vi.mock('../src/config/db.js', () => ({ default: { query: vi.fn() } }));

const {
  crearError,
  TIPOS_EVENTO,
  EQUIPOS_EVENTO,
  validarMarcador,
  obtenerPartidoPropio,
  obtenerActaDePartido,
  obtenerIncidencias,
  validarArbitro,
  validarJugadorDelPartido,
} = await import('../src/services/actaService.js');

/** Crea un mock de conexión que responde según un mapeo de patrones. */
const crearConnection = (respuestas) => ({
  query: vi.fn(async (sql) => {
    for (const [patron, respuesta] of Object.entries(respuestas)) {
      if (sql.includes(patron)) return respuesta;
    }
    return [[]];
  }),
});

describe('crearError', () => {
  it('crea un Error con status 400 por defecto', () => {
    const error = crearError('algo salió mal');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('algo salió mal');
    expect(error.status).toBe(400);
  });

  it('permite indicar un status personalizado', () => {
    expect(crearError('no encontrado', 404).status).toBe(404);
  });
});

describe('constantes de incidencias', () => {
  it('define los tipos de evento soportados', () => {
    expect(TIPOS_EVENTO).toContain('Gol');
    expect(TIPOS_EVENTO).toContain('Tarjeta Amarilla');
    expect(TIPOS_EVENTO).toContain('Tarjeta Roja');
    expect(TIPOS_EVENTO).toContain('Asistencia');
    expect(TIPOS_EVENTO).toHaveLength(6);
  });

  it('define los equipos participantes de una incidencia', () => {
    expect(EQUIPOS_EVENTO).toEqual(['Local', 'Visitante']);
  });
});

describe('validarMarcador', () => {
  it('devuelve null cuando el valor está vacío (permite borrar el marcador)', () => {
    expect(validarMarcador(null, 'local')).toBeNull();
    expect(validarMarcador(undefined, 'local')).toBeNull();
    expect(validarMarcador('', 'visitante')).toBeNull();
  });

  it('convierte strings numéricos válidos a entero', () => {
    expect(validarMarcador('3', 'local')).toBe(3);
    expect(validarMarcador(0, 'local')).toBe(0);
    expect(validarMarcador('999', 'visitante')).toBe(999);
  });

  it('rechaza números negativos', () => {
    expect(() => validarMarcador(-1, 'local')).toThrow(/entre 0 y 999/);
  });

  it('rechaza valores mayores a 999', () => {
    expect(() => validarMarcador(1000, 'local')).toThrow(/entre 0 y 999/);
  });

  it('rechaza números no enteros', () => {
    expect(() => validarMarcador(1.5, 'local')).toThrow(/número entero/);
    expect(() => validarMarcador('abc', 'local')).toThrow(/número entero/);
  });

  it('incluye el nombre del campo en el mensaje de error', () => {
    expect(() => validarMarcador(1500, 'visitante')).toThrow(/visitante/);
  });
});

describe('obtenerPartidoPropio', () => {
  it('devuelve el partido cuando pertenece al usuario', async () => {
    const partido = { idPartido: 10, idTorneo: 1, estado: 'Pendiente' };
    const connection = crearConnection({ 'FROM partido': [[partido]] });
    const resultado = await obtenerPartidoPropio(10, 5, connection);
    expect(resultado).toEqual(partido);
    expect(connection.query).toHaveBeenCalledWith(expect.any(String), [10, 5]);
  });

  it('lanza 404 cuando el partido no existe o es de otro usuario', async () => {
    const connection = crearConnection({ 'FROM partido': [[]] });
    await expect(obtenerPartidoPropio(999, 5, connection)).rejects.toMatchObject({
      status: 404,
      message: 'No se encontró el partido.',
    });
  });

  it('filtra por idUsuario para evitar acceso a partidos ajenos', async () => {
    const connection = crearConnection({ 'FROM partido': [[{ idPartido: 1 }]] });
    await obtenerPartidoPropio(1, 42, connection);
    const [sql, params] = connection.query.mock.calls[0];
    expect(sql).toContain('t.idUsuario = ?');
    expect(params).toEqual([1, 42]);
  });
});

describe('obtenerActaDePartido', () => {
  it('devuelve el acta cuando existe', async () => {
    const acta = { idActa: 7, idPartido: 10, estado: 'Borrador' };
    const connection = crearConnection({ 'FROM acta_partido': [[acta]] });
    expect(await obtenerActaDePartido(10, connection)).toEqual(acta);
  });

  it('devuelve null cuando el partido no tiene acta', async () => {
    const connection = crearConnection({ 'FROM acta_partido': [[]] });
    expect(await obtenerActaDePartido(10, connection)).toBeNull();
  });
});

describe('obtenerIncidencias', () => {
  const partido = { idEquipoLocal: 1, idEquipoVisitante: 2 };

  it('devuelve [] cuando el acta no tiene id (partido sin acta)', async () => {
    const connection = crearConnection({});
    expect(await obtenerIncidencias(null, partido, connection)).toEqual([]);
    expect(connection.query).not.toHaveBeenCalled();
  });

  it('asigna el equipo de cada incidencia por el jugador', async () => {
    const connection = crearConnection({
      'FROM partido_evento': [[
        { idEvento: 1, idJugador: 100, tipoEvento: 'Gol', minuto: 45, valor: 1, observaciones: null, nombreJugador: 'Lionel', apellidoJugador: 'Messi', idEquipoJugador: 1 },
        { idEvento: 2, idJugador: 200, tipoEvento: 'Tarjeta Roja', minuto: 80, valor: 1, observaciones: 'Falta grave', nombreJugador: 'Pedro', apellidoJugador: 'Gómez', idEquipoJugador: 2 },
      ]],
    });
    const incidencias = await obtenerIncidencias(7, partido, connection);

    expect(incidencias).toHaveLength(2);
    expect(incidencias[0].equipo).toBe('Local');
    expect(incidencias[0].nombreJugador).toBe('Lionel Messi');
    expect(incidencias[1].equipo).toBe('Visitante');
    expect(incidencias[1].observaciones).toBe('Falta grave');
  });

  it('recupera el equipo desde el prefijo de observaciones cuando el jugador no está', async () => {
    const connection = crearConnection({
      'FROM partido_evento': [[
        { idEvento: 3, idJugador: null, tipoEvento: 'Gol', minuto: null, valor: 1, observaciones: '[Visitante] Autogol', nombreJugador: null, apellidoJugador: null, idEquipoJugador: null },
      ]],
    });
    const incidencias = await obtenerIncidencias(7, partido, connection);

    expect(incidencias[0].equipo).toBe('Visitante');
    expect(incidencias[0].observaciones).toBe('Autogol');
    expect(incidencias[0].nombreJugador).toBeNull();
  });

  it('ordena por minuto con los eventos sin minuto al final', async () => {
    const connection = crearConnection({
      'FROM partido_evento': [[{ idEvento: 1, minuto: null }]],
    });
    await obtenerIncidencias(7, partido, connection);
    const [sql] = connection.query.mock.calls[0];
    expect(sql).toContain('ORDER BY e.minuto IS NULL, e.minuto, e.idEvento');
  });
});

describe('validarArbitro', () => {
  it('devuelve null cuando no se envía árbitro (opcional)', async () => {
    const connection = crearConnection({});
    expect(await validarArbitro(null, 1, connection)).toBeNull();
    expect(await validarArbitro('', 1, connection)).toBeNull();
    expect(connection.query).not.toHaveBeenCalled();
  });

  it('devuelve el id normalizado cuando el árbitro está activo y es del usuario', async () => {
    const connection = crearConnection({ 'FROM arbitro': [[{ idArbitro: 5 }]] });
    expect(await validarArbitro('5', 1, connection)).toBe(5);
  });

  it('rechaza ids no enteros o no positivos', async () => {
    const connection = crearConnection({});
    await expect(validarArbitro('abc', 1, connection)).rejects.toThrow(/no es válido/);
    await expect(validarArbitro(-3, 1, connection)).rejects.toThrow(/no es válido/);
  });

  it('lanza 404 si el árbitro no existe, está inactivo o es de otro usuario', async () => {
    const connection = crearConnection({ 'FROM arbitro': [[]] });
    await expect(validarArbitro(5, 1, connection)).rejects.toMatchObject({
      status: 404,
      message: 'No se encontró el árbitro seleccionado.',
    });
  });

  it('permite árbitros sin usuario asignado (compartidos)', async () => {
    const connection = crearConnection({ 'FROM arbitro': [[{ idArbitro: 9 }]] });
    expect(await validarArbitro(9, 1, connection)).toBe(9);
    const [sql] = connection.query.mock.calls[0];
    expect(sql).toContain('idUsuario IS NULL OR idUsuario = ?');
  });
});

describe('validarJugadorDelPartido', () => {
  it('devuelve null cuando no se envía jugador', async () => {
    const connection = crearConnection({});
    expect(await validarJugadorDelPartido(undefined, {}, connection)).toBeNull();
    expect(connection.query).not.toHaveBeenCalled();
  });

  it('devuelve el id cuando el jugador existe', async () => {
    const connection = crearConnection({ 'FROM jugador': [[{ idJugador: 33 }]] });
    expect(await validarJugadorDelPartido(33, {}, connection)).toBe(33);
  });

  it('rechaza ids inválidos', async () => {
    const connection = crearConnection({});
    await expect(validarJugadorDelPartido('xx', {}, connection)).rejects.toThrow(/no es válido/);
  });

  it('lanza 404 cuando el jugador no existe', async () => {
    const connection = crearConnection({ 'FROM jugador': [[]] });
    await expect(validarJugadorDelPartido(999, {}, connection)).rejects.toMatchObject({
      status: 404,
      message: 'No se encontró el jugador seleccionado.',
    });
  });
});

