import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

const leerRespuesta = async (response, mensaje) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || mensaje);
  return data;
};

const crearEventoVacio = (tipoPuntuacion = 'Goles') => ({
  idJugador: '', tipoEvento: tipoPuntuacion === 'Goles' ? 'Gol' : 'Punto',
  numeroPeriodo: '', minuto: '', valor: 1, observaciones: ''
});

export default function ActaPartidoForm({ idPartido, idArbitro = null, onClose, onSaved }) {
  const [datos, setDatos] = useState(null);
  const [marcadorLocal, setMarcadorLocal] = useState('0');
  const [marcadorVisitante, setMarcadorVisitante] = useState('0');
  const [periodos, setPeriodos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [idGanador, setIdGanador] = useState('');
  const [confirmarCierre, setConfirmarCierre] = useState(false);

  useEffect(() => {
    let activo = true;
    const query = idArbitro ? `?idArbitro=${idArbitro}` : '';
    apiFetch(`/partidos/${idPartido}/acta${query}`)
      .then((response) => leerRespuesta(response, 'No se pudo cargar el acta.'))
      .then((resultado) => {
        if (!activo) return;
        setDatos(resultado);
        const esSets = resultado.partido.tipoPuntuacion === 'Sets';
        setMarcadorLocal(resultado.partido.marcadorLocal == null ? '0' : String(resultado.partido.marcadorLocal));
        setMarcadorVisitante(resultado.partido.marcadorVisitante == null ? '0' : String(resultado.partido.marcadorVisitante));
        setPeriodos((resultado.periodos || []).map((periodo) => ({
          nombrePeriodo: periodo.nombrePeriodo,
          marcadorLocal: String(periodo.marcadorLocal),
          marcadorVisitante: String(periodo.marcadorVisitante),
        })));
        setEventos((resultado.eventos || []).filter((evento) => evento.tipoEvento !== 'Participación').map((evento) => ({
          idJugador: evento.idJugador == null ? '' : String(evento.idJugador),
          tipoEvento: evento.tipoEvento,
          numeroPeriodo: evento.numeroPeriodo == null ? '' : String(evento.numeroPeriodo),
          minuto: evento.minuto == null ? '' : String(evento.minuto),
          valor: evento.valor || 1,
          observaciones: evento.observaciones || '',
        })));
        setParticipantes((resultado.eventos || [])
          .filter((evento) => evento.tipoEvento === 'Participación')
          .map((evento) => String(evento.idJugador)));
        setObservaciones(resultado.acta?.observaciones || '');
        setIdGanador(resultado.partido.idEquipoGanador ? String(resultado.partido.idEquipoGanador) : '');
        if (esSets && !resultado.periodos?.length) setPeriodos([]);
      })
      .catch((fetchError) => { if (activo) setError(fetchError.message || 'No se pudo cargar el acta.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [idPartido, idArbitro]);

  const esSets = datos?.partido.tipoPuntuacion === 'Sets';
  const esVoleyPlaya = String(datos?.partido.nombreDisciplina || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().includes('playa');
  const setsParaGanar = esVoleyPlaya ? 2 : 3;
  const maxSets = setsParaGanar * 2 - 1;
  const esEliminatoria = String(datos?.partido.tipoEtapa || '').toLocaleLowerCase().includes('elimin');
  const esCerrada = datos?.acta?.estado === 'Cerrada'
    || datos?.partido.fechaCierre
    || ['Finalizado', 'Anulado', 'Pase libre'].includes(datos?.partido.estado);

  const jugadores = useMemo(() => (datos?.equipos || []).flatMap((equipo) => (
    equipo.jugadores.map((jugador) => ({ ...jugador, nombreEquipo: equipo.nombre }))
  )), [datos]);

  const modificarPeriodo = (index, campo, valor) => setPeriodos((actuales) => actuales.map((periodo, i) => (
    i === index ? { ...periodo, [campo]: valor } : periodo
  )));

  const agregarPeriodo = () => setPeriodos((actuales) => (
    actuales.length >= maxSets ? actuales : [...actuales, {
      nombrePeriodo: `Set ${actuales.length + 1}`,
      marcadorLocal: '',
      marcadorVisitante: ''
    }]
  ));

  const modificarEvento = (index, campo, valor) => setEventos((actuales) => actuales.map((evento, i) => (
    i === index ? { ...evento, [campo]: valor } : evento
  )));

  const puntosPorSet = esSets ? {
    local: periodos.filter((periodo) => Number(periodo.marcadorLocal) > Number(periodo.marcadorVisitante)).length,
    visitante: periodos.filter((periodo) => Number(periodo.marcadorVisitante) > Number(periodo.marcadorLocal)).length,
  } : null;

  const guardar = async (cerrar = false) => {
    if (guardando) return;
    if (eventos.some((evento) => evento.tipoEvento.startsWith('Tarjeta') && !evento.idJugador)) {
      setError('Seleccioná el jugador que recibió cada tarjeta.');
      return;
    }
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const response = await apiFetch(`/partidos/${idPartido}/acta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idArbitro,
          marcadorLocal: esSets ? puntosPorSet.local : Number(marcadorLocal),
          marcadorVisitante: esSets ? puntosPorSet.visitante : Number(marcadorVisitante),
          idEquipoGanador: idGanador || null,
          observaciones,
          periodos,
          eventos,
          participantes: participantes.map(Number),
          cerrar,
        }),
      });
      const resultado = await leerRespuesta(response, 'No se pudo guardar el acta.');
      if (cerrar) {
        onSaved?.(resultado);
        onClose?.();
        return;
      }
      setMensaje(resultado.message || 'Borrador guardado.');
      setDatos((actual) => ({ ...actual, acta: { ...(actual.acta || {}), estado: 'Borrador' } }));
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar el acta.');
    } finally {
      setGuardando(false);
      setConfirmarCierre(false);
    }
  };

  if (cargando) {
    return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-2xl">Cargando acta…</div>;
  }
  if (!datos) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-2xl">
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error || 'No se encontró el acta.'}</p>
        <button type="button" onClick={onClose} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cerrar</button>
      </div>
    );
  }

  const partido = datos.partido;
  return (
    <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-lime-700">Acta digital · {partido.nombreTorneo}</p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-900">{partido.equipoLocal} <span className="text-slate-400">vs.</span> {partido.equipoVisitante}</h2>
            <p className="mt-1 text-sm text-slate-500">{partido.nombreRonda || `Jornada ${partido.jornada}`} · Partido {partido.numeroPartido}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar acta" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        {esCerrada && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Acta cerrada. El resultado ya fue aplicado al torneo.</p>}
      </header>

      <div className="space-y-6 px-5 py-5 sm:px-7">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {mensaje && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{mensaje}</p>}
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900">Resultado final</h3>
              <p className="text-xs text-slate-500">{partido.nombreDisciplina} · {partido.tipoPuntuacion}</p>
            </div>
            {esSets && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Sets ganados: {puntosPorSet.local} – {puntosPorSet.visitante}</span>}
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <label className="min-w-0 text-sm font-semibold text-slate-700">
              <span className="mb-1 block truncate">{partido.equipoLocal}</span>
              <input type="number" min="0" max="999" value={esSets ? puntosPorSet.local : marcadorLocal} disabled={esSets || esCerrada} onChange={(event) => setMarcadorLocal(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-2xl font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100" />
            </label>
            <span className="pb-3 text-sm font-bold text-slate-400">–</span>
            <label className="min-w-0 text-sm font-semibold text-slate-700">
              <span className="mb-1 block truncate">{partido.equipoVisitante}</span>
              <input type="number" min="0" max="999" value={esSets ? puntosPorSet.visitante : marcadorVisitante} disabled={esSets || esCerrada} onChange={(event) => setMarcadorVisitante(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-2xl font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100" />
            </label>
          </div>
          {esEliminatoria && Number(marcadorLocal) === Number(marcadorVisitante) && (
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Ganador de la definición
              <select value={idGanador} disabled={esCerrada} onChange={(event) => setIdGanador(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
                <option value="">Seleccioná el equipo ganador</option>
                <option value={partido.idEquipoLocal}>{partido.equipoLocal}</option>
                <option value={partido.idEquipoVisitante}>{partido.equipoVisitante}</option>
              </select>
              <span className="mt-1 block text-xs font-normal text-slate-500">Se guardará como definición por penales para hacer avanzar el bracket.</span>
            </label>
          )}
        </section>

        {esSets && (
          <section>
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="font-bold text-slate-900">Detalle por set</h3><p className="text-xs text-slate-500">El sistema suma automáticamente los sets ganados.</p></div>
              {!esCerrada && <button type="button" onClick={agregarPeriodo} disabled={periodos.length >= maxSets} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50">+ Agregar set</button>}
            </div>
            <div className="mt-3 space-y-2">
              {periodos.map((periodo, index) => (
                <div key={index} className="grid grid-cols-[minmax(0,1fr)_80px_80px_auto] items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <span className="text-sm font-semibold text-slate-700">Set {index + 1}</span>
                  <input aria-label={`Marcador local set ${index + 1}`} type="number" min="0" max="999" value={periodo.marcadorLocal} disabled={esCerrada} onChange={(event) => modificarPeriodo(index, 'marcadorLocal', event.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-2 text-center" />
                  <input aria-label={`Marcador visitante set ${index + 1}`} type="number" min="0" max="999" value={periodo.marcadorVisitante} disabled={esCerrada} onChange={(event) => modificarPeriodo(index, 'marcadorVisitante', event.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-2 text-center" />
                  {!esCerrada && <button type="button" aria-label={`Quitar set ${index + 1}`} onClick={() => setPeriodos((actuales) => actuales.filter((_, i) => i !== index))} className="rounded-md px-2 py-2 text-red-600 hover:bg-red-50">×</button>}
                </div>
              ))}
              {!periodos.length && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Agregá el detalle de los sets disputados. El encuentro se define al ganar {setsParaGanar} sets.</p>}
            </div>
          </section>
        )}

        <details
          open={Boolean(datos.acta && (participantes.length || eventos.length || observaciones))}
          className="group rounded-xl border border-slate-200 bg-white"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block font-bold text-slate-900">Detalle opcional del partido</span>
              <span className="mt-0.5 block text-xs text-slate-500">Jugadores, tarjetas, goles o puntos y observaciones.</span>
            </span>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 group-open:hidden">Mostrar</span>
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 group-open:inline">Ocultar</span>
          </summary>
          <div className="space-y-6 border-t border-slate-100 p-4">
        <section>
          <div className="rounded-xl border border-slate-200 p-4">
            <div>
              <h3 className="font-bold text-slate-900">Jugadores que participaron</h3>
              <p className="text-xs text-slate-500">Marcá quiénes jugaron para validar sanciones y el cumplimiento de suspensiones.</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {datos.equipos.flatMap((equipo) => equipo.jugadores.map((jugador) => {
                const id = String(jugador.idJugador);
                const seleccionado = participantes.includes(id);
                const suspendido = Number(jugador.partidosSuspension) > 0;
                const tieneEvento = eventos.some((evento) => String(evento.idJugador) === id);
                return (
                  <label key={id} className={`flex items-center gap-3 rounded-lg border p-2.5 ${suspendido ? 'cursor-not-allowed border-red-200 bg-red-50/70' : 'cursor-pointer border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      disabled={esCerrada || suspendido || (seleccionado && tieneEvento) || (!seleccionado && participantes.length >= 60)}
                      onChange={() => setParticipantes((actuales) => (
                        seleccionado ? actuales.filter((valor) => valor !== id) : [...actuales, id]
                      ))}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{jugador.nombre} {jugador.apellido}</span>
                      <span className={`block text-[11px] ${suspendido ? 'font-semibold text-red-700' : 'text-slate-500'}`}>
                        {equipo.nombre}{suspendido ? ` · Suspendido (${jugador.partidosSuspension} partido${Number(jugador.partidosSuspension) === 1 ? '' : 's'} pendiente${Number(jugador.partidosSuspension) === 1 ? '' : 's'})` : tieneEvento ? ' · Con evento' : ''}
                      </span>
                    </span>
                  </label>
                );
              }))}
              {jugadores.length === 0 && <p className="text-sm text-slate-500">Los equipos todavía no tienen jugadores activos cargados.</p>}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div><h3 className="font-bold text-slate-900">Eventos del partido</h3><p className="text-xs text-slate-500">Goles, puntos, asistencias y tarjetas para las estadísticas.</p></div>
            {!esCerrada && <button type="button" onClick={() => setEventos((actuales) => [...actuales, crearEventoVacio(datos.partido.tipoPuntuacion)])} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700">+ Agregar evento</button>}
          </div>
          <div className="mt-3 space-y-3">
            {eventos.map((evento, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1.5fr_64px_80px_80px_auto] sm:items-end">
                <label className="text-xs font-semibold text-slate-500">Evento
                  <select value={evento.tipoEvento} disabled={esCerrada} onChange={(event) => modificarEvento(index, 'tipoEvento', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-700">
                    <option>Gol</option><option>Punto</option><option>Asistencia</option><option>Tarjeta Amarilla</option><option>Tarjeta Roja</option><option>Otro</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-500">Jugador <span className="font-normal">{evento.tipoEvento.startsWith('Tarjeta') ? '(obligatorio)' : '(opcional)'}</span>
                  <select required={evento.tipoEvento.startsWith('Tarjeta')} value={evento.idJugador} disabled={esCerrada} onChange={(change) => modificarEvento(index, 'idJugador', change.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-700">
                    <option value="">Sin jugador</option>
                    {jugadores.filter((jugador) => participantes.includes(String(jugador.idJugador))).map((jugador) => <option key={jugador.idJugador} value={jugador.idJugador}>{jugador.nombre} {jugador.apellido} · {jugador.nombreEquipo}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-500">Valor
                  <input type="number" min="1" max="999" value={evento.valor} disabled={esCerrada} onChange={(change) => modificarEvento(index, 'valor', change.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-center text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-slate-500">Período
                  <input type="number" min="1" max="20" value={evento.numeroPeriodo} disabled={esCerrada} onChange={(change) => modificarEvento(index, 'numeroPeriodo', change.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-slate-500">Minuto
                  <input type="number" min="0" max="999" value={evento.minuto} disabled={esCerrada} onChange={(change) => modificarEvento(index, 'minuto', change.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-normal" />
                </label>
                {!esCerrada && <button type="button" onClick={() => setEventos((actuales) => actuales.filter((_, i) => i !== index))} className="h-9 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50">Quitar</button>}
              </div>
            ))}
            {!eventos.length && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Todavía no se registraron eventos individuales.</p>}
          </div>
        </section>

        <label className="block text-sm font-semibold text-slate-700">Observaciones
          <textarea rows="3" maxLength="6000" value={observaciones} disabled={esCerrada} onChange={(event) => setObservaciones(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 disabled:bg-slate-100" placeholder="Incidencias o notas del acta" />
        </label>
          </div>
        </details>
      </div>

      {!esCerrada && (
        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
          <button type="button" onClick={onClose} disabled={guardando} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="button" onClick={() => guardar(false)} disabled={guardando} className="rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 disabled:opacity-60">{guardando ? 'Guardando…' : 'Guardar borrador'}</button>
          <button type="button" onClick={() => setConfirmarCierre(true)} disabled={guardando} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Cerrar acta</button>
        </footer>
      )}

      {confirmarCierre && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <section role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">¿Cerrar el acta?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Se guardará el resultado y se actualizará la tabla de posiciones o el bracket. Después del cierre, el acta quedará bloqueada para edición.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmarCierre(false)} disabled={guardando} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Seguir editando</button>
              <button type="button" onClick={() => guardar(true)} disabled={guardando} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{guardando ? 'Cerrando…' : 'Confirmar cierre'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
