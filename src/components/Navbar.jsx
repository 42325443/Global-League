// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { ICONS } from '../icons';

const NAV_ITEMS = [
  { name: 'Inicio', href: '/inicio', icon: 'home' },
  { name: 'Torneos', href: '/torneos', icon: 'trophy' },
  { name: 'Equipos', href: '/equipos', icon: 'users' },
  { name: 'Estadísticas', href: '/estadisticas', icon: 'chart' },
  { name: 'Árbitros', href: '/arbitres', icon: 'referees' },
  { name: 'Calendario', href: '/calendario', icon: 'calendar' }
];

function NavIcon({ name, className = 'w-5 h-5' }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}

export function Navbar({ user = 'User', role = 'Admin' }) {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const panelRef = useRef(null);
  const openButtonRef = useRef(null);

  // Close on Escape and restore focus
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      // move focus to panel
      panelRef.current?.querySelector('a,button')?.focus();
    } else {
      openButtonRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow">
        <div className="flex items-center gap-3">
          <button
            ref={openButtonRef}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="p-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <NavIcon name="menu" className="w-6 h-6 text-slate-700" />
          </button>

          <h2 className="text-xl font-extrabold font-montserrat cursor-pointer">Global League</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:items-center md:justify-between md:w-55 md:h-screen md:py-6 md:px-4 md:border-r md:border-slate-200 md:shadow-sm bg-white">
        <div className="w-full">
          <h1 className="text-2xl font-black mb-6 cursor-default select-none">Global League</h1>

          <nav aria-label="Navegación principal" className="space-y-1">
            <ul>
              {NAV_ITEMS.map(item => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-lime-500 hover:text-white transition-colors"
                  >
                    <NavIcon name={item.icon} className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="w-full mt-6">
          <div className="w-45 h-15 flex items-center gap-3 absolute top-0 right-0 m-2 bg-lime-300 p-3 rounded-xl">
            <img src="" alt="Avatar" className="w-10 h-10 bg-white rounded-full object-cover" />
            <div>
              <div className="text-sm font-semibold">{user}</div>
              <div className="text-xs text-slate-500">Rol: {role}</div>
            </div>
          </div>

          <button
            className="mt-4 w-full text-red-600 border border-red-200 hover:bg-red-500 hover:text-white rounded-md py-2 font-semibold transition-colors"
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile slide-over */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!open}
      >
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />

        {/* panel */}
        <div
          ref={panelRef}
          className={`absolute left-0 top-0 bottom-0 w-64 h-screen bg-white shadow-lg transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menú lateral"
        >
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold cursor-default select-none">Global League</h2>
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="p-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-lime-400">
              <NavIcon name="close" className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          <nav className="px-2 py-3">
            <ul className="space-y-1">
              {NAV_ITEMS.map(item => (
                <li key={item.name} className='font-bold'>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-lime-500 hover:text-white transition-colors"
                  >
                    <NavIcon name={item.icon} className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 mt-auto">

            <button
              className="mt-4 m-0 w-55 text-red-600 border border-red-200 absolute bottom-5 hover:bg-red-500 hover:text-white rounded-md py-2 font-semibold transition-colors"
              type="button"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
