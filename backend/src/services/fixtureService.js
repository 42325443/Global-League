import { randomInt } from 'node:crypto';

const mezclar = (valores) => {
  const resultado = [...valores];
  for (let i = resultado.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }
  return resultado;
};

export const esFormatoEliminacion = (nombreFormato) => (
  String(nombreFormato || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .includes('elimin')
);

const crearPartido = async (connection, idTorneo, partido) => {
  const [resultado] = await connection.query(`
    INSERT INTO partido (
      idTorneo,
      idEquipoLocal,
      idEquipoVisitante,
      jornada,
      tipoEtapa,
      nombreRonda,
      numeroPartido,
      idPartidoOrigenLocal,
      idPartidoOrigenVisitante,
      estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    idTorneo,
    partido.idEquipoLocal,
    partido.idEquipoVisitante,
    partido.jornada,
    partido.tipoEtapa,
    partido.nombreRonda,
    partido.numeroPartido,
    partido.idPartidoOrigenLocal,
    partido.idPartidoOrigenVisitante,
    partido.estado,
  ]);

  return { ...partido, idPartido: resultado.insertId };
};

const generarLiga = async (connection, idTorneo, idsEquipos) => {
  const rotacion = [...idsEquipos];
  if (rotacion.length % 2 !== 0) rotacion.push(null);

  const totalJornadas = rotacion.length - 1;
  const mitad = rotacion.length / 2;
  let totalPartidos = 0;

  for (let jornada = 0; jornada < totalJornadas; jornada += 1) {
    let numeroPartido = 0;
    for (let indice = 0; indice < mitad; indice += 1) {
      let local = rotacion[indice];
      let visitante = rotacion[rotacion.length - 1 - indice];
      if (local === null || visitante === null) continue;

      if (jornada % 2 === 1) [local, visitante] = [visitante, local];
      numeroPartido += 1;
      await crearPartido(connection, idTorneo, {
        idEquipoLocal: local,
        idEquipoVisitante: visitante,
        jornada: jornada + 1,
        tipoEtapa: 'Liga',
        nombreRonda: null,
        numeroPartido,
        idPartidoOrigenLocal: null,
        idPartidoOrigenVisitante: null,
        estado: 'Pendiente',
      });
      totalPartidos += 1;
    }

    rotacion.splice(1, 0, rotacion.pop());
  }

  return { totalPartidos, totalRondas: totalJornadas };
};

const nombreRondaEliminatoria = (numeroRonda, totalRondas) => {
  if (numeroRonda === totalRondas) return 'Final';

  const equiposEnRonda = 2 ** (totalRondas - numeroRonda + 1);
  const nombrePorCantidad = {
    4: 'Semifinal',
    8: 'Cuartos de final',
    16: 'Octavos de final',
    32: 'Dieciseisavos de final',
  };

  return nombrePorCantidad[equiposEnRonda] || `Ronda ${numeroRonda}`;
};

const generarEliminacion = async (connection, idTorneo, idsEquipos) => {
  const equipos = mezclar(idsEquipos);
  const cantidadRondas = Math.ceil(Math.log2(equipos.length));
  const tamanoCuadro = 2 ** cantidadRondas;
  const cantidadPartidosPrimeraRonda = tamanoCuadro / 2;
  const cantidadPasesLibres = tamanoCuadro - equipos.length;
  const posicionesConPase = new Set(
    Array.from({ length: cantidadPasesLibres }, (_, indice) => (
      Math.floor(indice * cantidadPartidosPrimeraRonda / cantidadPasesLibres)
    ))
  );

  let indiceEquipo = 0;
  let numeroPartido = 0;
  let totalPartidos = 0;
  let rondaAnterior = [];

  for (let indice = 0; indice < cantidadPartidosPrimeraRonda; indice += 1) {
    numeroPartido += 1;
    const tienePase = posicionesConPase.has(indice);
    const partido = await crearPartido(connection, idTorneo, {
      idEquipoLocal: equipos[indiceEquipo++],
      idEquipoVisitante: tienePase ? null : equipos[indiceEquipo++],
      jornada: 1,
      tipoEtapa: 'Eliminatoria',
      nombreRonda: nombreRondaEliminatoria(1, cantidadRondas),
      numeroPartido,
      idPartidoOrigenLocal: null,
      idPartidoOrigenVisitante: null,
      estado: tienePase ? 'Pase libre' : 'Pendiente',
    });

    partido.equipoGanadorConocido = tienePase ? partido.idEquipoLocal : null;
    rondaAnterior.push(partido);
    totalPartidos += 1;
  }

  for (let jornada = 2; jornada <= cantidadRondas; jornada += 1) {
    const rondaActual = [];
    const nombreRonda = nombreRondaEliminatoria(jornada, cantidadRondas);

    for (let indice = 0; indice < rondaAnterior.length; indice += 2) {
      const origenLocal = rondaAnterior[indice];
      const origenVisitante = rondaAnterior[indice + 1];
      const equipoLocal = origenLocal.equipoGanadorConocido ?? null;
      const equipoVisitante = origenVisitante.equipoGanadorConocido ?? null;
      const partido = await crearPartido(connection, idTorneo, {
        idEquipoLocal: equipoLocal,
        idEquipoVisitante: equipoVisitante,
        jornada,
        tipoEtapa: 'Eliminatoria',
        nombreRonda,
        numeroPartido: rondaActual.length + 1,
        idPartidoOrigenLocal: origenLocal.idPartido,
        idPartidoOrigenVisitante: origenVisitante.idPartido,
        estado: equipoLocal && equipoVisitante ? 'Pendiente' : 'Esperando equipos',
      });

      partido.equipoGanadorConocido = null;
      rondaActual.push(partido);
      totalPartidos += 1;
    }

    rondaAnterior = rondaActual;
  }

  return { totalPartidos, totalRondas: cantidadRondas };
};

export const generarFixtureEnTransaccion = async (connection, idTorneo, idsEquipos, nombreFormato) => {
  if (!Array.isArray(idsEquipos) || idsEquipos.length < 2) {
    throw Object.assign(new Error('Se necesitan al menos 2 equipos para generar los partidos.'), { status: 400 });
  }

  if (new Set(idsEquipos).size !== idsEquipos.length) {
    throw Object.assign(new Error('La lista de equipos contiene duplicados.'), { status: 400 });
  }

  if (esFormatoEliminacion(nombreFormato)) {
    return generarEliminacion(connection, idTorneo, idsEquipos);
  }

  if (String(nombreFormato || '').trim().toLocaleLowerCase() !== 'liga') {
    throw Object.assign(
      new Error(`El formato "${nombreFormato}" todavía no está soportado para generar partidos.`),
      { status: 400 }
    );
  }

  return generarLiga(connection, idTorneo, idsEquipos);
};