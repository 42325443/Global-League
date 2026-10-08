// src/views/Torneos.jsx
import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { TorneoWizard } from '../components/TorneoWizard';
import { apiFetch } from '../lib/api';

// Array inicial vacío listo para recibir torneos reales
const MOCK_TORNEOS = [];

export default function Torneos() {
  const [torneos, setTorneos] = useState(MOCK_TORNEOS);
  const [deporteFiltro, setDeporteFiltro] = useState('');
  const [disciplinaFiltro, setDisciplinaFiltro] = useState('');
  const [modalidadFiltro, setModalidadFiltro] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isWizardVisible, setIsWizardVisible] = useState(false);
  const wizardCloseTimer = useRef(null);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [pestanaDetalle, setPestanaDetalle] = useState('principal');
  const [partidos, setPartidos] = useState([]);
  const [cargandoPartidos, setCargandoPartidos] = useState(false);
  const [generandoFixture, setGenerandoFixture] = useState(false);
  const [errorPartidos, setErrorPartidos] = useState('');
  const [isDetalleModalVisible, setIsDetalleModalVisible] = useState(false);
  const [torneoAEliminar, setTorneoAEliminar] = useState(null);
  const [eliminandoTorneo, setEliminandoTorneo] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState('');

  // 1. Función extraída para poder recargar los torneos cuando queramos
  const cargarTorneos = () => {
    apiFetch('/torneos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setTorneos(data);
      })
      .catch((err) => console.error('Error al obtener torneos:', err));
  };

  // 2. useEffect llama a la función al abrir la pantalla
  useEffect(() => {
    cargarTorneos();
  }, []);

  const abrirWizard = () => {
    if (wizardCloseTimer.current) window.clearTimeout(wizardCloseTimer.current);
    setIsWizardOpen(true);
    setIsWizardVisible(false);
    requestAnimationFrame(() => setIsWizardVisible(true));
  };

  const cerrarWizard = () => {
    setIsWizardVisible(false);
    if (wizardCloseTimer.current) window.clearTimeout(wizardCloseTimer.current);
    wizardCloseTimer.current = window.setTimeout(() => {
      setIsWizardOpen(false);
      wizardCloseTimer.current = null;
    }, 220);
  };

  useEffect(() => () => {
    if (wizardCloseTimer.current) window.clearTimeout(wizardCloseTimer.current);
  }, []);

  const abrirModalDetalle = (torneo) => {
    setTorneoSeleccionado(torneo);
    setPestanaDetalle('principal');
    setPartidos([]);
    setErrorPartidos('');
    setCargandoPartidos(true);
    apiFetch(`/torneos/${torneo.id}/partidos`)
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los partidos.');
        return data;
      })
      .then((data) => setPartidos(Array.isArray(data) ? data : []))
      .catch((error) => setErrorPartidos(error.message || 'No se pudieron cargar los partidos.'))
      .finally(() => setCargandoPartidos(false));
    requestAnimationFrame(() => setIsDetalleModalVisible(true));
  };

  const cerrarModalDetalle = () => {
    setIsDetalleModalVisible(false);
    setTimeout(() => {
      setTorneoSeleccionado(null);
      setPartidos([]);
    }, 200);
  };

  const partidosPorRonda = useMemo(() => {
    const grupos = new Map();
    partidos.forEach((partido) => {
      const nombre = partido.nombreRonda || `Jornada ${partido.jornada}`;
      if (!grupos.has(nombre)) grupos.set(nombre, []);
      grupos.get(nombre).push(partido);
    });
    return [...grupos.entries()].map(([nombre, items]) => ({ nombre, partidos: items }));
  }, [partidos]);

  const nombreParticipante = (partido, lado) => {
    const equipo = lado === 'local' ? partido.equipoLocal : partido.equipoVisitante;
    if (equipo) return equipo;
    if (partido.estado === 'Pase libre' && lado === 'visitante') return 'Pase libre';
    const idOrigen = lado === 'local' ? partido.idPartidoOrigenLocal : partido.idPartidoOrigenVisitante;
    if (!idOrigen) return 'Por definir';
    const partidoOrigen = partidos.find((item) => Number(item.idPartido) === Number(idOrigen));
    if (!partidoOrigen) return 'Ganador por definir';
    const etapaOrigen = partidoOrigen.nombreRonda || `Jornada ${partidoOrigen.jornada}`;
    return `Ganador de ${etapaOrigen} #${partidoOrigen.numeroPartido}`;
  };

  const esTorneoEliminatorio = (torneo) => (
    String(torneo?.modalidad || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('elimin')
  );

  const generarFixtureExistente = async () => {
    if (!torneoSeleccionado || generandoFixture) return;
    setGenerandoFixture(true);
    setErrorPartidos('');
    try {
      const res = await apiFetch(`/torneos/${torneoSeleccionado.id}/fixture`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudieron generar los partidos.');
      const partidosRes = await apiFetch(`/torneos/${torneoSeleccionado.id}/partidos`);
      const nuevosPartidos = await partidosRes.json().catch(() => []);
      if (!partidosRes.ok) throw new Error(nuevosPartidos.error || 'Se generaron los partidos, pero no se pudieron cargar.');
      setPartidos(Array.isArray(nuevosPartidos) ? nuevosPartidos : []);
    } catch (error) {
      setErrorPartidos(error.message || 'No se pudieron generar los partidos.');
    } finally {
      setGenerandoFixture(false);
    }
  };

  const renderPartidosAgrupados = (comoBracket = false) => {
    if (cargandoPartidos) return <p className="py-8 text-center text-sm text-slate-500">Cargando partidos…</p>;
    if (errorPartidos) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{errorPartidos}</p>;
    if (partidos.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-slate-500">Todavía no hay partidos para este torneo.</p>
          <button
            type="button"
            onClick={generarFixtureExistente}
            disabled={generandoFixture}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {generandoFixture ? 'Generando partidos…' : 'Generar partidos'}
          </button>
        </div>
      );
    }

    return (
      <div className={comoBracket ? 'flex gap-4 overflow-x-auto pb-3' : 'grid grid-cols-1 gap-4 md:grid-cols-2'}>
        {partidosPorRonda.map((grupo) => (
          <section key={grupo.nombre} className={`rounded-xl border border-slate-200 bg-slate-50 p-3 ${comoBracket ? 'w-64 shrink-0' : ''}`}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{grupo.nombre}</h3>
            <div className="space-y-2">
              {grupo.partidos.map((partido) => (
                <article key={partido.idPartido} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>Partido {partido.numeroPartido || partido.idPartido}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">{partido.estado || 'Pendiente'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">{nombreParticipante(partido, 'local')}</span>
                    <strong className="shrink-0 font-mono text-slate-900">{partido.golesLocal ?? '—'}</strong>
                  </div>
                  <div className="my-1 border-t border-slate-100" />
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">{nombreParticipante(partido, 'visitante')}</span>
                    <strong className="shrink-0 font-mono text-slate-900">{partido.golesVisitante ?? '—'}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const abrirConfirmacionEliminacion = (torneo) => {
    setErrorEliminacion('');
    setTorneoAEliminar(torneo);
  };

  const cerrarConfirmacionEliminacion = useCallback(() => {
    if (eliminandoTorneo) return;
    setTorneoAEliminar(null);
    setErrorEliminacion('');
  }, [eliminandoTorneo]);

  const formatearFecha = (valor) => {
    if (!valor) return 'Sin definir';
    const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return String(valor);
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(fecha);
  };

  const eliminarTorneo = async () => {
    if (!torneoAEliminar || eliminandoTorneo) return;

    setEliminandoTorneo(true);
    setErrorEliminacion('');

    try {
      const res = await apiFetch(`/torneos/${torneoAEliminar.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTorneos((prev) => prev.filter((t) => t.id !== torneoAEliminar.id));
        setTorneoAEliminar(null);
      } else {
        console.error('Error del servidor al eliminar el torneo');
        setErrorEliminacion('No se pudo eliminar el torneo. Intentá nuevamente.');
      }
    } catch (error) {
      console.error('Error de red al eliminar el torneo:', error);
      setErrorEliminacion('No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.');
    } finally {
      setEliminandoTorneo(false);
    }
  };

  useEffect(() => {
    if (!torneoAEliminar || eliminandoTorneo) return undefined;

    const manejarEscape = (event) => {
      if (event.key === 'Escape') cerrarConfirmacionEliminacion();
    };

    window.addEventListener('keydown', manejarEscape);
    return () => window.removeEventListener('keydown', manejarEscape);
  }, [torneoAEliminar, eliminandoTorneo, cerrarConfirmacionEliminacion]);

  const torneosFiltrados = useMemo(() => {
    return torneos.filter((torneo) => {
      const coincideDeporte = deporteFiltro
        ? (torneo.deporte || '').toLowerCase() === deporteFiltro.toLowerCase()
        : true;
      const coincideDisciplina = disciplinaFiltro
        ? (torneo.disciplina || '').toLowerCase().includes(disciplinaFiltro.toLowerCase())
        : true;
      const coincideModalidad = modalidadFiltro
        ? torneo.modalidad === modalidadFiltro
        : true;
      const coincideFecha = fechaFiltro
        ? torneo.fechaInicio >= fechaFiltro
        : true;

      return coincideDeporte && coincideDisciplina && coincideModalidad && coincideFecha;
    });
  }, [torneos, deporteFiltro, disciplinaFiltro, modalidadFiltro, fechaFiltro]);

  const limpiarFiltros = () => {
    setDeporteFiltro('');
    setDisciplinaFiltro('');
    setModalidadFiltro('');
    setFechaFiltro('');
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      'En Curso': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      'Próximo': 'bg-amber-50 text-amber-700 ring-amber-600/20',
      'Finalizado': 'bg-red-50 text-red-700 ring-red-600/20',
      'Suspendido': 'bg-slate-100 text-slate-700 ring-slate-500/20',
      'Cancelado': 'bg-red-50 text-red-700 ring-red-600/20'
    };
    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
          styles[estado] || styles['Finalizado']
        }`}
      >
        {estado || 'Próximo'}
      </span>
    );
  };

  return (
    <div className="h-full min-w-0 overflow-x-hidden bg-slate-50/50 font-montserrat text-slate-800">
      <div className="mx-auto min-w-0 max-w-7xl">
        <header className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-lime-50/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lime-700 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-lime-500 ring-4 ring-lime-100" />
              Gestión deportiva
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="font-montserrat text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Torneos</h1>
              <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {torneosFiltrados.length} {torneosFiltrados.length === 1 ? 'torneo' : 'torneos'}
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
              Organizá tus competencias y consultá su estado desde un solo lugar.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirWizard}
            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:min-h-11 sm:w-auto"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Crear torneo
          </button>
        </header>

        <section className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-800 sm:text-sm">Filtrar torneos</h2>
              <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">Encontrá una competencia rápidamente.</p>
            </div>
            {(deporteFiltro || disciplinaFiltro || modalidadFiltro || fechaFiltro) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-x-2 gap-y-2 sm:gap-3 lg:grid-cols-4">
            <div>
              <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-slate-400 sm:mb-1 sm:text-xs">
                Deporte
              </label>
              <select
                value={deporteFiltro}
                onChange={(e) => setDeporteFiltro(e.target.value)}
                className="min-w-0 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:px-3 sm:py-2.5 sm:text-sm"
              >
                <option value="">Todos los deportes</option>
                <option value="Fútbol">Fútbol</option>
                <option value="Basketball">Básquet</option>
                <option value="Volleyball">Vóley</option>
              </select>
            </div>

            <div>
              <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-slate-400 sm:mb-1 sm:text-xs">
                Disciplina
              </label>
              <input
                type="text"
                placeholder="Ej: Futsal, 3x3..."
                value={disciplinaFiltro}
                onChange={(e) => setDisciplinaFiltro(e.target.value)}
                className="min-w-0 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </div>

            <div>
              <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-slate-400 sm:mb-1 sm:text-xs">
                Modalidad
              </label>
              <select
                value={modalidadFiltro}
                onChange={(e) => setModalidadFiltro(e.target.value)}
                className="min-w-0 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:px-3 sm:py-2.5 sm:text-sm"
              >
                <option value="">Todas las modalidades</option>
                <option value="Liga">Liga</option>
                <option value="Eliminación Directa">Eliminatoria</option>
              </select>
            </div>

            <div>
              <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-slate-400 sm:mb-1 sm:text-xs">
                Desde Fecha
              </label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="min-w-0 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </div>
          </div>

        </section>

        <section aria-label="Torneos registrados" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">Tus competencias</h2>
              <p className="mt-0.5 text-xs text-slate-400">{torneosFiltrados.length ? 'Seleccioná un torneo para consultar su avance.' : 'Los torneos que crees aparecerán acá.'}</p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">
              {torneosFiltrados.length} / {torneos.length}
            </span>
          </div>

          {torneosFiltrados.length > 0 ? (
            <>
              <div className="max-h-[min(62vh,640px)] overflow-y-auto overflow-x-hidden overscroll-contain xl:hidden">
                <ul className="space-y-3 p-3 sm:p-4">
                  {torneosFiltrados.map((torneo) => (
                    <li key={torneo.id} className="min-w-0 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-4">
                      <div className="flex min-w-0 items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{torneo.deporte || 'Fútbol'}{torneo.disciplina ? ` · ${torneo.disciplina}` : ''}</p>
                          <h3 className="break-words font-montserrat text-sm font-bold leading-5 text-slate-900 sm:text-base">{torneo.nombre || 'Torneo sin nombre'}</h3>
                        </div>
                        <div className="shrink-0">{getEstadoBadge(torneo.estado)}</div>
                      </div>

                      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sede</p>
                          <p className="mt-0.5 truncate text-xs font-medium text-slate-700" title={torneo.ubicacion || 'Sin asignar'}>{torneo.ubicacion || 'Sin asignar'}</p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Equipos</p>
                          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-800">{torneo.equiposInscriptos ?? 0}<span className="font-medium text-slate-400"> / {torneo.cantidadEquiposMax ?? '—'}</span></p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="max-w-[55%] truncate rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{torneo.modalidad || 'Liga'}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirModalDetalle(torneo)}
                            className="min-h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                          >
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirConfirmacionEliminacion(torneo)}
                            aria-label={`Eliminar ${torneo.nombre || 'torneo'}`}
                            className="min-h-8 rounded-lg border border-red-100 bg-red-50/70 px-3 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hidden max-h-[min(62vh,640px)] overflow-y-auto overflow-x-hidden overscroll-contain xl:block">
                <table className="w-full table-fixed text-left text-sm text-slate-600">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[15%]" />
                    <col className="w-[14%]" />
                    <col className="w-[9%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                    <tr>
                      <th className="px-3 py-3.5">Nombre</th>
                      <th className="px-3 py-3.5">Deporte</th>
                      <th className="px-3 py-3.5">Sede</th>
                      <th className="px-2 py-3.5 text-center">Equipos</th>
                      <th className="px-3 py-3.5">Modalidad</th>
                      <th className="px-2 py-3.5">Estado</th>
                      <th className="px-2 py-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {torneosFiltrados.map((torneo) => (
                      <tr key={torneo.id} className="transition-colors hover:bg-blue-50/40">
                        <td className="px-3 py-3.5">
                          <p className="truncate font-bold text-slate-900" title={torneo.nombre}>{torneo.nombre || 'Torneo sin nombre'}</p>
                          {torneo.disciplina && <p className="mt-0.5 truncate text-xs text-slate-400" title={torneo.disciplina}>{torneo.disciplina}</p>}
                        </td>
                        <td className="px-3 py-3.5"><span className="block truncate font-medium text-slate-700" title={torneo.deporte || 'Fútbol'}>{torneo.deporte || 'Fútbol'}</span></td>
                        <td className="px-3 py-3.5"><span className="block truncate text-slate-600" title={torneo.ubicacion || 'Sin asignar'}>{torneo.ubicacion || 'Sin asignar'}</span></td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold tabular-nums text-slate-700">
                            {torneo.equiposInscriptos ?? 0}<span className="px-0.5 text-slate-400">/</span>{torneo.cantidadEquiposMax ?? '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3.5"><span className="block truncate text-slate-600" title={torneo.modalidad || 'Liga'}>{torneo.modalidad || 'Liga'}</span></td>
                        <td className="px-2 py-3.5">{getEstadoBadge(torneo.estado)}</td>
                        <td className="px-2 py-3.5">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => abrirModalDetalle(torneo)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              Detalle
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirConfirmacionEliminacion(torneo)}
                              className="rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center px-5 py-10 text-center sm:py-14">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-50 text-lime-700 ring-1 ring-lime-100">
                <TrophyIcon aria-hidden="true" className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-montserrat text-base font-bold text-slate-900">
                {torneos.length === 0 ? 'Todavía no hay torneos' : 'No encontramos coincidencias'}
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 sm:text-sm">
                {torneos.length === 0 ? 'Creá tu primera competencia para empezar a organizar equipos y encuentros.' : 'Probá cambiar los filtros para ver otros torneos.'}
              </p>
              {torneos.length === 0 ? (
                <button type="button" onClick={abrirWizard} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
                  Crear mi primer torneo
                </button>
              ) : (
                <button type="button" onClick={limpiarFiltros} className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </section>

        {/* Modal Wizard (Crear Torneo) */}
        {isWizardOpen && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 transition-opacity duration-200 ${isWizardVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            <button
              type="button"
              aria-label="Cerrar creación de torneo"
              className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 ${isWizardVisible ? 'opacity-100' : 'opacity-0'}`}
              onClick={cerrarWizard}
            />
            <div className={`relative z-10 w-full max-w-3xl transform transition-all duration-200 ease-out ${isWizardVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.98] opacity-0'}`}>
              <TorneoWizard
                onVolver={cerrarWizard}
                onTorneoCreado={cargarTorneos}
              />
            </div>
          </div>
        )}

        {/* Confirmación de eliminación */}
        {torneoAEliminar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
            <button
              type="button"
              aria-label="Cerrar confirmación"
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={cerrarConfirmacionEliminacion}
              disabled={eliminandoTorneo}
            />
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirmar-eliminacion-titulo"
              aria-describedby="confirmar-eliminacion-descripcion"
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10"
            >
              <div className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                      <path d="M12 8v4m0 4h.01M10.3 3.86 1.82 18.5A2 2 0 0 0 3.55 21h16.9a2 2 0 0 0 1.73-2.5L13.7 3.86a2 2 0 0 0-3.46 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 id="confirmar-eliminacion-titulo" className="text-lg font-bold text-slate-900">
                      ¿Eliminar este torneo?
                    </h2>
                    <p id="confirmar-eliminacion-descripcion" className="mt-1 text-sm leading-6 text-slate-500">
                      Se eliminará este torneo. Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="truncate font-bold text-slate-900" title={torneoAEliminar.nombre}>
                    {torneoAEliminar.nombre || 'Torneo sin nombre'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[torneoAEliminar.deporte, torneoAEliminar.disciplina].filter(Boolean).join(' · ') || 'Deporte sin definir'}
                  </p>
                  <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fechas</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {formatearFecha(torneoAEliminar.fechaInicio)} – {formatearFecha(torneoAEliminar.fechaFin)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sede</dt>
                      <dd className="mt-1 font-medium text-slate-700">{torneoAEliminar.ubicacion || 'Sin asignar'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Formato</dt>
                      <dd className="mt-1 font-medium text-slate-700">{torneoAEliminar.modalidad || 'Sin definir'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Equipos inscriptos</dt>
                      <dd className="mt-1 font-medium text-slate-700">{torneoAEliminar.equiposInscriptos ?? 0}</dd>
                    </div>
                  </dl>
                </div>

                {errorEliminacion && (
                  <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorEliminacion}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={cerrarConfirmacionEliminacion}
                  disabled={eliminandoTorneo}
                  autoFocus
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={eliminarTorneo}
                  disabled={eliminandoTorneo}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {eliminandoTorneo ? 'Eliminando…' : 'Eliminar torneo'}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Modal Ver Detalle */}
        {torneoSeleccionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
              className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 ${
                isDetalleModalVisible ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={cerrarModalDetalle}
            />

            <div
              className={`relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 z-10 ${
                isDetalleModalVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-slate-400">Detalles del Torneo</span>
                    {getEstadoBadge(torneoSeleccionado.estado)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{torneoSeleccionado.nombre}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sede: <strong>{torneoSeleccionado.ubicacion || 'Sin asignar'}</strong> • Modalidad:{' '}
                    <strong>{torneoSeleccionado.modalidad}</strong>
                  </p>
                </div>
                <button onClick={cerrarModalDetalle} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  ✕
                </button>
              </div>

              {/* Pestañas del Modal */}
              <div className="flex gap-6 border-b border-slate-200 mt-4 text-sm font-medium">
                <button
                  onClick={() => setPestanaDetalle('principal')}
                  className={`pb-3 cursor-pointer ${
                    pestanaDetalle === 'principal'
                      ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  {esTorneoEliminatorio(torneoSeleccionado) ? 'Cuadro / Brackets' : 'Tabla de Posiciones'}
                </button>
                <button
                  onClick={() => setPestanaDetalle('partidos')}
                  className={`pb-3 cursor-pointer ${
                    pestanaDetalle === 'partidos'
                      ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  Partidos
                </button>
                <button
                  onClick={() => setPestanaDetalle('estadisticas')}
                  className={`pb-3 cursor-pointer ${
                    pestanaDetalle === 'estadisticas'
                      ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  Estadísticas del Torneo
                </button>
              </div>

              {/* Contenido según pestaña */}
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {pestanaDetalle === 'principal' && (
                  <div>
                    {esTorneoEliminatorio(torneoSeleccionado) ? (
                      renderPartidosAgrupados(true)
                    ) : (
                      /* TABLA DE POSICIONES */
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="text-xs uppercase text-slate-400 border-b border-slate-100">
                            <tr>
                              <th className="py-2 px-3">Pos</th>
                              <th className="py-2 px-3">Equipo</th>
                              <th className="py-2 px-3 text-center">PJ</th>
                              <th className="py-2 px-3 text-center">PG</th>
                              <th className="py-2 px-3 text-center">PE</th>
                              <th className="py-2 px-3 text-center">PP</th>
                              <th className="py-2 px-3 text-right font-bold">PTS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {torneoSeleccionado.posiciones && torneoSeleccionado.posiciones.length > 0 ? (
                              torneoSeleccionado.posiciones.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-2 px-3 text-xs text-slate-400">{idx + 1}</td>
                                  <td className="py-2 px-3 font-medium text-slate-800">{p.equipo}</td>
                                  <td className="py-2 px-3 text-center">{p.pj}</td>
                                  <td className="py-2 px-3 text-center">{p.pg}</td>
                                  <td className="py-2 px-3 text-center">{p.pe}</td>
                                  <td className="py-2 px-3 text-center">{p.pp}</td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-900">{p.pts}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="py-6 text-center text-slate-400">
                                  Aún no hay posiciones registradas para este torneo.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {pestanaDetalle === 'partidos' && renderPartidosAgrupados(esTorneoEliminatorio(torneoSeleccionado))}

                {pestanaDetalle === 'estadisticas' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Goleadores */}
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Goleadores</h3>
                      {torneoSeleccionado.estadisticas?.goleadores?.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {torneoSeleccionado.estadisticas.goleadores.map((g, idx) => (
                            <li key={idx} className="flex justify-between items-center text-slate-700">
                              <div>
                                <p className="font-semibold text-slate-900">{g.jugador}</p>
                                <p className="text-xs text-slate-400">{g.equipo}</p>
                              </div>
                              <span className="font-mono font-bold text-slate-900">{g.goles} G</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin goles registrados.</p>
                      )}
                    </div>

                    {/* Asistidores */}
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Máximos Asistentes</h3>
                      {torneoSeleccionado.estadisticas?.asistidores?.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {torneoSeleccionado.estadisticas.asistidores.map((a, idx) => (
                            <li key={idx} className="flex justify-between items-center text-slate-700">
                              <div>
                                <p className="font-semibold text-slate-900">{a.jugador}</p>
                                <p className="text-xs text-slate-400">{a.equipo}</p>
                              </div>
                              <span className="font-mono font-bold text-slate-900">{a.asistencias} AST</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin asistencias registradas.</p>
                      )}
                    </div>

                    {/* Tarjetas Amarillas */}
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tarjetas Amarillas</h3>
                      {torneoSeleccionado.estadisticas?.amarillas?.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {torneoSeleccionado.estadisticas.amarillas.map((t, idx) => (
                            <li key={idx} className="flex justify-between items-center text-slate-700">
                              <div>
                                <p className="font-semibold text-slate-900">{t.jugador}</p>
                                <p className="text-xs text-slate-400">{t.equipo}</p>
                              </div>
                              <span className="font-mono font-bold text-amber-600">{t.tarjetas} TA</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin tarjetas amarillas.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
