// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { ICONS } from '../icons';

const NAV_ITEMS = [
  { name: 'Inicio', slug: 'inicio', icon: 'home' },
  { name: 'Torneos', slug: 'torneos', icon: 'trophy' },
  { name: 'Equipos', slug: 'equipos', icon: 'users' },
  { name: 'Estadísticas', slug: 'estadisticas', icon: 'chart' },
  { name: 'Árbitros', slug: 'arbitros', icon: 'referees' },
  { name: 'Calendario', slug: 'calendario', icon: 'calendar' }
];

function NavIcon({ name, className = 'w-5 h-5' }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}

// Agregamos onNavigate y seccionActual a las propiedades que recibe la barra
export function Navbar({ user = 'User', role = 'Admin', onNavigate, seccionActual }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const openButtonRef = useRef(null);

  // Close on Escape and restore focus
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      panelRef.current?.querySelector('button')?.focus();
    } else {
      openButtonRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleMenuClick = (slug) => {
    if (onNavigate) {
      onNavigate(slug); // Le avisa a App.jsx qué pantalla renderizar
    }
    setOpen(false); // Cierra el menú mobile si estuviera abierto
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b border-slate-100 w-full fixed top-0 left-0 z-30">
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
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:justify-between md:w-64 md:h-screen md:py-6 md:px-4 md:border-r md:border-slate-200 md:shadow-sm bg-white sticky top-0 shrink-0">
        <div className="w-full">
          <h1 className="text-2xl font-black mb-6 px-3 cursor-default select-none">Global League</h1>

          <nav aria-label="Navegación principal">
            <ul className="space-y-1">
              {NAV_ITEMS.map(item => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => handleMenuClick(item.slug)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-left ${
                      seccionActual === item.slug 
                        ? 'bg-lime-500 text-white font-semibold' 
                        : 'text-slate-700 hover:bg-lime-500 hover:text-white'
                    }`}
                  >
                    <NavIcon name={item.icon} className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Footer de la barra lateral */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-3 bg-lime-300 p-3 rounded-xl shadow-sm w-full">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-lime-400">
              <NavIcon name="user" className="w-6 h-6 text-slate-500" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user}</div>
              <div className="text-xs text-slate-700 truncate">Rol: {role}</div>
            </div>
          </div>

          <button
            className="w-full text-red-600 border border-red-200 hover:bg-red-500 hover:text-white rounded-md py-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile slide-over */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />

        <div
          ref={panelRef}
          className={`absolute left-0 top-0 bottom-0 w-64 h-screen bg-white shadow-lg flex flex-col justify-between transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menú lateral"
        >
          <div>
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <h2 className="text-lg font-bold cursor-default select-none">Global League</h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="p-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-lime-400">
                <NavIcon name="close" className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <nav className="p-4">
              <ul className="space-y-1">
                {NAV_ITEMS.map(item => (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => handleMenuClick(item.slug)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-left ${
                        seccionActual === item.slug 
                          ? 'bg-lime-500 text-white font-semibold' 
                          : 'text-slate-700 hover:bg-lime-500 hover:text-white'
                      }`}
                    >
                      <NavIcon name={item.icon} className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100">
            <button
              className="w-full text-red-600 border border-red-200 hover:bg-red-500 hover:text-white rounded-md py-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
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
