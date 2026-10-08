import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

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

const COLUMNAS = [
  { clave: 'pj', titulo: 'PJ' },
  { clave: 'pg', titulo: 'PG' },
  { clave: 'pe', titulo: 'PE' },
  { clave: 'pp', titulo: 'PP' },
  { clave: 'gf', titulo: 'GF' },
  { clave: 'gc', titulo: 'GC' },
  { clave: 'dg', titulo: 'DG' },
  { clave: 'pts', titulo: 'PTS' },
];

export default function TablaPosiciones() {
  const [torneos, setTorneos] = useState([]);
  const [idTorneo, setIdTorneo] = useState('');
  const [datos, setDatos] = useState(null);
  const [fechaActualizacion, setFechaActualizacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [errorRed, setErrorRed] = useState('');

  const [modalCriterios, setModalCriterios] = useState(false);
  const [criteriosEdicion, setCriteriosEdicion] = useState([]);
  const [confirmarCriterios, setConfirmarCriterios] = useState(false);
  const [guardandoCriterios, setGuardandoCriterios] = useState(false);
  const [errorCriterios, setErrorCriterios] = useState('');

  useEffect(() => {
    let activo = true;
    apiFetch('/torneos')
      .then((respuesta) => leerRespuesta(respuesta, 'No se pudieron cargar los torneos.'))
      .then((data) => {
        if (activo) setTorneos(Array.isArray(data) ? data : []);
      })
      .catch((cargaError) => {
        if (activo) setError(cargaError.message);
      });
    return () => { activo = false; };
  }, []);

  const obtenerTabla = useCallback(async (id) => {
    const respuesta = await apiFetch(`/torneos/${id}/posiciones`);
    return leerRespuesta(respuesta, 'No se pudo cargar la tabla de posiciones.');
  }, []);

  useEffect(() => {
    const id = idTorneo;
    let activo = true;
    if (!id) {
      Promise.resolve(null).then(() => { if (activo) setDatos(null); });
      return () => { activo = false; };
    }
    obtenerTabla(id)
      .then((data) => {
        if (!activo) return;
        setDatos(data);
        setFechaActualizacion(data.fechaActualizacion || new Date().toISOString());
        setError('');
        setErrorRed('');
      })
      .catch((cargaError) => {
        if (!activo) return;
        setError(cargaError.message || 'No se pudo cargar la tabla de posiciones.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [idTorneo, obtenerTabla]);

  // Refresco manual disparado por el botón "Actualizar".
  const actualizarTabla = async () => {
    if (!idTorneo) return;
    setActualizando(true);
    setError('');
    setErrorRed('');
    try {
      const data = await obtenerTabla(idTorneo);
      setDatos(data);
      setFechaActualizacion(data.fechaActualizacion || new Date().toISOString());
    } catch (cargaError) {
      if (cargaError instanceof TypeError || /fetch|red|network/i.test(cargaError.message)) {
        setErrorRed('No se pudo conectar con el servidor. Revisá tu conexión y volvé a intentar.');
      } else {
        setError(cargaError.message || 'No se pudo actualizar la tabla de posiciones.');
      }
    } finally {
      setActualizando(false);
    }
  };

  const abrirCriterios = async () => {
    setErrorCriterios('');
    setConfirmarCriterios(false);
    try {
      const data = await leerRespuesta(
        await apiFetch(`/torneos/${idTorneo}/criterios`),
        'No se pudieron cargar los criterios.'
      );
      setCriteriosEdicion(data.criterios || []);
      setModalCriterios(true);
    } catch (cargaError) {
      setErrorCriterios(cargaError.message);
    }
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
      const data = await leerRespuesta(
        await apiFetch(`/torneos/${idTorneo}/criterios`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ criterios: criteriosEdicion }),
        }),
        'No se pudieron guardar los criterios.'
      );
      setCriteriosEdicion(data.criterios || criteriosEdicion);
      setModalCriterios(false);
      await actualizarTabla();
    } catch (guardadoError) {
      setErrorCriterios(guardadoError.message || 'No se pudieron guardar los criterios.');
      setConfirmarCriterios(false);
    } finally {
      setGuardandoCriterios(false);
    }
  };

  const hayTorneos = torneos.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-sm font-bold text-lime-700">Clasificación</span>
          <h1 className="text-2xl font-bold">Tabla de Posiciones</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Consultá la posición de los equipos y actualizá cuando quieras.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => abrirCriterios()}
            disabled={!idTorneo || cargando}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            Ver/editar criterios
          </button>
          <button
            type="button"
            onClick={() => actualizarTabla()}
            disabled={!idTorneo || actualizando}
            className="flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-lime-600 disabled:opacity-60"
          >
            {actualizando && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
            )}
            {actualizando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="selector-torneo-posiciones">Torneo</label>
        <select
          id="selector-torneo-posiciones"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-200"
          value={idTorneo}
          onChange={(evento) => setIdTorneo(evento.target.value)}
        >
          <option value="">{hayTorneos ? 'Seleccioná un torneo' : 'No hay torneos disponibles'}</option>
          {torneos.map((torneo) => (
            <option key={torneo.idTorneo} value={torneo.idTorneo}>{torneo.nombreTorneo}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      {errorRed && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="alert">
          {errorRed}
        </div>
      )}
      {errorCriterios && !modalCriterios && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorCriterios}
        </div>
      )}

      {cargando && <p className="text-sm text-slate-500">Calculando tabla…</p>}

      {!cargando && idTorneo && datos && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <th className="px-3 py-3 font-bold">#</th>
                <th className="px-3 py-3 font-bold">Equipo</th>
                {COLUMNAS.map((columna) => (
                  <th key={columna.clave} className="px-3 py-3 text-center font-bold">{columna.titulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.tabla.length === 0 && (
                <tr>
                  <td colSpan={COLUMNAS.length + 2} className="px-3 py-8 text-center text-slate-400">
                    Todavía no hay equipos en este torneo.
                  </td>
                </tr>
              )}
              {datos.tabla.map((fila) => (
                <tr key={fila.idEquipo} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-3 py-2 font-bold text-slate-600">{fila.posicion}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{fila.nombreEquipo}</td>
                  {COLUMNAS.map((columna) => (
                    <td
                      key={columna.clave}
                      className={`px-3 py-2 text-center ${columna.clave === 'pts' ? 'font-bold text-lime-700' : 'text-slate-600'}`}
                    >
                      {fila[columna.clave]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && idTorneo && datos && (
        <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-bold uppercase">Criterios:</span> {datos.criterios?.join(' → ')}
          </p>
          <p>
            <span className="font-bold uppercase">Fecha de actualización:</span> {formatearFecha(fechaActualizacion)}
          </p>
        </div>
      )}

      {modalCriterios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <button
            type="button"
            aria-label="Cerrar modal de criterios"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setModalCriterios(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-criterios"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 id="titulo-criterios" className="text-lg font-bold">Criterios de desempate</h2>
            <p className="mt-1 text-sm text-slate-500">
              Reordená los criterios. El primer criterio tiene mayor prioridad.
            </p>

            {errorCriterios && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {errorCriterios}
              </div>
            )}

            <ol className="mt-4 space-y-2">
              {criteriosEdicion.map((criterio, indice) => (
                <li key={criterio} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="w-5 text-xs font-bold text-slate-400">{indice + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{criterio}</span>
                  <button
                    type="button"
                    onClick={() => moverCriterio(indice, -1)}
                    disabled={indice === 0 || guardandoCriterios}
                    aria-label={`Subir ${criterio}`}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moverCriterio(indice, 1)}
                    disabled={indice === criteriosEdicion.length - 1 || guardandoCriterios}
                    aria-label={`Bajar ${criterio}`}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40"
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalCriterios(false)}
                disabled={guardandoCriterios}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCriterios}
                disabled={guardandoCriterios}
                className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition disabled:opacity-60 ${
                  confirmarCriterios ? 'bg-amber-500 hover:bg-amber-600' : 'bg-lime-500 hover:bg-lime-600'
                }`}
              >
                {guardandoCriterios
                  ? 'Guardando…'
                  : confirmarCriterios
                    ? 'Confirmar cambios'
                    : 'Guardar criterios'}
              </button>
            </div>
            {confirmarCriterios && !guardandoCriterios && (
              <p className="mt-3 text-center text-xs font-semibold text-amber-700">
                ¿Confirmás este orden? Se recalculará la tabla con los nuevos criterios.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

