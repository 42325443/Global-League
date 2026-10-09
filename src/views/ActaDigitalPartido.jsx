import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import ActaPartidoForm from '../components/ActaPartidoForm';
import { apiFetch } from '../lib/api';

const leerRespuesta = async (response, mensajePredeterminado) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || mensajePredeterminado);
  return data;
};

const convertirFecha = (valor) => {
  if (!valor) return null;
  const fecha = new Date(String(valor).replace(' ', 'T'));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const formatearFecha = (valor) => {
  const fecha = convertirFecha(valor);
  if (!fecha) return 'Fecha pendiente';
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).format(fecha);
};

const formatearHorario = (partido) => {
  const inicio = convertirFecha(partido.fechaHoraInicio);
  if (!inicio) return 'Horario pendiente';
  const formatoHora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' });
  const horaInicio = formatoHora.format(inicio);
  const fin = convertirFecha(partido.fechaHoraFin);
  return fin ? horaInicio + '–' + formatoHora.format(fin) : horaInicio;
};

const obtenerIdArbitroActa = (partido) => {
  if (partido.idArbitroActa) return Number(partido.idArbitroActa);
  const arbitrosAsignados = String(partido.idsArbitros || '').split(',').filter(Boolean);
  return arbitrosAsignados.length ? Number(arbitrosAsignados[0]) : null;
};

const estaResueltoSinActa = (partido) => (
  ['Anulado', 'Pase libre'].includes(partido.estado)
  || (partido.estado === 'Finalizado' && partido.estadoActa !== 'Cerrada')
);

const puedeAbrirActa = (partido) => (
  Boolean(partido.idEquipoLocal && partido.idEquipoVisitante)
  && !estaResueltoSinActa(partido)
);

const obtenerEstadoActa = (partido) => {
  if (partido.estadoActa === 'Cerrada') return 'Acta cerrada';
  if (partido.estadoActa === 'Borrador') return 'Borrador';
  if (estaResueltoSinActa(partido)) return partido.estado || 'Resuelto';
  if (!partido.idEquipoLocal || !partido.idEquipoVisitante) return 'Esperando equipos';
  return partido.estado || 'Pendiente';
};

