import { useMemo, useState } from 'react';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const claveFecha = (fecha) => {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

const formatoPartido = (partido) => partido.nombreRonda || `Jornada ${partido.jornada}`;

const formatearFechaAgenda = (partido) => {
  const inicio = String(partido.fechaHoraInicio || '').slice(11, 16);
  const fin = String(partido.fechaHoraFin || '').slice(11, 16);
  return `${inicio}${fin ? `–${fin}` : ''}`;
};

export default function CalendarioMensual({
  partidos,
  torneos,
  filtroTorneo,
  onFiltroTorneoChange,
  onAsignarPartidos,
  onEditarPartido,
}) {
  const [mesVisible, setMesVisible] = useState(() => {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), 1, 12);
  });
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => claveFecha(new Date()));
  const [agendaAbierta, setAgendaAbierta] = useState(false);
  const hoy = claveFecha(new Date());

  const dias = useMemo(() => {
    const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1, 12);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, indice) => (
      new Date(mesVisible.getFullYear(), mesVisible.getMonth(), indice - desplazamiento + 1, 12)
    ));
  }, [mesVisible]);

  const partidosPorFecha = useMemo(() => {
    const agrupados = new Map();
    partidos.forEach((partido) => {
      if (!partido.fechaHoraInicio) return;
      const fecha = String(partido.fechaHoraInicio).slice(0, 10);
      if (!agrupados.has(fecha)) agrupados.set(fecha, []);
      agrupados.get(fecha).push(partido);
    });
    agrupados.forEach((partidosDelDia) => partidosDelDia.sort((a, b) => (
      String(a.fechaHoraInicio).localeCompare(String(b.fechaHoraInicio))
    )));
    return agrupados;
  }, [partidos]);

  const partidosSeleccionados = partidosPorFecha.get(fechaSeleccionada) || [];
  const tituloMes = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(mesVisible);
  const fechaSeleccionadaDate = new Date(`${fechaSeleccionada}T12:00:00`);
  const tituloDia = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fechaSeleccionadaDate);
  const tituloDiaCorto = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(fechaSeleccionadaDate);

  const cambiarMes = (cantidad) => {
    const nuevoMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + cantidad, 1, 12);
    setMesVisible(nuevoMes);
    setFechaSeleccionada(claveFecha(nuevoMes));
  };

  const irAHoy = () => {
    const ahora = new Date();
    setMesVisible(new Date(ahora.getFullYear(), ahora.getMonth(), 1, 12));
    setFechaSeleccionada(claveFecha(ahora));
  };

  const seleccionarDia = (fecha) => {
    if (fecha.getMonth() !== mesVisible.getMonth()) {
      setMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1, 12));
    }
    setFechaSeleccionada(claveFecha(fecha));
  };

  const renderPartidosAgenda = () => {
    if (partidosSeleccionados.length === 0) {
      return (
        <div className="flex min-h-32 flex-1 flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-2xl" aria-hidden="true">🗓️</span>
          <p className="mt-2 text-sm font-semibold text-slate-700">Día libre de partidos</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Elegí otra fecha para consultar su agenda.</p>
        </div>
      );
    }

    return (
      <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
        {partidosSeleccionados.map((partido) => (
          <article key={partido.idPartido} className="py-3 first:pt-3 last:pb-1">
            <p className="text-[11px] font-semibold text-blue-700">
              {formatearFechaAgenda(partido)} <span className="mx-1 text-slate-300">·</span> {partido.nombreTorneo} <span className="mx-1 text-slate-300">·</span> {formatoPartido(partido)}
            </p>
            <p className="mt-1.5 text-sm font-bold leading-5 text-slate-900">
              {partido.equipoLocal || 'Por definir'} <span className="mx-1 font-medium text-slate-400">vs.</span> {partido.equipoVisitante || 'Por definir'}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {partido.nombreCancha || 'Cancha por confirmar'}{partido.ubicacionCancha ? ` · ${partido.ubicacionCancha}` : ''}
            </p>
            <button
              type="button"
              onClick={() => {
                setAgendaAbierta(false);
                onEditarPartido(partido);
              }}
              className="mt-2 text-xs font-semibold text-blue-700 hover:underline"
            >
              Cambiar horario
            </button>
          </article>
        ))}
      </div>
    );
  };

  return (
    <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 lg:h-full lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)] lg:grid-rows-1 lg:gap-4">
      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              aria-label="Mes anterior"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 sm:h-10 sm:w-10"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path d="m12.5 4.5-5 5.5 5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              aria-label="Mes siguiente"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 sm:h-10 sm:w-10"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path d="m7.5 4.5 5 5.5-5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={irAHoy}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hoy
            </button>
            <h2 className="ml-1 text-lg font-bold capitalize text-slate-900 sm:text-xl">{tituloMes}</h2>
          </div>

          <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-600 sm:text-sm">
            <span className="sm:hidden">Torneo</span>
            <span className="hidden sm:inline">Filtrar torneo</span>
            <select
              value={filtroTorneo}
              onChange={(event) => onFiltroTorneoChange(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:min-w-44 sm:flex-none"
            >
              <option value="">Todos los torneos</option>
              {torneos.map((torneo) => <option key={torneo.id} value={torneo.id}>{torneo.nombre}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200">
          <div className="grid shrink-0 bg-slate-50" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="min-w-0 border-b border-r border-slate-200 py-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-500 last:border-r-0 sm:py-2.5 sm:text-[10px]">
                {dia}
              </div>
            ))}
          </div>
          <div
            className="grid min-h-0 flex-1"
            style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
          >
            {dias.map((fecha) => {
              const fechaKey = claveFecha(fecha);
              const esMesVisible = fecha.getMonth() === mesVisible.getMonth();
              const esHoy = fechaKey === hoy;
              const esSeleccionado = fechaKey === fechaSeleccionada;
              const eventos = partidosPorFecha.get(fechaKey) || [];
              return (
                <div
                  key={fechaKey}
                  className={`calendar-day-cell min-w-0 overflow-hidden border-b border-r border-slate-200 p-0.5 last:border-r-0 sm:p-1 ${esMesVisible ? 'bg-white' : 'bg-slate-50/70'}`}
                >
                  <button
                    type="button"
                    onClick={() => seleccionarDia(fecha)}
                    aria-label={`Ver ${fecha.toLocaleDateString('es-AR')}${eventos.length ? `, ${eventos.length} partidos` : ''}`}
                    aria-pressed={esSeleccionado}
                    className={`mx-auto flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[10px] font-semibold transition-colors sm:h-7 sm:min-w-7 sm:text-xs ${
                      esSeleccionado ? 'bg-blue-600 text-white'
                        : esHoy ? 'bg-lime-100 text-lime-800'
                          : esMesVisible ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {fecha.getDate()}
                  </button>
                  {eventos.length > 0 && (
                    <div
                      className="mt-0.5 flex items-center justify-center gap-1 px-0.5 lg:hidden"
                      title={`${eventos.length} ${eventos.length === 1 ? 'partido programado' : 'partidos programados'}`}
                      aria-hidden="true"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span className="text-[9px] font-semibold leading-none text-blue-800">{eventos.length}</span>
                    </div>
                  )}
                  <div className="mt-0.5 hidden space-y-0.5 lg:block">
                    {eventos.slice(0, 1).map((partido) => (
                      <div
                        key={partido.idPartido}
                        title={`${partido.fechaHoraInicio.slice(11, 16)} · ${partido.equipoLocal || 'Por definir'} vs. ${partido.equipoVisitante || 'Por definir'} · ${partido.nombreTorneo}`}
                        className="min-w-0 truncate rounded border-l-2 border-blue-500 bg-blue-50 px-1 py-0.5 text-[9px] leading-tight text-blue-900"
                      >
                        <span className="font-bold">{partido.fechaHoraInicio.slice(11, 16)}</span>{' '}
                        {partido.equipoLocal || 'Por definir'} - {partido.equipoVisitante || 'Por definir'}
                      </div>
                    ))}
                    {eventos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => seleccionarDia(fecha)}
                        className="px-1 text-[9px] font-semibold leading-tight text-blue-700 hover:underline"
                      >
                        +{eventos.length - 1} más
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex shrink-0 items-center justify-between gap-2 text-[10px] text-slate-500 sm:text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-blue-500" /> Partidos programados</span>
          <button type="button" onClick={onAsignarPartidos} className="font-semibold text-blue-700 hover:underline">
            Ver partidos sin programar
          </button>
        </div>
      </section>

      <section className="hidden min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Agenda del día</p>
            <h3 className="mt-1 truncate text-base font-bold capitalize text-slate-900">{tituloDia}</h3>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {partidosSeleccionados.length}
          </span>
        </div>
        {renderPartidosAgenda()}
      </section>

      <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm lg:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Agenda del día</p>
          <p className="truncate text-xs font-semibold capitalize text-slate-800">{tituloDiaCorto} · {partidosSeleccionados.length} {partidosSeleccionados.length === 1 ? 'partido' : 'partidos'}</p>
        </div>
        <button
          type="button"
          onClick={() => setAgendaAbierta(true)}
          className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
        >
          Ver agenda
        </button>
      </div>

      {agendaAbierta && (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/40 p-2 backdrop-blur-sm sm:items-center sm:p-4 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar agenda del día"
            onClick={() => setAgendaAbierta(false)}
            className="absolute inset-0 h-full w-full cursor-default"
          />
          <section role="dialog" aria-modal="true" aria-labelledby="agenda-movil-titulo" className="relative z-10 flex max-h-[82dvh] w-full flex-col rounded-2xl bg-white p-4 shadow-2xl sm:mx-auto sm:max-w-lg">
            <div className="mb-2 flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Agenda del día</p>
                <h3 id="agenda-movil-titulo" className="mt-1 text-base font-bold capitalize text-slate-900">{tituloDia}</h3>
              </div>
              <button type="button" onClick={() => setAgendaAbierta(false)} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cerrar</button>
            </div>
            {renderPartidosAgenda()}
          </section>
        </div>
      )}
    </div>
  );
}
