import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import CalendarioMensual from '../components/CalendarioMensual';

const leerRespuesta = async (response, mensajePredeterminado) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || mensajePredeterminado);
  return data;
};

const obtenerFechaHoyLocal = () => {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
};

const obtenerHoraActualLocal = () => {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
};

const crearFormularioProgramacion = (partido) => ({
  fecha: String(partido.fechaHoraInicio || partido.fechaInicioTorneo || '').slice(0, 10),
  horaInicio: String(partido.fechaHoraInicio || '').slice(11, 16) || '09:00',
  horaFin: String(partido.fechaHoraFin || '').slice(11, 16) || '10:00',
  idCancha: partido.idCancha ? String(partido.idCancha) : '',
});

const formatearFecha = (valor) => {
  if (!valor) return 'Fecha pendiente';
  const fecha = new Date(`${String(valor).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
};

const formatearHorario = (partido) => {
  if (!partido.fechaHoraInicio || !partido.fechaHoraFin) return '';
  const inicio = String(partido.fechaHoraInicio).slice(11, 16);
  const fin = String(partido.fechaHoraFin).slice(11, 16);
  return `${inicio} a ${fin}`;
};

export default function Calendario() {
  const [partidos, setPartidos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [arbitros, setArbitros] = useState([]);
  const [modoAsignacion, setModoAsignacion] = useState(false);
  const [filtroTorneo, setFiltroTorneo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  const [formularioProgramacion, setFormularioProgramacion] = useState(null);
  const [guardandoProgramacion, setGuardandoProgramacion] = useState(false);
  const [errorProgramacion, setErrorProgramacion] = useState('');
  const [mostrarFormularioCancha, setMostrarFormularioCancha] = useState(false);
  const [formularioCancha, setFormularioCancha] = useState({ nombreCancha: '', ubicacion: '', descripcion: '' });
  const [guardandoCancha, setGuardandoCancha] = useState(false);
  const [errorCancha, setErrorCancha] = useState('');
  const [mensajeCancha, setMensajeCancha] = useState('');
  const [partidoArbitros, setPartidoArbitros] = useState(null);
  const [idsArbitrosSeleccionados, setIdsArbitrosSeleccionados] = useState([]);
  const [guardandoArbitros, setGuardandoArbitros] = useState(false);
  const [errorArbitros, setErrorArbitros] = useState('');
  const fechaHoy = obtenerFechaHoyLocal();
  const horaActual = obtenerHoraActualLocal();
  const fechasMinimas = [fechaHoy, partidoSeleccionado?.fechaInicioTorneo].filter(Boolean);
  const fechaMinimaProgramacion = fechasMinimas.reduce(
    (mayor, fecha) => (fecha > mayor ? fecha : mayor),
    fechaHoy
  );

  const obtenerDatos = useCallback(async () => {
      const [respuestaPartidos, respuestaCanchas, respuestaArbitros] = await Promise.all([
        apiFetch('/calendario'),
        apiFetch('/canchas'),
        apiFetch('/arbitros'),
      ]);
      const [partidosData, canchasData, arbitrosData] = await Promise.all([
        leerRespuesta(respuestaPartidos, 'No se pudo cargar el calendario.'),
        leerRespuesta(respuestaCanchas, 'No se pudieron cargar las canchas.'),
        leerRespuesta(respuestaArbitros, 'No se pudieron cargar los árbitros.'),
      ]);
      return {
        partidos: Array.isArray(partidosData) ? partidosData : [],
        canchas: Array.isArray(canchasData) ? canchasData : [],
        arbitros: Array.isArray(arbitrosData) ? arbitrosData : [],
      };
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await obtenerDatos();
      setPartidos(datos.partidos);
      setCanchas(datos.canchas);
      setArbitros(datos.arbitros);
    } catch (cargaError) {
      setError(cargaError.message || 'No se pudieron cargar los datos del calendario.');
    } finally {
      setCargando(false);
    }
  }, [obtenerDatos]);

  useEffect(() => {
    let activo = true;
    obtenerDatos()
      .then((datos) => {
        if (!activo) return;
        setPartidos(datos.partidos);
        setCanchas(datos.canchas);
        setArbitros(datos.arbitros);
      })
      .catch((cargaError) => {
        if (activo) setError(cargaError.message || 'No se pudieron cargar los datos del calendario.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [obtenerDatos]);

  const torneos = useMemo(() => {
    const opciones = new Map();
    partidos.forEach((partido) => opciones.set(String(partido.idTorneo), partido.nombreTorneo));
    return [...opciones.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [partidos]);

  const partidosFiltrados = useMemo(() => partidos
    .filter((partido) => !filtroTorneo || String(partido.idTorneo) === filtroTorneo)
    .filter((partido) => !modoAsignacion || (
      partido.idEquipoLocal && partido.idEquipoVisitante
      && !partido.fechaCierre
      && !['Finalizado', 'Anulado', 'Pase libre'].includes(partido.estado)
    ))
    .sort((a, b) => {
      const fechaA = a.fechaHoraInicio || '9999-12-31T23:59:59';
      const fechaB = b.fechaHoraInicio || '9999-12-31T23:59:59';
      return fechaA.localeCompare(fechaB)
        || String(a.nombreTorneo).localeCompare(String(b.nombreTorneo))
        || Number(a.jornada) - Number(b.jornada)
        || Number(a.numeroPartido) - Number(b.numeroPartido);
    }), [partidos, filtroTorneo, modoAsignacion]);

  const partidosProgramados = partidosFiltrados.filter((partido) => partido.fechaHoraInicio && partido.fechaHoraFin).length;
  const partidosPendientesHorario = partidosFiltrados.length - partidosProgramados;
  const abrirProgramacion = (partido) => {
    setPartidoSeleccionado(partido);
    setFormularioProgramacion(crearFormularioProgramacion(partido));
    setErrorProgramacion('');
  };

  const reprogramarDesdeCalendario = (partido) => {
    setModoAsignacion(true);
    abrirProgramacion(partido);
  };

  const guardarProgramacion = async (event) => {
    event.preventDefault();
    if (!partidoSeleccionado || guardandoProgramacion) return;
    const fechaActualizada = obtenerFechaHoyLocal();
    const horaActualizada = obtenerHoraActualLocal();
    if (formularioProgramacion.fecha < fechaActualizada
      || (formularioProgramacion.fecha === fechaActualizada
        && formularioProgramacion.horaInicio <= horaActualizada)) {
      setErrorProgramacion('El partido debe comenzar en una fecha y hora futuras.');
      return;
    }
    setGuardandoProgramacion(true);
    setErrorProgramacion('');
    try {
      const response = await apiFetch(`/partidos/${partidoSeleccionado.idPartido}/programacion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formularioProgramacion),
      });
      await leerRespuesta(response, 'No se pudo programar el partido.');
      setPartidoSeleccionado(null);
      setFormularioProgramacion(null);
      await cargarDatos();
    } catch (guardadoError) {
      setErrorProgramacion(guardadoError.message || 'No se pudo programar el partido.');
    } finally {
      setGuardandoProgramacion(false);
    }
  };

  const guardarCancha = async (event) => {
    event.preventDefault();
    if (guardandoCancha) return;
    setGuardandoCancha(true);
    setErrorCancha('');
    setMensajeCancha('');
    try {
      const response = await apiFetch('/canchas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formularioCancha),
      });
      const nuevaCancha = await leerRespuesta(response, 'No se pudo guardar la cancha.');
      setCanchas((actuales) => [...actuales, nuevaCancha].sort((a, b) => a.nombreCancha.localeCompare(b.nombreCancha)));
      setFormularioCancha({ nombreCancha: '', ubicacion: '', descripcion: '' });
      setMostrarFormularioCancha(false);
      setMensajeCancha('Cancha agregada. Ya está disponible para programar partidos.');
    } catch (guardadoError) {
      setErrorCancha(guardadoError.message || 'No se pudo guardar la cancha.');
    } finally {
      setGuardandoCancha(false);
    }
  };

  const actualizarCampoProgramacion = (campo, valor) => {
    setFormularioProgramacion((actual) => ({ ...actual, [campo]: valor }));
  };

  const actualizarCampoCancha = (campo, valor) => {
    setFormularioCancha((actual) => ({ ...actual, [campo]: valor }));
  };

  const abrirAsignacionArbitros = (partido) => {
    setPartidoArbitros(partido);
    setIdsArbitrosSeleccionados(String(partido.idsArbitros || '').split(',').filter(Boolean));
    setErrorArbitros('');
  };

  const guardarAsignacionArbitros = async (event) => {
    event.preventDefault();
    if (!partidoArbitros || guardandoArbitros) return;
    setGuardandoArbitros(true);
    setErrorArbitros('');
    try {
      const response = await apiFetch(`/partidos/${partidoArbitros.idPartido}/arbitros`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idsArbitros: idsArbitrosSeleccionados.map(Number) }),
      });
      await leerRespuesta(response, 'No se pudieron guardar los árbitros.');
      setPartidoArbitros(null);
      await cargarDatos();
    } catch (guardadoError) {
      setErrorArbitros(guardadoError.message || 'No se pudieron guardar los árbitros.');
    } finally {
      setGuardandoArbitros(false);
    }
  };

  return (
    <div className={`mx-auto flex min-w-0 flex-col gap-4 ${modoAsignacion ? 'pb-8' : 'h-[calc(100dvh-88px)] min-h-0 overflow-hidden md:h-[calc(100dvh-92px)]'}`}>
      <header className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-lime-700">Gestión deportiva</p>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="mt-1 text-sm text-slate-500">
            {modoAsignacion
              ? 'Administrá los horarios, las canchas y los partidos pendientes.'
              : 'Consultá los encuentros programados y la agenda de cada día.'}
          </p>
        </div>
        {modoAsignacion ? (
          <button
            type="button"
            onClick={() => {
              setModoAsignacion(false);
              setMostrarFormularioCancha(false);
              setMensajeCancha('');
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Volver al calendario
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setModoAsignacion(true)}
            className="rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            style={{ minWidth: '148px', height: '42px', padding: '0 16px', lineHeight: '20px' }}
          >
            Asignar partidos
          </button>
        )}
      </header>

      {!modoAsignacion && (
        <CalendarioMensual
          partidos={partidosFiltrados}
          torneos={torneos}
          filtroTorneo={filtroTorneo}
          onFiltroTorneoChange={setFiltroTorneo}
          onAsignarPartidos={() => setModoAsignacion(true)}
          onEditarPartido={reprogramarDesdeCalendario}
        />
      )}

      {modoAsignacion && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMostrarFormularioCancha((mostrar) => !mostrar);
                setErrorCancha('');
                setMensajeCancha('');
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {mostrarFormularioCancha ? 'Cancelar cancha' : '+ Agregar cancha'}
            </button>
          </div>

      {mostrarFormularioCancha && (
        <form onSubmit={guardarCancha} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Nueva cancha</h2>
          <p className="mt-1 text-sm text-slate-500">La cancha quedará asociada a tu cuenta.</p>
          {errorCancha && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorCancha}</p>}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Nombre
              <input
                type="text"
                required
                maxLength={100}
                value={formularioCancha.nombreCancha}
                onChange={(event) => actualizarCampoCancha('nombreCancha', event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej.: Cancha principal"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Ubicación
              <input
                type="text"
                required
                maxLength={150}
                value={formularioCancha.ubicacion}
                onChange={(event) => actualizarCampoCancha('ubicacion', event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej.: Campus Rosario"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Descripción <span className="font-normal text-slate-400">(opcional)</span>
              <textarea
                maxLength={500}
                rows={2}
                value={formularioCancha.descripcion}
                onChange={(event) => actualizarCampoCancha('descripcion', event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Detalles útiles para identificarla"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={guardandoCancha}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {guardandoCancha ? 'Guardando…' : 'Guardar cancha'}
            </button>
          </div>
        </form>
      )}

      {mensajeCancha && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{mensajeCancha}</p>}

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Partidos programados</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{partidosProgramados}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Partidos pendientes de horario</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{partidosPendientesHorario}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Partidos</h2>
            <p className="mt-1 text-sm text-slate-500">Los horarios se validan contra el torneo, la cancha y los equipos.</p>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Torneo
            <select
              value={filtroTorneo}
              onChange={(event) => setFiltroTorneo(event.target.value)}
              className="mt-1 block min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos los torneos</option>
              {torneos.map((torneo) => <option key={torneo.id} value={torneo.id}>{torneo.nombre}</option>)}
            </select>
          </label>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={cargarDatos} className="font-semibold underline">Reintentar</button>
          </div>
        )}

        {cargando ? (
          <p className="py-10 text-center text-sm text-slate-500">Cargando partidos…</p>
        ) : partidosFiltrados.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-semibold text-slate-700">
              {modoAsignacion ? 'No quedan partidos por programar o asignar.' : 'Todavía no hay partidos para mostrar.'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {modoAsignacion
                ? 'Los partidos terminados y los que todavía esperan equipos quedan fuera de esta lista.'
                : 'Generá el fixture desde los detalles de un torneo para programar sus encuentros.'}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {partidosFiltrados.map((partido) => {
              const tieneDosEquipos = Boolean(partido.idEquipoLocal && partido.idEquipoVisitante);
              const programado = Boolean(partido.fechaHoraInicio && partido.fechaHoraFin);
              const nombreRonda = partido.nombreRonda || `Jornada ${partido.jornada}`;
              return (
                <article key={partido.idPartido} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>{partido.nombreTorneo}</span>
                      <span aria-hidden="true">·</span>
                      <span>{nombreRonda} · Partido {partido.numeroPartido || partido.idPartido}</span>
                      <span className={`rounded-full px-2 py-1 text-[11px] normal-case tracking-normal ${programado ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {programado ? 'Programado' : tieneDosEquipos ? 'Sin programar' : 'Esperando equipos'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-800">
                      <span>{partido.equipoLocal || 'Por definir'}</span>
                      <span className="text-slate-400">vs.</span>
                      <span>{partido.equipoVisitante || 'Por definir'}</span>
                    </div>
                    {programado ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold">{formatearFecha(partido.fechaHoraInicio)}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        {formatearHorario(partido)}
                        <span className="mx-2 text-slate-300">|</span>
                        {partido.nombreCancha} · {partido.ubicacionCancha}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        Período del torneo: {formatearFecha(partido.fechaInicioTorneo)}
                        {partido.fechaFinTorneo ? ` al ${formatearFecha(partido.fechaFinTorneo)}` : ' en adelante'}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Árbitros: {partido.nombresArbitros || 'Sin asignar'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:w-48">
                    <button
                      type="button"
                      onClick={() => abrirProgramacion(partido)}
                      disabled={!tieneDosEquipos}
                      className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {programado ? 'Cambiar programación' : 'Programar partido'}
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirAsignacionArbitros(partido)}
                      disabled={!tieneDosEquipos}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Asignar árbitros
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {partidoSeleccionado && formularioProgramacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar programación"
            onClick={() => !guardandoProgramacion && setPartidoSeleccionado(null)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            disabled={guardandoProgramacion}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="programar-partido-titulo"
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="programar-partido-titulo" className="text-xl font-bold text-slate-900">
              {partidoSeleccionado.fechaHoraInicio ? 'Cambiar programación' : 'Programar partido'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {partidoSeleccionado.nombreTorneo} · {partidoSeleccionado.equipoLocal} vs. {partidoSeleccionado.equipoVisitante}
            </p>
            {errorProgramacion && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorProgramacion}</p>}

            {canchas.length === 0 ? (
              <div className="mt-5 space-y-4">
                <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                  Necesitás agregar una cancha antes de guardar la programación.
                </p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setPartidoSeleccionado(null)}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPartidoSeleccionado(null);
                      setMostrarFormularioCancha(true);
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Agregar cancha
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={guardarProgramacion} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Cancha
                  <select
                    required
                    value={formularioProgramacion.idCancha}
                    onChange={(event) => actualizarCampoProgramacion('idCancha', event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccioná una cancha</option>
                    {canchas.map((cancha) => (
                      <option key={cancha.idCancha} value={cancha.idCancha}>
                        {cancha.nombreCancha} · {cancha.ubicacion}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Día
                  <input
                    type="date"
                    required
                    min={fechaMinimaProgramacion}
                    max={partidoSeleccionado.fechaFinTorneo || undefined}
                    value={formularioProgramacion.fecha}
                    onChange={(event) => actualizarCampoProgramacion('fecha', event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Debe estar entre {formatearFecha(partidoSeleccionado.fechaInicioTorneo)}
                    {partidoSeleccionado.fechaFinTorneo ? ` y ${formatearFecha(partidoSeleccionado.fechaFinTorneo)}` : ' y la fecha de cierre del torneo'}. No se admiten horarios pasados.
                  </span>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Desde
                    <input
                      type="time"
                      required
                      min={formularioProgramacion.fecha === fechaHoy ? horaActual : undefined}
                      value={formularioProgramacion.horaInicio}
                      onChange={(event) => actualizarCampoProgramacion('horaInicio', event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Hasta
                    <input
                      type="time"
                      required
                      value={formularioProgramacion.horaFin}
                      onChange={(event) => actualizarCampoProgramacion('horaFin', event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setPartidoSeleccionado(null)}
                    disabled={guardandoProgramacion}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoProgramacion || canchas.length === 0}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {guardandoProgramacion ? 'Guardando…' : 'Guardar horario'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {partidoArbitros && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar asignación de árbitros"
            onClick={() => !guardandoArbitros && setPartidoArbitros(null)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            disabled={guardandoArbitros}
          />
          <form onSubmit={guardarAsignacionArbitros} className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">Árbitros del partido</h2>
            <p className="mt-1 text-sm text-slate-500">
              {partidoArbitros.nombreTorneo} · {partidoArbitros.equipoLocal} vs. {partidoArbitros.equipoVisitante}
            </p>
            <p className="mt-4 text-xs text-slate-500">Solo aparecen árbitros activos habilitados para la disciplina. El primero seleccionado será el principal.</p>
            {errorArbitros && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorArbitros}</p>}
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {arbitros
                .filter((arbitro) => arbitro.estado === 'Activo' && Number(arbitro.idDisciplina) === Number(partidoArbitros.idDisciplina))
                .map((arbitro) => {
                  const id = String(arbitro.idArbitro || arbitro.id);
                  const seleccionado = idsArbitrosSeleccionados.includes(id);
                  return (
                    <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => setIdsArbitrosSeleccionados((actuales) => (
                          seleccionado ? actuales.filter((valor) => valor !== id) : [...actuales, id]
                        ))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-800">{arbitro.nombre} {arbitro.apellido}</span>
                        <span className="block text-xs text-slate-500">{arbitro.especialidad || arbitro.deporte}</span>
                      </span>
                      {seleccionado && idsArbitrosSeleccionados[0] === id && <span className="text-xs font-bold text-blue-700">Principal</span>}
                    </label>
                  );
                })}
              {arbitros.filter((arbitro) => arbitro.estado === 'Activo' && Number(arbitro.idDisciplina) === Number(partidoArbitros.idDisciplina)).length === 0 && (
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No hay árbitros activos para la disciplina de este torneo. El partido puede quedar sin árbitro.</p>
              )}
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPartidoArbitros(null)} disabled={guardandoArbitros} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>
              <button type="submit" disabled={guardandoArbitros} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {guardandoArbitros ? 'Guardando…' : 'Guardar asignación'}
              </button>
            </div>
          </form>
        </div>
      )}
        </>
      )}
    </div>
  );
}