export default function ActaDigitalPartido() {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [filtroTorneo, setFiltroTorneo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

  const cargarPartidos = useCallback(async (manual = false) => {
    if (manual) setActualizando(true);
    else setCargando(true);
    setError('');
    try {
      const data = await leerRespuesta(
        await apiFetch('/calendario'),
        'No se pudieron cargar los partidos.'
      );
      setPartidos(Array.isArray(data) ? data : []);
    } catch (cargaError) {
      setError(cargaError.message || 'No se pudieron cargar los partidos.');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    apiFetch('/calendario')
      .then((response) => leerRespuesta(response, 'No se pudieron cargar los partidos.'))
      .then((data) => {
        if (activo) setPartidos(Array.isArray(data) ? data : []);
      })
      .catch((cargaError) => {
        if (activo) setError(cargaError.message || 'No se pudieron cargar los partidos.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, []);

  const torneos = useMemo(() => {
    const opciones = new Map();
    partidos.forEach((partido) => opciones.set(String(partido.idTorneo), partido.nombreTorneo));
    return [...opciones.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [partidos]);

  const partidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();
    return partidos.filter((partido) => {
      if (filtroTorneo && String(partido.idTorneo) !== filtroTorneo) return false;
      if (filtroEstado === 'pendientes' && (partido.estadoActa === 'Cerrada' || estaResueltoSinActa(partido))) return false;
      if (filtroEstado === 'cerradas' && partido.estadoActa !== 'Cerrada') return false;
      if (!texto) return true;
      return [
        partido.nombreTorneo,
        partido.equipoLocal,
        partido.equipoVisitante,
        partido.nombreRonda,
        partido.nombresArbitros,
      ].some((valor) => String(valor || '').toLocaleLowerCase().includes(texto));
    });
  }, [partidos, filtroTorneo, filtroEstado, busqueda]);

  const actasCerradas = partidos.filter((partido) => partido.estadoActa === 'Cerrada').length;
  const actasPendientes = partidos.filter((partido) => (
    puedeAbrirActa(partido) && partido.estadoActa !== 'Cerrada'
  )).length;

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-lime-50/70 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-lime-700">Registro de encuentros</span>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Acta Digital</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Elegí un partido para cargar o consultar su acta. El torneo se actualiza al cerrar el acta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => cargarPartidos(true)}
          disabled={actualizando || cargando}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <ArrowPathIcon className={actualizando ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {actualizando ? 'Actualizando…' : 'Actualizar partidos'}
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Partidos visibles</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{partidos.length}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-amber-800">Actas pendientes</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{actasPendientes}</p>
        </article>
        <article className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 shadow-sm sm:col-span-1">
          <p className="text-xs font-semibold text-emerald-800">Actas cerradas</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{actasCerradas}</p>
        </article>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative block">
              <span className="sr-only">Buscar partido</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar equipo, torneo o árbitro…"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por torneo</span>
              <select
                value={filtroTorneo}
                onChange={(event) => setFiltroTorneo(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
              >
                <option value="">Todos los torneos</option>
                {torneos.map((torneo) => <option key={torneo.id} value={torneo.id}>{torneo.nombre}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar actas por estado">
            {[
              ['todos', 'Todos'],
              ['pendientes', 'Pendientes'],
              ['cerradas', 'Cerradas'],
            ].map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltroEstado(valor)}
                className={filtroEstado === valor
                  ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white'
                  : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200'}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          {cargando ? (
            <p className="py-12 text-center text-sm font-medium text-slate-500">Cargando partidos…</p>
          ) : partidosFiltrados.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {partidosFiltrados.map((partido) => {
                const disponible = puedeAbrirActa(partido);
                const cerrada = partido.estadoActa === 'Cerrada';
                const equipoLocal = partido.equipoLocal || 'Equipo por definir';
                const equipoVisitante = partido.equipoVisitante || (partido.estado === 'Pase libre' ? 'Pase libre' : 'Equipo por definir');
                return (
                  <article key={partido.idPartido} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase tracking-wide text-lime-700">{partido.nombreTorneo}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {partido.nombreRonda || 'Jornada ' + partido.jornada} · Partido {partido.numeroPartido || partido.idPartido}
                        </p>
                      </div>
                      <span className={cerrada
                        ? 'shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800'
                        : partido.estadoActa === 'Borrador'
                          ? 'shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-800'
                          : 'shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600'}
                      >
                        {obtenerEstadoActa(partido)}
                      </span>
                    </div>

                    <div className="my-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg bg-slate-50 px-3 py-4 text-center">
                      <p className="break-words text-sm font-bold text-slate-800">{equipoLocal}</p>
                      <strong className="text-xs font-black text-slate-400">VS</strong>
                      <p className="break-words text-sm font-bold text-slate-800">{equipoVisitante}</p>
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                      <span className="inline-flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4 shrink-0" />{formatearFecha(partido.fechaHoraInicio)}</span>
                      <span className="inline-flex items-center gap-1.5"><ClockIcon className="h-4 w-4 shrink-0" />{formatearHorario(partido)}</span>
                      {partido.nombreCancha && <span className="inline-flex items-center gap-1.5"><MapPinIcon className="h-4 w-4 shrink-0" />{partido.nombreCancha}</span>}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="min-w-0 truncate text-xs text-slate-500">
                        {partido.nombresArbitros || 'Sin árbitro asignado'}
                        {cerrada && ' · ' + (partido.golesLocal ?? 0) + '–' + (partido.golesVisitante ?? 0)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPartidoSeleccionado(partido)}
                        disabled={!disponible}
                        className={cerrada
                          ? 'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'
                          : 'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'}
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        {cerrada ? 'Ver acta' : partido.estadoActa === 'Borrador' ? 'Continuar acta' : disponible ? 'Crear acta de partido' : 'No disponible'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <DocumentTextIcon className="h-10 w-10 text-slate-300" />
              <p className="mt-3 font-bold text-slate-700">
                {partidos.length ? 'No hay partidos que coincidan con los filtros.' : 'Todavía no hay partidos para mostrar.'}
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-500">Los partidos generados para tus torneos aparecerán en esta lista.</p>
            </div>
          )}
        </div>
      </section>

      {partidoSeleccionado && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <button
            type="button"
            aria-label="Cerrar acta"
            onClick={() => setPartidoSeleccionado(null)}
            className="absolute inset-0 cursor-default"
          />
          <ActaPartidoForm
            idPartido={partidoSeleccionado.idPartido}
            idArbitro={obtenerIdArbitroActa(partidoSeleccionado)}
            onClose={() => setPartidoSeleccionado(null)}
            onSaved={() => cargarPartidos(true)}
          />
        </div>
      )}
    </div>
  );
}
