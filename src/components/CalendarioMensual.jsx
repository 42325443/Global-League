import { useMemo, useState } from 'react';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const claveFecha = (fecha) => {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

const formatoPartido = (partido) => partido.nombreRonda || `Jornada ${partido.jornada}`;

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
  const tituloDia = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${fechaSeleccionada}T12:00:00`));

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

  return (
    <div className="space-y-5 pb-8 md:pb-0">
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              aria-label="Mes anterior"
              className="flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              style={{ width: '40px', height: '40px', flex: '0 0 40px' }}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path d="m12.5 4.5-5 5.5 5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              aria-label="Mes siguiente"
              className="flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              style={{ width: '40px', height: '40px', flex: '0 0 40px' }}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path d="m7.5 4.5 5 5.5-5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={irAHoy}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hoy
            </button>
            <h2 className="ml-1 text-xl font-bold capitalize text-slate-900">{tituloMes}</h2>
          </div>

          <label className="text-sm font-semibold text-slate-700">
            Torneo
            <select
              value={filtroTorneo}
              onChange={(event) => onFiltroTorneoChange(event.target.value)}
              className="mt-1 block min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos los torneos</option>
              {torneos.map((torneo) => <option key={torneo.id} value={torneo.id}>{torneo.nombre}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 md:min-w-[760px]">
            <div
              className="grid bg-slate-50"
              style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            >
              {DIAS_SEMANA.map((dia) => (
                <div key={dia} className="min-w-0 border-b border-r border-slate-200 px-0.5 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 last:border-r-0 sm:px-2 sm:text-xs">
                  {dia}
                </div>
              ))}
            </div>
            <div
              className="grid"
              style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
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
                    className={`calendar-day-cell min-w-0 border-b border-r border-slate-200 p-0.5 last:border-r-0 sm:p-2 ${esMesVisible ? 'bg-white' : 'bg-slate-50/70'}`}
                  >
                    <button
                      type="button"
                      onClick={() => seleccionarDia(fecha)}
                      aria-label={`Ver ${fecha.toLocaleDateString('es-AR')}`}
                      aria-pressed={esSeleccionado}
                      className={`flex h-7 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold transition-colors sm:h-8 sm:min-w-8 sm:px-2 sm:text-sm ${
                        esSeleccionado ? 'bg-blue-600 text-white'
                          : esHoy ? 'bg-lime-100 text-lime-800'
                            : esMesVisible ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {fecha.getDate()}
                    </button>
                    {eventos.length > 0 && (
                      <div
                        className="mt-1 flex items-center gap-1 px-1 sm:hidden"
                        title={`${eventos.length} ${eventos.length === 1 ? 'partido programado' : 'partidos programados'}`}
                        aria-label={`${eventos.length} ${eventos.length === 1 ? 'partido programado' : 'partidos programados'}`}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-semibold leading-none text-blue-800">{eventos.length}</span>
                      </div>
                    )}
                    <div className="mt-1 hidden space-y-1 sm:block">
                      {eventos.slice(0, 2).map((partido) => (
                        <div
                          key={partido.idPartido}
                          title={`${partido.fechaHoraInicio.slice(11, 16)} · ${partido.equipoLocal || 'Por definir'} vs. ${partido.equipoVisitante || 'Por definir'} · ${partido.nombreTorneo}`}
                          className="min-w-0 truncate rounded-md border-l-2 border-blue-500 bg-blue-50 px-1.5 py-1 text-[10px] leading-tight text-blue-900 sm:text-[11px]"
                        >
                          <span className="font-bold">{partido.fechaHoraInicio.slice(11, 16)}</span>{' '}
                          {partido.equipoLocal || 'Por definir'} - {partido.equipoVisitante || 'Por definir'}
                        </div>
                      ))}
                      {eventos.length > 2 && (
                        <button
                          type="button"
                          onClick={() => seleccionarDia(fecha)}
                          className="px-1 text-[10px] font-semibold text-blue-700 hover:underline sm:text-[11px]"
                        >
                          +{eventos.length - 2} más
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Partidos programados</span>
          <button type="button" onClick={onAsignarPartidos} className="font-semibold text-blue-700 hover:underline">
            Ver partidos sin programar
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Agenda del día</p>
            <h3 className="mt-1 text-lg font-bold capitalize text-slate-900">{tituloDia}</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {partidosSeleccionados.length} {partidosSeleccionados.length === 1 ? 'partido' : 'partidos'}
          </span>
        </div>

        {partidosSeleccionados.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">No hay partidos programados para este día.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {partidosSeleccionados.map((partido) => (
              <article key={partido.idPartido} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {partido.fechaHoraInicio.slice(11, 16)}–{partido.fechaHoraFin?.slice(11, 16)} · {partido.nombreTorneo} · {formatoPartido(partido)}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {partido.equipoLocal || 'Por definir'} <span className="mx-1 text-slate-400">vs.</span> {partido.equipoVisitante || 'Por definir'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{partido.nombreCancha} · {partido.ubicacionCancha}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onEditarPartido(partido)}
                  className="self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:self-auto"
                >
                  Cambiar horario
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
