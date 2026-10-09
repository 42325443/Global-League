import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../lib/api';

const CRITERIOS = [
  { valor: 'Diferencia', etiqueta: 'Diferencia de goles' },
  { valor: 'MarcadorAFavor', etiqueta: 'Marcador a favor' },
  { valor: 'ResultadoDirecto', etiqueta: 'Resultado directo' },
  { valor: 'FairPlay', etiqueta: 'Fair play' },
];

const CRITERIOS_PREDETERMINADOS = ['Diferencia', 'MarcadorAFavor', 'ResultadoDirecto'];

const leerRespuesta = async (response, mensajePredeterminado) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || mensajePredeterminado);
  return data;
};

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
};

const esFormatoEliminacion = (torneo) => (
  String(torneo?.modalidad || torneo?.nombreFormato || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .includes('elimin')
);

const obtenerParticipante = (partido, lado, partidos) => {
  const nombre = lado === 'local' ? partido.equipoLocal : partido.equipoVisitante;
  if (nombre) return nombre;
  const idOrigen = lado === 'local' ? partido.idPartidoOrigenLocal : partido.idPartidoOrigenVisitante;
  if (!idOrigen) return partido.estado === 'Pase libre' && lado === 'visitante' ? 'Pase libre' : 'Por definir';
  const origen = partidos.find((item) => Number(item.idPartido) === Number(idOrigen));
  if (!origen) return 'Ganador por definir';
  return 'Ganador de ' + (origen.nombreRonda || 'la ronda anterior') + ' #' + (origen.numeroPartido || origen.idPartido);
};

const agruparPartidosPorRonda = (partidos) => {
  const grupos = new Map();
  partidos.forEach((partido) => {
    const nombre = partido.nombreRonda || 'Jornada ' + partido.jornada;
    if (!grupos.has(nombre)) grupos.set(nombre, []);
    grupos.get(nombre).push(partido);
  });
  return [...grupos.entries()].map(([nombre, encuentros]) => ({ nombre, partidos: encuentros }));
};

export default function TablaPosiciones() {
  const [torneos, setTorneos] = useState([]);
  const [idTorneo, setIdTorneo] = useState('');
  const [datos, setDatos] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [fechaActualizacion, setFechaActualizacion] = useState('');
  const [cargandoTorneos, setCargandoTorneos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [errorTorneos, setErrorTorneos] = useState('');
  const [modalCriterios, setModalCriterios] = useState(false);
  const [criteriosEdicion, setCriteriosEdicion] = useState(CRITERIOS_PREDETERMINADOS);
  const [confirmarCriterios, setConfirmarCriterios] = useState(false);
  const [guardandoCriterios, setGuardandoCriterios] = useState(false);
  const [errorCriterios, setErrorCriterios] = useState('');

  useEffect(() => {
    let activo = true;
    apiFetch('/torneos')
      .then((response) => leerRespuesta(response, 'No se pudieron cargar los torneos.'))
      .then((data) => {
        if (activo) setTorneos(Array.isArray(data) ? data : []);
      })
      .catch((cargaError) => {
        if (activo) setErrorTorneos(cargaError.message || 'No se pudieron cargar los torneos.');
      })
      .finally(() => {
        if (activo) setCargandoTorneos(false);
      });
    return () => { activo = false; };
  }, []);

  const torneoSeleccionado = useMemo(
    () => torneos.find((torneo) => String(torneo.idTorneo) === String(idTorneo)) || null,
    [torneos, idTorneo]
  );
  const esEliminatoria = esFormatoEliminacion(torneoSeleccionado);

  const obtenerVistaTorneo = useCallback(async (id, esBracket) => {
    const solicitudes = [
      apiFetch('/torneos/' + id + '/posiciones'),
      esBracket ? apiFetch('/torneos/' + id + '/partidos') : Promise.resolve(null),
    ];
    const [respuestaPosiciones, respuestaPartidos] = await Promise.all(solicitudes);
    const posiciones = await leerRespuesta(respuestaPosiciones, 'No se pudo cargar la clasificación del torneo.');
    const encuentros = respuestaPartidos
      ? await leerRespuesta(respuestaPartidos, 'No se pudieron cargar los partidos del bracket.')
      : [];
    return { posiciones, partidos: Array.isArray(encuentros) ? encuentros : [] };
  }, []);

  const actualizarVista = useCallback(async (id, esBracket, manual = false) => {
    if (manual) setActualizando(true);
    else setCargando(true);
    setError('');
    try {
      const vista = await obtenerVistaTorneo(id, esBracket);
      setDatos(vista.posiciones);
      setPartidos(vista.partidos);
      setFechaActualizacion(vista.posiciones.fechaActualizacion || new Date().toISOString());
    } catch (cargaError) {
      setDatos(null);
      setPartidos([]);
      setError(cargaError.message || 'No se pudo cargar la información del torneo.');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [obtenerVistaTorneo]);

  useEffect(() => {
    if (!idTorneo || !torneoSeleccionado) {
      return undefined;
    }
    let activo = true;
    obtenerVistaTorneo(idTorneo, esEliminatoria)
      .then((vista) => {
        if (!activo) return;
        setDatos(vista.posiciones);
        setPartidos(vista.partidos);
        setFechaActualizacion(vista.posiciones.fechaActualizacion || new Date().toISOString());
      })
      .catch((cargaError) => {
        if (!activo) return;
        setDatos(null);
        setPartidos([]);
        setError(cargaError.message || 'No se pudo cargar la información del torneo.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [idTorneo, torneoSeleccionado, esEliminatoria, obtenerVistaTorneo]);

  const posiciones = Array.isArray(datos?.posiciones) ? datos.posiciones : [];
  const partidosPorRonda = useMemo(() => agruparPartidosPorRonda(partidos), [partidos]);

  const abrirCriterios = () => {
    setErrorCriterios('');
    setConfirmarCriterios(false);
    setCriteriosEdicion(
      Array.isArray(datos?.criteriosDesempate) && datos.criteriosDesempate.length === 3
        ? [...datos.criteriosDesempate]
        : [...CRITERIOS_PREDETERMINADOS]
    );
    setModalCriterios(true);
  };

  const moverCriterio = (indice, delta) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= criteriosEdicion.length) return;
    const copia = [...criteriosEdicion];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    setCriteriosEdicion(copia);
    setConfirmarCriterios(false);
  };

  const guardarCriterios = async () => {
    if (!confirmarCriterios) {
      setConfirmarCriterios(true);
      return;
    }
    setGuardandoCriterios(true);
    setErrorCriterios('');
    try {
      await leerRespuesta(await apiFetch('/torneos/' + idTorneo + '/criterios-desempate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteriosDesempate: criteriosEdicion }),
      }), 'No se pudieron guardar los criterios.');
      setModalCriterios(false);
      await actualizarVista(idTorneo, false, true);
    } catch (guardadoError) {
      setErrorCriterios(guardadoError.message || 'No se pudieron guardar los criterios.');
      setConfirmarCriterios(false);
    } finally {
      setGuardandoCriterios(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-lime-50/70 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-lime-700">Competición</span>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            {esEliminatoria ? 'Cuadro de eliminación' : 'Tabla de posiciones'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Seleccioná un torneo para consultar su clasificación o el avance de sus rondas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!esEliminatoria && torneoSeleccionado && datos?.permiteModificarCriterios && (
            <button
              type="button"
              onClick={abrirCriterios}
              disabled={cargando}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Criterios de desempate
            </button>
          )}
          {idTorneo && (
            <button
              type="button"
              onClick={() => actualizarVista(idTorneo, esEliminatoria, true)}
              disabled={actualizando || cargando}
              className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-lime-600 disabled:opacity-60"
            >
              <ArrowPathIcon className={actualizando ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {actualizando ? 'Actualizando…' : 'Actualizar'}
            </button>
          )}
        </div>
      </header>

      <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="selector-torneo-posiciones">Torneo</label>
        <select
          id="selector-torneo-posiciones"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
          value={idTorneo}
          onChange={(event) => {
            setIdTorneo(event.target.value);
            setDatos(null);
            setPartidos([]);
            setError('');
            setCargando(Boolean(event.target.value));
          }}
          disabled={cargandoTorneos}
        >
          <option value="">
            {cargandoTorneos ? 'Cargando torneos…' : torneos.length ? 'Seleccioná un torneo' : 'No hay torneos disponibles'}
          </option>
          {torneos.map((torneo) => (
            <option key={torneo.idTorneo} value={torneo.idTorneo}>
              {torneo.nombreTorneo} · {torneo.modalidad || torneo.nombreFormato || 'Formato sin definir'}
            </option>
          ))}
        </select>
      </section>

      {(errorTorneos || error) && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorTorneos || error}
        </div>
      )}

      {cargando && <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">Cargando información del torneo…</p>}

      {!cargando && !idTorneo && !errorTorneos && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <TrophyIcon className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 font-bold text-slate-700">Elegí un torneo</h2>
          <p className="mt-1 text-sm text-slate-500">La clasificación o el bracket aparecerá acá.</p>
        </div>
      )}

      {!cargando && error && idTorneo && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          No se pudo mostrar la competencia. Revisá el mensaje anterior y volvé a intentar.
        </div>
      )}

      {!cargando && idTorneo && datos && !esEliminatoria && (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{torneoSeleccionado?.deporte} · {torneoSeleccionado?.disciplina}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{torneoSeleccionado?.nombreTorneo}</h2>
              <p className="mt-1 text-xs text-slate-500">La tabla se calcula a partir de los partidos con acta cerrada.</p>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {posiciones.length ? posiciones.map((equipo) => (
                <article key={equipo.equipoId} className="px-4 py-4">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-extrabold text-slate-600">{equipo.posicion}</span>
                      <h3 className="break-words text-sm font-bold text-slate-800">{equipo.equipo}</h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-lime-50 px-3 py-1.5 text-sm font-extrabold text-lime-800">{equipo.puntos} pts</span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                    {[['PJ', equipo.pj], ['PG', equipo.pg], ['PE', equipo.pe], ['PP', equipo.pp]].map(([etiqueta, valor]) => (
                      <div key={etiqueta} className="rounded-lg bg-slate-50 px-1 py-2">
                        <span className="block text-[10px] font-semibold uppercase text-slate-400">{etiqueta}</span>
                        <strong className="mt-0.5 block text-sm text-slate-700">{valor}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-xs">
                    {[['A favor', equipo.gf], ['En contra', equipo.gc], ['Diferencia', equipo.diferencia]].map(([etiqueta, valor]) => (
                      <div key={etiqueta} className="flex justify-between gap-1 rounded-lg border border-slate-100 px-2 py-2">
                        <span className="text-slate-500">{etiqueta}</span><strong>{valor}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              )) : (
                <p className="px-4 py-10 text-center text-sm text-slate-500">Todavía no hay equipos inscriptos en este torneo.</p>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {['#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'A favor', 'En contra', 'DIF', 'PTS'].map((titulo) => (
                      <th key={titulo} className="px-3 py-3 text-center first:text-left">{titulo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posiciones.map((equipo) => (
                    <tr key={equipo.equipoId} className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-bold text-slate-500">{equipo.posicion}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{equipo.equipo}</td>
                      {[equipo.pj, equipo.pg, equipo.pe, equipo.pp, equipo.gf, equipo.gc, equipo.diferencia].map((valor, indice) => (
                        <td key={indice} className="px-3 py-3 text-center text-slate-600">{valor}</td>
                      ))}
                      <td className="px-3 py-3 text-center font-extrabold text-lime-700">{equipo.puntos}</td>
                    </tr>
                  ))}
                  {!posiciones.length && <tr><td colSpan="10" className="px-3 py-10 text-center text-slate-500">Todavía no hay equipos inscriptos en este torneo.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p><span className="font-bold uppercase">Desempate:</span> {(datos.criteriosDesempate || []).map((criterio) => CRITERIOS.find((item) => item.valor === criterio)?.etiqueta || criterio).join(' → ') || 'Sin criterios definidos'}</p>
          </div>
          {!datos.permiteModificarCriterios && (
            <p className="mt-2 text-xs text-slate-500">Los criterios quedan bloqueados cuando el torneo comienza o ya se cerró una acta.</p>
          )}
        </>
      )}

      {!cargando && idTorneo && datos && esEliminatoria && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{torneoSeleccionado?.deporte} · {torneoSeleccionado?.disciplina}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{torneoSeleccionado?.nombreTorneo}</h2>
            <p className="mt-1 text-xs text-slate-500">El ganador de cada encuentro avanza a la siguiente ronda.</p>
          </div>
          {partidosPorRonda.length ? (
            <div className="flex gap-4 overflow-x-auto p-4 sm:p-5">
              {partidosPorRonda.map((grupo) => (
                <section key={grupo.nombre} className="w-64 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">{grupo.nombre}</h3>
                  <div className="space-y-3">
                    {grupo.partidos.map((partido) => {
                      const local = obtenerParticipante(partido, 'local', partidos);
                      const visitante = obtenerParticipante(partido, 'visitante', partidos);
                      const localGana = Number(partido.idEquipoGanador) === Number(partido.idEquipoLocal);
                      const visitanteGana = Number(partido.idEquipoGanador) === Number(partido.idEquipoVisitante);
                      return (
                        <article key={partido.idPartido} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                            <span>Partido {partido.numeroPartido || partido.idPartido}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{partido.estado || 'Pendiente'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className={localGana ? 'min-w-0 truncate font-bold text-emerald-700' : 'min-w-0 truncate font-medium text-slate-800'}>{local}</span>
                            <strong className="shrink-0 font-mono text-slate-900">{partido.golesLocal ?? '—'}</strong>
                          </div>
                          <div className="my-1 border-t border-slate-100" />
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className={visitanteGana ? 'min-w-0 truncate font-bold text-emerald-700' : 'min-w-0 truncate font-medium text-slate-800'}>{visitante}</span>
                            <strong className="shrink-0 font-mono text-slate-900">{partido.golesVisitante ?? '—'}</strong>
                          </div>
                          {partido.tipoResolucion && partido.tipoResolucion !== 'Normal' && (
                            <p className="mt-2 text-[10px] font-semibold text-slate-500">{partido.tipoResolucion}</p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="px-4 py-12 text-center text-sm text-slate-500">Este torneo todavía no tiene un bracket generado.</p>
          )}
        </section>
      )}

      {!cargando && idTorneo && datos && (
        <p className="mt-3 text-right text-xs text-slate-500">Actualizado: {formatearFecha(fechaActualizacion)}</p>
      )}

      {modalCriterios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <button
            type="button"
            aria-label="Cerrar criterios"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setModalCriterios(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-criterios-posiciones"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 id="titulo-criterios-posiciones" className="text-lg font-bold text-slate-900">Criterios de desempate</h2>
            <p className="mt-1 text-sm text-slate-500">El primer criterio tiene mayor prioridad.</p>

            {errorCriterios && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{errorCriterios}</p>}

            <ol className="mt-4 space-y-2">
              {criteriosEdicion.map((criterio, indice) => (
                <li key={criterio} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="w-5 text-xs font-bold text-slate-400">{indice + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                    {CRITERIOS.find((item) => item.valor === criterio)?.etiqueta || criterio}
                  </span>
                  <button type="button" onClick={() => moverCriterio(indice, -1)} disabled={indice === 0 || guardandoCriterios} aria-label="Subir criterio" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40">↑</button>
                  <button type="button" onClick={() => moverCriterio(indice, 1)} disabled={indice === criteriosEdicion.length - 1 || guardandoCriterios} aria-label="Bajar criterio" className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40">↓</button>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModalCriterios(false)} disabled={guardandoCriterios} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60">Cancelar</button>
              <button
                type="button"
                onClick={guardarCriterios}
                disabled={guardandoCriterios}
                className={confirmarCriterios
                  ? 'rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60'
                  : 'rounded-lg bg-lime-500 px-4 py-2 text-sm font-bold text-white hover:bg-lime-600 disabled:opacity-60'}
              >
                {guardandoCriterios ? 'Guardando…' : confirmarCriterios ? 'Confirmar cambios' : 'Guardar criterios'}
              </button>
            </div>
            {confirmarCriterios && !guardandoCriterios && <p className="mt-3 text-center text-xs font-semibold text-amber-700">¿Confirmás este orden? La clasificación se recalculará.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
