import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

const leerRespuesta = async (response, mensajePredeterminado) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || mensajePredeterminado);
  return data;
};

const EQUIPOS_INCIDENCIA = ['Local', 'Visitante'];
const TIPOS_FALLBACK = ['Gol', 'Tarjeta Amarilla', 'Tarjeta Roja', 'Asistencia', 'Sanción', 'Otro'];

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
};

export default function ActaDigital() {
  const [partidos, setPartidos] = useState([]);
  const [cargandoPartidos, setCargandoPartidos] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [idPartidoSeleccionado, setIdPartidoSeleccionado] = useState('');

  const [datosActa, setDatosActa] = useState(null);
  const [cargandoActa, setCargandoActa] = useState(false);
  const [errorActa, setErrorActa] = useState('');

  const [marcadorLocal, setMarcadorLocal] = useState('');
  const [marcadorVisitante, setMarcadorVisitante] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [idArbitro, setIdArbitro] = useState('');
  const [conformidad, setConformidad] = useState(false);

  const [formIncidencia, setFormIncidencia] = useState({
    minuto: '', equipo: 'Local', tipoEvento: 'Gol', idJugador: '', observaciones: '',
  });
  const [jugadores, setJugadores] = useState({ Local: [], Visitante: [] });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  const partido = datosActa?.partido || null;
  const acta = datosActa?.acta || null;
  const incidencias = datosActa?.incidencias || [];
  const tiposEvento = datosActa?.tiposEvento?.length ? datosActa.tiposEvento : TIPOS_FALLBACK;
  const arbitros = datosActa?.arbitros || [];
  const actaFirmado = acta?.estado === 'Firmada' || partido?.estado === 'Finalizado';
  const soloLectura = actaFirmado;

  const obtenerPartidos = useCallback(async () => {
    const data = await leerRespuesta(await apiFetch('/calendario'), 'No se pudo cargar el calendario.');
    return Array.isArray(data) ? data : [];
  }, []);

  useEffect(() => {
    let activo = true;
    obtenerPartidos()
      .then((data) => {
        if (activo) {
          setPartidos(data);
          setErrorCarga('');
        }
      })
      .catch((error) => {
        if (activo) setErrorCarga(error.message || 'No se pudo cargar el calendario.');
      })
      .finally(() => {
        if (activo) setCargandoPartidos(false);
      });
    return () => { activo = false; };
  }, [obtenerPartidos]);

  const obtenerActa = useCallback(async (id) => {
    if (!id) return null;
    return leerRespuesta(
      await apiFetch(`/partidos/${id}/acta`),
      'No se pudo cargar el acta del partido.'
    );
  }, []);

  useEffect(() => {
    const id = idPartidoSeleccionado;
    let activo = true;
    if (!id) {
      Promise.resolve(null).then(() => { if (activo) setDatosActa(null); });
      return () => { activo = false; };
    }
    obtenerActa(id)
      .then((data) => {
        if (!activo || !data) return;
        setDatosActa(data);
        setMarcadorLocal(data.partido?.marcadorLocal ?? '');
        setMarcadorVisitante(data.partido?.marcadorVisitante ?? '');
        setObservaciones(data.acta?.observaciones || '');
        setIdArbitro(data.acta?.idArbitro ? String(data.acta.idArbitro) : '');
        setConformidad(false);
        setMensaje('');
        setErrorAccion('');
        setErrorActa('');
      })
      .catch((error) => {
        if (!activo) return;
        setErrorActa(error.message || 'No se pudo cargar el acta del partido.');
        setDatosActa(null);
      })
      .finally(() => {
        if (activo) setCargandoActa(false);
      });
    return () => { activo = false; };
  }, [idPartidoSeleccionado, obtenerActa]);

  // Carga los planteles de ambos equipos para la selectora de jugadores.
  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      await Promise.resolve();
      if (!partido?.idEquipoLocal || !partido?.idEquipoVisitante) {
        if (activo) setJugadores({ Local: [], Visitante: [] });
        return;
      }
      const [local, visitante] = await Promise.all([
        apiFetch(`/equipos/${partido.idEquipoLocal}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        apiFetch(`/equipos/${partido.idEquipoVisitante}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (!activo) return;
      setJugadores({
        Local: local?.jugadores || [],
        Visitante: visitante?.jugadores || [],
      });
    };
    cargar();
    return () => { activo = false; };
  }, [partido?.idEquipoLocal, partido?.idEquipoVisitante]);

  const payloadBorrador = () => ({
    marcadorLocal: marcadorLocal === '' ? null : Number(marcadorLocal),
    marcadorVisitante: marcadorVisitante === '' ? null : Number(marcadorVisitante),
    observaciones,
    idArbitro: idArbitro === '' ? null : Number(idArbitro),
  });

  const ejecutar = async (accion, ruta, opciones, mensajeExito) => {
    setGuardando(true);
    setErrorAccion('');
    setMensaje('');
    try {
      const data = await leerRespuesta(await apiFetch(ruta, opciones), 'La operación falló.');
      setDatosActa(data);
      setMensaje(mensajeExito);
      return data;
    } catch (error) {
      setErrorAccion(error.message || 'La operación falló.');
      return null;
    } finally {
      setGuardando(false);
    }
  };

  const guardarBorrador = () => ejecutar(
    'borrador',
    `/partidos/${idPartidoSeleccionado}/acta/borrador`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadBorrador()) },
    'Borrador guardado correctamente.'
  );

  const firmarActa = async () => {
    if (!conformidad) {
      setErrorAccion('Debés confirmar la conformidad con los datos del acta antes de firmar.');
      return;
    }
    await ejecutar(
      'firmar',
      `/partidos/${idPartidoSeleccionado}/acta/firmar`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payloadBorrador(), conformidad: true }),
      },
      'Acta firmado y partido finalizado.'
    );
  };

  const agregarIncidencia = async (evento) => {
    evento.preventDefault();
    const exito = await ejecutar(
      'incidencia',
      `/partidos/${idPartidoSeleccionado}/acta/incidencias`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minuto: formIncidencia.minuto,
          equipo: formIncidencia.equipo,
          tipoEvento: formIncidencia.tipoEvento,
          idJugador: formIncidencia.idJugador === '' ? null : Number(formIncidencia.idJugador),
          observaciones: formIncidencia.observaciones,
        }),
      },
      'Incidencia registrada.'
    );
    if (exito) {
      setFormIncidencia((actual) => ({ ...actual, minuto: '', idJugador: '', observaciones: '' }));
    }
  };

  const eliminarIncidencia = (idEvento) => ejecutar(
    'eliminar',
    `/partidos/${idPartidoSeleccionado}/acta/incidencias/${idEvento}`,
    { method: 'DELETE' },
    'Incidencia eliminada.'
  );

  const partidosOrdenados = useMemo(
    () => [...partidos].sort((a, b) => String(a.fechaHoraInicio || '').localeCompare(String(b.fechaHoraInicio || ''))),
    [partidos]
  );

  const inputClase = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-200 disabled:bg-slate-100';
  const labelClase = 'block text-xs font-bold text-slate-600 mb-1';

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-sm font-bold text-lime-700">Control de partido</span>
          <h1 className="text-2xl font-bold">Acta Digital</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Cargá el marcador, las incidencias y firmá el acta del partido.
          </p>
        </div>
        {acta && (
          <span className={`self-start rounded-full px-3 py-1 text-xs font-bold ${actaFirmado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {actaFirmado ? 'ACTA FIRMADA' : 'BORRADOR EN EDICIÓN'}
          </span>
        )}
      </div>

      {errorCarga && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorCarga}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className={labelClase} htmlFor="selector-partido">Partido</label>
        <select
          id="selector-partido"
          className={inputClase}
          value={idPartidoSeleccionado}
          onChange={(evento) => setIdPartidoSeleccionado(evento.target.value)}
          disabled={cargandoPartidos}
        >
          <option value="">{cargandoPartidos ? 'Cargando partidos…' : 'Seleccioná un partido'}</option>
          {partidosOrdenados.map((item) => (
            <option key={item.idPartido} value={item.idPartido}>
              {item.equipoLocal} vs {item.equipoVisitante} — {item.nombreTorneo}
              {item.estado === 'Finalizado' ? ' (finalizado)' : ''}
            </option>
          ))}
        </select>
      </div>

      {errorActa && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorActa}
        </div>
      )}

      {cargandoActa && <p className="text-sm text-slate-500">Cargando acta…</p>}

      {partido && !cargandoActa && (
        <>
          {/* MARCADOR */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  {partido.nombreTorneo} — Jornada {partido.jornada}
                </p>
                <h2 className="text-lg font-bold">
                  {partido.equipoLocal} <span className="text-slate-400">vs</span> {partido.equipoVisitante}
                </h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${partido.estado === 'Finalizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {partido.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClase} htmlFor="marcador-local">{partido.equipoLocal}</label>
                <input
                  id="marcador-local"
                  type="number"
                  min="0"
                  max="999"
                  className={inputClase}
                  value={marcadorLocal}
                  onChange={(evento) => setMarcadorLocal(evento.target.value)}
                  disabled={soloLectura || guardando}
                />
              </div>
              <div>
                <label className={labelClase} htmlFor="marcador-visitante">{partido.equipoVisitante}</label>
                <input
                  id="marcador-visitante"
                  type="number"
                  min="0"
                  max="999"
                  className={inputClase}
                  value={marcadorVisitante}
                  onChange={(evento) => setMarcadorVisitante(evento.target.value)}
                  disabled={soloLectura || guardando}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClase} htmlFor="arbitro-acta">Árbitro designado</label>
                <select
                  id="arbitro-acta"
                  className={inputClase}
                  value={idArbitro}
                  onChange={(evento) => setIdArbitro(evento.target.value)}
                  disabled={soloLectura || guardando}
                >
                  <option value="">Sin árbitro asignado</option>
                  {arbitros.map((arbitro) => (
                    <option key={arbitro.idArbitro} value={arbitro.idArbitro}>
                      {arbitro.nombre} {arbitro.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClase} htmlFor="observaciones-acta">Observaciones</label>
                <textarea
                  id="observaciones-acta"
                  rows="2"
                  className={inputClase}
                  value={observaciones}
                  onChange={(evento) => setObservaciones(evento.target.value)}
                  disabled={soloLectura || guardando}
                  placeholder="Notas generales del partido…"
                />
              </div>
            </div>
          </section>

          {/* INCIDENCIAS */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">Incidencias del partido</h3>

            {!soloLectura && (
              <form onSubmit={agregarIncidencia} className="mb-5 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-12">
                <div className="sm:col-span-2">
                  <label className={labelClase} htmlFor="inc-minuto">Minuto</label>
                  <input
                    id="inc-minuto"
                    type="number"
                    min="0"
                    max="300"
                    required
                    className={inputClase}
                    value={formIncidencia.minuto}
                    onChange={(evento) => setFormIncidencia({ ...formIncidencia, minuto: evento.target.value })}
                    disabled={guardando}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClase} htmlFor="inc-equipo">Equipo</label>
                  <select
                    id="inc-equipo"
                    className={inputClase}
                    value={formIncidencia.equipo}
                    onChange={(evento) => setFormIncidencia({ ...formIncidencia, equipo: evento.target.value, idJugador: '' })}
                    disabled={guardando}
                  >
                    {EQUIPOS_INCIDENCIA.map((equipo) => <option key={equipo} value={equipo}>{equipo}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClase} htmlFor="inc-tipo">Tipo</label>
                  <select
                    id="inc-tipo"
                    className={inputClase}
                    value={formIncidencia.tipoEvento}
                    onChange={(evento) => setFormIncidencia({ ...formIncidencia, tipoEvento: evento.target.value })}
                    disabled={guardando}
                  >
                    {tiposEvento.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClase} htmlFor="inc-jugador">Jugador (opcional)</label>
                  <select
                    id="inc-jugador"
                    className={inputClase}
                    value={formIncidencia.idJugador}
                    onChange={(evento) => setFormIncidencia({ ...formIncidencia, idJugador: evento.target.value })}
                    disabled={guardando}
                  >
                    <option value="">Sin jugador identificado</option>
                    {(jugadores[formIncidencia.equipo] || []).map((jugador) => (
                      <option key={jugador.idJugador} value={jugador.idJugador}>
                        {jugador.nombre} {jugador.apellido}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end sm:col-span-2">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full rounded-lg bg-lime-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-lime-600 disabled:opacity-60"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            )}

            {incidencias.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Sin incidencias registradas.</p>
            ) : (
              <ol className="space-y-2">
                {incidencias.map((incidencia) => (
                  <li key={incidencia.idEvento} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="w-12 shrink-0 rounded bg-lime-500 px-1 py-0.5 text-center text-xs font-bold text-white">
                      {incidencia.minuto}′
                    </span>
                    <span className="w-28 shrink-0 text-xs font-bold text-slate-600">{incidencia.tipoEvento}</span>
                    <span className="w-16 shrink-0 text-xs font-semibold text-slate-500">{incidencia.equipo}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      {incidencia.nombreJugador || 'Jugador sin identificar'}
                      {incidencia.observaciones ? ` — ${incidencia.observaciones}` : ''}
                    </span>
                    {!soloLectura && (
                      <button
                        type="button"
                        onClick={() => eliminarIncidencia(incidencia.idEvento)}
                        disabled={guardando}
                        aria-label="Eliminar incidencia"
                        className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* MENSAJES */}
          {mensaje && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {mensaje}
            </div>
          )}
          {errorAccion && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorAccion}
            </div>
          )}

          {/* ACCIONES */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {!soloLectura && (
              <label className="mb-4 flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={conformidad}
                  onChange={(evento) => setConformidad(evento.target.checked)}
                  disabled={guardando}
                  className="mt-0.5 h-4 w-4 accent-lime-500"
                />
                Declaro conformidad con los datos cargados en este acta.
              </label>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {!soloLectura && (
                <>
                  <button
                    type="button"
                    onClick={guardarBorrador}
                    disabled={guardando}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    {guardando ? 'Guardando…' : 'Guardar Borrador'}
                  </button>
                  <button
                    type="button"
                    onClick={firmarActa}
                    disabled={guardando || !conformidad}
                    className="rounded-lg bg-lime-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Firmar y Finalizar Acta
                  </button>
                </>
              )}
              {soloLectura && (
                <p className="text-sm font-semibold text-emerald-700">
                  Acta firmado el {formatearFecha(acta?.fechaCierre)}.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

