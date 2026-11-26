import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PlusIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/useAuth';
import { apiFetch } from '../lib/api';

const FUENTES = [
  { clave: 'torneos', ruta: '/torneos', mensaje: 'No se pudieron cargar los torneos.' },
  { clave: 'equipos', ruta: '/equipos', mensaje: 'No se pudieron cargar los equipos.' },
  { clave: 'partidos', ruta: '/calendario', mensaje: 'No se pudieron cargar los partidos.' },
];

const obtenerLista = async ({ ruta, mensaje }) => {
  const respuesta = await apiFetch(ruta);
  const datos = await respuesta.json().catch(() => []);
  if (!respuesta.ok) throw new Error(datos.error || mensaje);
  if (!Array.isArray(datos)) throw new Error(mensaje);
  return datos;
};

const formatearFecha = (valor, opciones = { day: 'numeric', month: 'short' }) => {
  if (!valor) return 'Fecha pendiente';
  const fecha = new Date(`${String(valor).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return 'Fecha pendiente';
  return new Intl.DateTimeFormat('es-AR', opciones).format(fecha);
};

const formatearDiaPartido = (valor) => {
  if (!valor) return { dia: '—', mes: '' };
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return { dia: '—', mes: '' };
  return {
    dia: new Intl.DateTimeFormat('es-AR', { day: '2-digit' }).format(fecha),
    mes: new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(fecha).replace('.', ''),
  };
};

const formatearHora = (valor) => String(valor || '').slice(11, 16);

const obtenerSaludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buen día';
  if (hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

const estadoTorneo = (torneo) => torneo.estado || 'Próximo';

const clasesEstado = (estado) => {
  const normalizado = String(estado).toLocaleLowerCase('es-AR');
  if (normalizado.includes('curso')) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/10';
  if (normalizado.includes('final')) return 'bg-slate-100 text-slate-600 ring-slate-500/10';
  if (normalizado.includes('cancel') || normalizado.includes('suspend')) return 'bg-red-50 text-red-700 ring-red-600/10';
  return 'bg-amber-50 text-amber-700 ring-amber-600/10';
};

function TarjetaIndicador({ titulo, valor, detalle, icono: Icono, tono, cargando }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-3 lg:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">{titulo}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:mt-1 sm:text-2xl">
            {cargando ? <span className="inline-block h-8 w-10 animate-pulse rounded-lg bg-slate-100 sm:h-8 sm:w-10" /> : valor}
          </p>
          <p className="mt-1 hidden text-xs text-slate-400 sm:block">{cargando ? 'Cargando resumen…' : detalle}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${tono}`}>
          <Icono className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

export default function Inicio() {
  const { user } = useAuth();
  const [datos, setDatos] = useState({ torneos: [], equipos: [], partidos: [] });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    const actualizarHora = () => setAhora(Date.now());
    actualizarHora();
    const intervalo = window.setInterval(actualizarHora, 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    let activo = true;

    const cargarResumen = async () => {
      setCargando(true);
      const resultados = await Promise.allSettled(FUENTES.map(obtenerLista));
      if (!activo) return;

      const nuevosDatos = {};
      const nuevosErrores = {};
      resultados.forEach((resultado, indice) => {
        const { clave, mensaje } = FUENTES[indice];
        if (resultado.status === 'fulfilled') {
          nuevosDatos[clave] = resultado.value;
        } else {
          nuevosDatos[clave] = [];
          nuevosErrores[clave] = resultado.reason?.message || mensaje;
        }
      });

      setDatos(nuevosDatos);
      setErrores(nuevosErrores);
      setCargando(false);
    };

    cargarResumen();
    return () => {
      activo = false;
    };
  }, [intento]);

  const partidosFuturos = useMemo(() => datos.partidos
    .filter((partido) => (
      partido.fechaHoraInicio
      && partido.fechaHoraFin
      && new Date(String(partido.fechaHoraInicio).replace(' ', 'T')).getTime() >= ahora
    ))
    .sort((a, b) => String(a.fechaHoraInicio).localeCompare(String(b.fechaHoraInicio))), [datos.partidos, ahora]);
  const proximosPartidos = partidosFuturos.slice(0, 2);

  const torneosDestacados = useMemo(() => [...datos.torneos]
    .sort((a, b) => {
      const estadoA = estadoTorneo(a).toLocaleLowerCase('es-AR');
      const estadoB = estadoTorneo(b).toLocaleLowerCase('es-AR');
      const prioridad = (estado) => (estado.includes('curso') ? 0 : estado.includes('próximo') ? 1 : 2);
      return prioridad(estadoA) - prioridad(estadoB)
        || String(a.fechaInicio || '').localeCompare(String(b.fechaInicio || ''));
    })
    .slice(0, 3), [datos.torneos]);

  const torneosEnCurso = datos.torneos.filter((torneo) => (
    estadoTorneo(torneo).toLocaleLowerCase('es-AR').includes('curso')
  )).length;
  const partidosSinProgramar = datos.partidos.filter((partido) => (
    !partido.fechaHoraInicio
    && partido.idEquipoLocal
    && partido.idEquipoVisitante
  )).length;
  const saludo = obtenerSaludo();
  const primerNombre = user?.nombre?.trim().split(/\s+/)[0];
  const hayErrores = Object.keys(errores).length > 0;

  return (
    <div className="mx-auto flex h-[calc(100dvh-88px)] min-h-0 w-full max-w-[1500px] flex-col gap-2.5 overflow-hidden sm:gap-3 md:h-[calc(100dvh-92px)] md:gap-4">
      <header className="flex shrink-0 items-center justify-between gap-2 sm:items-end sm:gap-4">
        <div>
          <p className="text-[10px] font-bold text-lime-700 sm:text-sm">Centro de organización</p>
          <h1 className="mt-0.5 font-montserrat text-lg font-extrabold tracking-tight text-slate-950 sm:mt-1 sm:text-2xl">
            {saludo}{primerNombre ? `, ${primerNombre}` : ''}
          </h1>
          <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-slate-500 sm:block">
            Este es el estado de tus torneos, equipos y próximos encuentros.
          </p>
        </div>
        <Link
          to="/torneos"
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
        >
          <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          <span className="sm:hidden">Nuevo</span>
          <span className="hidden sm:inline">Crear torneo</span>
        </Link>
      </header>

      <section className="relative isolate shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-3.5 text-white shadow-lg shadow-slate-900/10 sm:rounded-3xl sm:px-7 sm:py-6">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/20 bg-lime-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-lime-200 sm:gap-2 sm:px-3 sm:text-[11px] sm:tracking-[0.16em]">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            Global League · Tu temporada
          </span>
          <h2 className="mt-2 font-montserrat text-lg font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-2xl lg:text-3xl">
            <span className="sm:hidden">Tu temporada, en orden.</span>
            <span className="hidden sm:inline">Cada torneo, más fácil de organizar.</span>
          </h2>
          <p className="mt-2 hidden max-w-xl text-sm leading-6 text-slate-300 sm:block lg:text-base">
            Revisá lo que viene, completá la programación y mantené toda la actividad deportiva en un mismo lugar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-3">
            <Link to="/calendario" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-lime-300 sm:min-h-10 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
              Ir al calendario
              <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </Link>
            <Link to="/equipos" className="inline-flex min-h-8 items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 sm:min-h-10 sm:px-4 sm:py-2 sm:text-sm">
              Administrar equipos
            </Link>
          </div>
        </div>
      </section>

      {hayErrores && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="font-semibold">Algunos datos no pudieron cargarse.</p>
              <p className="mt-0.5 text-amber-800">{Object.values(errores).join(' ')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIntento((actual) => actual + 1)}
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      <section aria-label="Resumen de actividad" className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <TarjetaIndicador
          titulo="Torneos en curso"
          valor={errores.torneos ? '—' : torneosEnCurso}
          detalle={errores.torneos ? 'Dato no disponible' : `de ${datos.torneos.length} torneos creados`}
          icono={TrophyIcon}
          tono="bg-lime-50 text-lime-700"
          cargando={cargando}
        />
        <TarjetaIndicador
          titulo="Equipos registrados"
          valor={errores.equipos ? '—' : datos.equipos.length}
          detalle={errores.equipos ? 'Dato no disponible' : 'en tu espacio deportivo'}
          icono={UsersIcon}
          tono="bg-blue-50 text-blue-700"
          cargando={cargando}
        />
        <TarjetaIndicador
          titulo="Próximos partidos"
          valor={errores.partidos ? '—' : partidosFuturos.length}
          detalle={errores.partidos ? 'Dato no disponible' : 'con fecha y horario asignados'}
          icono={CalendarDaysIcon}
          tono="bg-violet-50 text-violet-700"
          cargando={cargando}
        />
        <TarjetaIndicador
          titulo="Por programar"
          valor={errores.partidos ? '—' : partidosSinProgramar}
          detalle={errores.partidos ? 'Dato no disponible' : 'encuentros con equipos definidos'}
          icono={ClockIcon}
          tono="bg-amber-50 text-amber-700"
          cargando={cargando}
        />
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1.15fr_0.85fr] gap-3 md:grid-cols-2 md:grid-rows-1 md:gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
        <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
            <div>
              <h2 className="font-montserrat text-base font-bold text-slate-950 sm:text-lg">Próximos partidos</h2>
              <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">Lo que sigue en tu calendario.</p>
            </div>
            <Link to="/calendario" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 sm:text-sm">
              <span className="hidden sm:inline">Ver calendario</span>
              <span className="sm:hidden">Ver</span>
              <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </Link>
          </div>

          {cargando ? (
            <div className="min-h-0 flex-1 space-y-2 overflow-hidden pt-3" aria-label="Cargando próximos partidos">
              {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : proximosPartidos.length > 0 ? (
            <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
              {proximosPartidos.map((partido) => {
                const fecha = formatearDiaPartido(partido.fechaHoraInicio);
                return (
                  <div key={partido.idPartido} className="flex items-start gap-2.5 py-1.5 first:pt-2 last:pb-1 sm:gap-4 sm:py-2.5">
                    <div className="flex h-10 w-10 shrink-0 self-start flex-col items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-200 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14">
                      <span className="text-sm font-extrabold leading-4 sm:text-base">{fecha.dia}</span>
                      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500 sm:text-[9px]">{fecha.mes}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-1 gap-y-0 text-[9px] font-semibold text-slate-500 sm:gap-x-2 sm:gap-y-0.5 sm:text-[11px] lg:text-xs">
                        <span className="truncate">{partido.nombreTorneo || 'Torneo'}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>{formatearHora(partido.fechaHoraInicio)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-bold leading-4 text-slate-900 sm:mt-1 sm:text-xs lg:text-sm">
                        {partido.equipoLocal || 'Por definir'} <span className="font-medium text-slate-400">vs.</span> {partido.equipoVisitante || 'Por definir'}
                      </p>
                      <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-[9px] text-slate-500 sm:text-[10px] lg:text-xs">
                        <MapPinIcon className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                        {partido.nombreCancha || partido.ubicacionCancha || 'Sede por confirmar'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-3 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12 sm:rounded-2xl">
                <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-800 sm:mt-3">Todavía no hay próximos partidos.</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 sm:text-sm">
                Generá el fixture de un torneo y asignale fecha y horario para verlo en esta agenda.
              </p>
              <Link to="/calendario" className="mt-2 text-xs font-bold text-blue-700 hover:underline sm:mt-4 sm:text-sm">Abrir calendario</Link>
            </div>
          )}
        </article>

        <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:p-5">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-montserrat text-lg font-bold text-slate-950">Tus torneos</h2>
              <p className="mt-1 text-sm text-slate-500">Un vistazo a tus competencias.</p>
            </div>
            <Link to="/torneos" aria-label="Ver todos los torneos" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
              <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>

          {cargando ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-hidden pt-4" aria-label="Cargando torneos">
              {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : torneosDestacados.length > 0 ? (
            <div className={`min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto ${torneosDestacados.length === 1 ? 'flex flex-col justify-center' : ''}`}>
              {torneosDestacados.map((torneo) => (
                <Link key={torneo.id || torneo.idTorneo} to="/torneos" className="block py-4 first:pt-4 last:pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{torneo.nombre || torneo.nombreTorneo}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{torneo.deporte} · {torneo.disciplina}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${clasesEstado(estadoTorneo(torneo))}`}>
                      {estadoTorneo(torneo)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{formatearFecha(torneo.fechaInicio, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>{torneo.equiposInscriptos || 0} equipos{torneo.cantidadEquiposMax ? ` / ${torneo.cantidadEquiposMax}` : ''}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 py-3 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-50 text-lime-700">
                <TrophyIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-3 font-semibold text-slate-800">Tu primer torneo empieza acá.</p>
              <p className="mt-1 text-sm text-slate-500">Creá una competencia y organizá todo desde un mismo lugar.</p>
              <Link to="/torneos" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-lime-700 hover:underline">
                Ir a torneos <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </article>
      </section>

    </div>
  );
}
