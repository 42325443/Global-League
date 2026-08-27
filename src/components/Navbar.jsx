// Ruta del componente: src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../icons';

// Arreglo para cargar vistas al navbar
const NAV_ITEMS = [
  { name: 'Inicio', href: '/inicio', icon: 'home' },
  { name: 'Torneos', href: '/torneos', icon: 'trophy' },
  { name: 'Equipos', href: '/equipos', icon: 'users' },
  { name: 'Estadísticas', href: '/estadisticas', icon: 'chart' },
  { name: 'Árbitros', href: '/arbitros', icon: 'referees' },
  { name: 'Calendario', href: '/calendario', icon: 'calendar' }
];

function NavIcon({ name, className = 'w-5 h-5' }) {
  const Icon = ICONS[name];
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

export function Navbar({ role = 'Administrador' }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const openButtonRef = useRef(null);
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      panelRef.current?.querySelector('a,button')?.focus();
    } else {
      openButtonRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const linkClasses = (isActive) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors select-none
     ${isActive ? 'bg-lime-500 text-white font-semibold' : 'text-slate-700 hover:bg-lime-500 hover:text-white'}`;

  return (
    <>
      {/* BARRA SUPERIOR - MOBILE */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow md:hidden">

        <div className="flex min-w-0 flex-1 items-center gap-3">

          <button
            ref={openButtonRef}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="p-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >

            <NavIcon name="menu" className="w-6 h-6 text-slate-700" />

          </button>

          <h2 className="truncate cursor-pointer font-montserrat text-xl font-extrabold">Global League</h2>

        </div>

        <div
          id="userRoleMobile"
          className="flex h-8 w-auto min-w-30 shrink-0 cursor-pointer select-none items-center justify-center rounded-4xl bg-green-400 px-3 text-xs hover:bg-green-600"
        >

          <span className="font-semibold text-white">{role}</span>

        </div>

      </header>

      <div className="h-14 md:hidden" aria-hidden="true" />

      {/* BARRA LATERAL - ESCRITORIO */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-55 md:flex-col md:items-center md:justify-between md:border-r md:border-slate-200 md:bg-white md:px-4 md:py-6 md:shadow-sm">
        
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

        <button className="mt-4 w-full text-red-600 border border-red-200 hover:bg-red-500 hover:text-white rounded-md py-2 font-semibold transition-colors">
          Cerrar sesión
        </button>

      </aside>

      {/* HEADER SUPERIOR - ESCRITORIO */}
      <header
        id="userHeader"
        className="fixed left-55 right-0 top-0 z-50 hidden h-14 items-center justify-end border-b border-slate-300 bg-white px-5 md:flex"
      >

        <div
          id="userRole"
          className="h-10 w-40 bg-green-400 text-sm rounded-4xl flex items-center justify-center select-none cursor-pointer hover:bg-green-600"
        >

          <span className="font-semibold text-white">{role}</span>

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

        </div>

      </div>

    </>
  );
}
