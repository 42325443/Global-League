// Ruta del componente: src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRightIcon, QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ICONS } from '../icons';

// Arreglo para cargar vistas al navbar
const NAV_ITEMS = [
  { name: 'Inicio', href: '/inicio', icon: 'home' },
  { name: 'Torneos', href: '/torneos', icon: 'trophy' },
  { name: 'Equipos', href: '/equipos', icon: 'users' },
  { name: 'Estadísticas', href: '/estadisticas', icon: 'chart' },
  { name: 'Árbitros', href: '/arbitros', icon: 'referees' },
  { name: 'Calendario', href: '/calendario', icon: 'calendar' },
  { name: 'Acta Digital', href: '/actas', icon: 'document' },
  { name: 'Tabla de Posiciones', href: '/posiciones', icon: 'table' }
];

function NavIcon({ name, className = 'w-5 h-5' }) {
  const Icon = ICONS[name];
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

export function Navbar({ role = 'Organizador', onLogout }) {
  const [open, setOpen] = useState(false);
  const [tutorialAbierto, setTutorialAbierto] = useState(false);
  const [confirmarCierreSesion, setConfirmarCierreSesion] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const panelRef = useRef(null);
  const openButtonRef = useRef(null);
  const cancelarCierreRef = useRef(null);
  const tutorialRef = useRef(null);

  const pasosTutorial = [
    {
      titulo: 'Prepará tus equipos',
      texto: 'Creá cada plantel, cargá sus jugadores y dejá identificado al capitán. Podés completar o corregir la lista más adelante.',
      ruta: '/equipos',
      accion: 'Ir a Equipos',
    },
    {
      titulo: 'Configurá el torneo',
      texto: 'Elegí deporte, disciplina, fechas, formato y equipos participantes. En ligas también definís el sistema de puntos y los criterios de desempate.',
      ruta: '/torneos',
      accion: 'Ir a Torneos',
    },
    {
      titulo: 'Revisá los encuentros',
      texto: 'El sistema genera el fixture o el bracket con los equipos inscriptos. Desde el detalle del torneo podés revisar cómo quedaron los cruces.',
      ruta: '/torneos',
      accion: 'Ver torneos',
    },
    {
      titulo: 'Programá la jornada',
      texto: 'En Calendario asigná fecha, horario, cancha y árbitros. Los encuentros deben quedar dentro del período del torneo y sin superposiciones.',
      ruta: '/calendario',
      accion: 'Ir al Calendario',
    },
    {
      titulo: 'Cargá y cerrá las actas',
      texto: 'Cuando el torneo esté en curso, elegí el partido y cargá el resultado, participantes e incidencias. Podés guardar un borrador o cerrar el acta.',
      ruta: '/actas',
      accion: 'Ir a Acta Digital',
    },
    {
      titulo: 'Consultá cómo avanza',
      texto: 'Al cerrar un acta se actualizan la tabla de posiciones o la siguiente ronda del bracket. Estadísticas reúne el rendimiento y las incidencias de tus torneos.',
      ruta: '/posiciones',
      accion: 'Ver posiciones',
    },
  ];

  const solicitarCierreSesion = () => {
    setOpen(false);
    setConfirmarCierreSesion(true);
  };

  const confirmarCierre = async () => {
    if (cerrandoSesion) return;
    setCerrandoSesion(true);
    try {
      await onLogout?.();
    } finally {
      setConfirmarCierreSesion(false);
      setCerrandoSesion(false);
    }
  };

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        setTutorialAbierto(false);
      }
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      panelRef.current?.querySelector('a,button')?.focus();
    } else {
      openButtonRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!confirmarCierreSesion) return undefined;

    cancelarCierreRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape' && !cerrandoSesion) setConfirmarCierreSesion(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmarCierreSesion, cerrandoSesion]);

  useEffect(() => {
    if (!tutorialAbierto) return undefined;
    tutorialRef.current?.focus();
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setTutorialAbierto(false);
    };
    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [tutorialAbierto]);

  const linkClasses = (isActive) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors select-none
     ${isActive ? 'bg-lime-500 text-white font-semibold' : 'text-slate-700 hover:bg-lime-500 hover:text-white'}`;

  return (
    <>
      {/* BARRA SUPERIOR - MOBILE */}
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur md:hidden">

        <div className="flex min-w-0 items-center gap-2">

          <button
            ref={openButtonRef}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >

            <NavIcon name="menu" className="h-5 w-5 text-slate-700" />

          </button>

          <h2 className="truncate text-base font-extrabold font-montserrat sm:text-lg">Global League</h2>

        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div
            id="userRoleMobile"
            className="flex h-8 max-w-32 items-center justify-center rounded-full bg-green-500 px-3 text-xs"
          >
            <span className="truncate font-semibold text-white">{role}</span>
          </div>
          <button
            type="button"
            onClick={() => setTutorialAbierto(true)}
            aria-label="Abrir tutorial de uso"
            title="Cómo usar Global League"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-lime-300 hover:bg-lime-50 hover:text-lime-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
        </div>

      </header>

      {/* BARRA LATERAL - ESCRITORIO */}
      <aside className="hidden md:flex md:flex-col md:items-center md:justify-between md:w-55 md:min-h-screen md:py-6 md:px-4 md:border-r md:border-slate-200 md:shadow-sm bg-white">
        
        <div className="w-full">

          <h1 className="text-2xl font-black mb-6 select-none">Global League</h1>

          <nav aria-label="Navegación principal">

            <ul>

              {/* Mapeamos el arreglo NAV_ITEMS para mostrar las diferentes opciones dentro del Nav */}
              {NAV_ITEMS.map(item => (

                <li key={item.name} className='my-1'>
                  
                  {/* La etiqueta Navlink nos ayuda con el enrutamiento que toma lugar en el archivo App.jsx */}
                  <NavLink
                    to={item.href}
                    className={({ isActive }) => linkClasses(isActive)}
                  >

                    <NavIcon name={item.icon} />

                    <span>{item.name}</span>

                  </NavLink>

                </li>

              ))}

            </ul>

          </nav>

        </div>

        <button
          type="button"
          onClick={solicitarCierreSesion}
          className="mt-4 w-full rounded-md border border-red-200 py-2 font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white"
        >
          Cerrar sesión
        </button>

      </aside>

      {/* HEADER SUPERIOR - ESCRITORIO */}
      <header
        id="userHeader"
        className="hidden md:flex md:fixed md:top-0 md:left-55 md:right-0 md:z-30 md:h-14 md:items-center md:justify-end md:border-b md:border-slate-300 md:px-5 bg-white"
      >

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTutorialAbierto(true)}
            aria-label="Abrir tutorial de uso"
            title="Cómo usar Global League"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-lime-300 hover:bg-lime-50 hover:text-lime-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
          <div
            id="userRole"
            className="flex h-10 w-40 cursor-default select-none items-center justify-center rounded-4xl bg-green-400 px-3 text-sm"
          >
            <span className="truncate font-semibold text-white">{role}</span>
          </div>
        </div>

      </header>

      {/* SLIDER - MOBILE */}
      <div className={`fixed inset-0 z-40 md:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

        <div ref={panelRef} className={`absolute left-0 top-0 bottom-0 w-64 h-screen bg-white shadow-lg transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          
          <div className="p-4 flex items-center justify-between">

            <h2 className="text-lg font-bold">Global League</h2>

            <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="p-2 rounded-md hover:bg-slate-100">

              <NavIcon name="close" />

            </button>

          </div>
          
          <nav className="px-2 py-3">

            <ul className="space-y-1">

              {NAV_ITEMS.map(item => (

                <li key={item.name}>

                  <NavLink
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => linkClasses(isActive)}
                  >

                    <NavIcon name={item.icon} />

                    <span>{item.name}</span>

                  </NavLink>

                </li>
                
              ))}

            </ul>

          </nav>

          <div className="absolute bottom-4 left-0 w-full px-4">
            <button
              type="button"
              onClick={solicitarCierreSesion}
              className="w-full rounded-md border border-red-200 py-2 font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white"
            >
              Cerrar sesión
            </button>
          </div>

        </div>

      </div>

      {confirmarCierreSesion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancelar cierre de sesión"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => !cerrandoSesion && setConfirmarCierreSesion(false)}
            disabled={cerrandoSesion}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-cierre-titulo"
            aria-describedby="confirmar-cierre-descripcion"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h2 id="confirmar-cierre-titulo" className="text-lg font-bold text-slate-900">
              ¿Querés cerrar sesión?
            </h2>
            <p id="confirmar-cierre-descripcion" className="mt-2 text-sm text-slate-600">
              Vas a salir de tu cuenta y volver a la pantalla de inicio de sesión.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelarCierreRef}
                type="button"
                onClick={() => setConfirmarCierreSesion(false)}
                disabled={cerrandoSesion}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Seguir conectado
              </button>
              <button
                type="button"
                onClick={confirmarCierre}
                disabled={cerrandoSesion}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
              </button>
            </div>
          </section>
        </div>
      )}

      {tutorialAbierto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5">
          <button
            type="button"
            aria-label="Cerrar tutorial"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setTutorialAbierto(false)}
          />
          <section
            ref={tutorialRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-titulo"
            tabIndex={-1}
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none"
          >
            <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-5 text-white sm:px-7">
              <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-20 h-48 w-48 rounded-full border border-white/10" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-lime-300">Guía rápida</span>
                  <h2 id="tutorial-titulo" className="mt-1 text-xl font-extrabold sm:text-2xl">Cómo organizar un torneo</h2>
                  <p className="mt-1 max-w-xl text-sm leading-5 text-slate-300">Seguí este recorrido para pasar de los planteles al cierre de los partidos.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTutorialAbierto(false)}
                  aria-label="Cerrar tutorial"
                  className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <ol className="grid gap-3 sm:grid-cols-2">
                {pasosTutorial.map((paso, index) => (
                  <li key={paso.titulo} className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-sm font-black text-lime-800">{index + 1}</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-900">{paso.titulo}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{paso.texto}</p>
                      <NavLink
                        to={paso.ruta}
                        onClick={() => setTutorialAbierto(false)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
                      >
                        {paso.accion}<ArrowRightIcon className="h-3.5 w-3.5" />
                      </NavLink>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
                Consejo: cerrá cada acta cuando el resultado esté confirmado; esa acción actualiza automáticamente la clasificación o el bracket.
              </p>
            </div>

            <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <button type="button" onClick={() => setTutorialAbierto(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">Entendido</button>
            </footer>
          </section>
        </div>
      )}

    </>
  );
}
