import { apiFetch } from './api';

const leerRespuesta = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No se pudo consultar el estado de los torneos.');
  return data;
};

export const completarEstadoTorneo = async (partidos) => {
  const esLista = Array.isArray(partidos);
  const lista = esLista ? partidos : [partidos];
  const faltanEstados = lista.some((partido) => partido && !partido.estadoTorneo);
  if (!faltanEstados) return partidos;

  try {
    const torneos = await leerRespuesta(await apiFetch('/torneos'));
    const estadosPorId = new Map((Array.isArray(torneos) ? torneos : []).map((torneo) => [
      String(torneo.idTorneo ?? torneo.id),
      torneo.estado ?? torneo.estadoCalculado ?? null,
    ]));

    const completados = lista.map((partido) => {
      if (!partido || partido.estadoTorneo) return partido;
      return {
        ...partido,
        estadoTorneo: estadosPorId.get(String(partido.idTorneo)) || null,
      };
    });

    return esLista ? completados : completados[0];
  } catch {
    return partidos;
  }
};
