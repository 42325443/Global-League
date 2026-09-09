// src/views/Torneos.jsx
import React, { useState, useMemo } from 'react';

// ==============================================================================
// DATOS DE PRUEBA
// Cuando se cree la API con Node y express, estos datos se deben reemplazar por la respuesta de la API
// ==============================================================================
const MOCK_TORNEOS = [
  {
    id: 1,
    nombre: 'Copa Apertura 2026',
    deporte: 'Fútbol',
    disciplina: 'Fútbol 11',
    fechaInicio: '2026-03-15',
    modalidad: 'Liga',
    estado: 'En Curso',
    posiciones: [
      { equipo: 'Deportivo Rosario', pj: 5, pg: 4, pe: 1, pp: 0, pts: 13 },
      { equipo: 'Atlético Central', pj: 5, pg: 3, pe: 1, pp: 1, pts: 10 },
      { equipo: 'Unión del Sur', pj: 5, pg: 2, pe: 0, pp: 3, pts: 6 }
    ],
    estadisticas: {
      goleadores: [
        { jugador: 'Mateo Rossi', equipo: 'Deportivo Rosario', goles: 7 },
        { jugador: 'Lucas Gómez', equipo: 'Atlético Central', goles: 5 }
      ],
      asistidores: [
        { jugador: 'Santiago Pérez', equipo: 'Deportivo Rosario', asistencias: 4 }
      ],
      vallasInvictas: [
        { arquero: 'Juan Martínez', equipo: 'Deportivo Rosario', arcosCero: 3 }
      ]
    }
  },
  {
    id: 2,
    nombre: 'Torneo Relámpago Futsal',
    deporte: 'Fútbol',
    disciplina: 'Futsal',
    fechaInicio: '2026-04-10',
    modalidad: 'Eliminatoria',
    estado: 'Próximo',
    bracket: [
      { ronda: 'Cuartos de Final', partido: 'Equipo A vs Equipo B', resultado: '3 - 1' },
      { ronda: 'Cuartos de Final', partido: 'Equipo C vs Equipo D', resultado: '2 - 4' }
    ],
    estadisticas: { goleadores: [], asistidores: [], vallasInvictas: [] }
  },
  {
    id: 3,
    nombre: 'Liga Local 3x3',
    deporte: 'Básquet',
    disciplina: '3x3',
    fechaInicio: '2026-02-01',
    modalidad: 'Liga',
    estado: 'Finalizado',
    posiciones: [
      { equipo: 'Titanes', pj: 10, pg: 8, pe: 0, pp: 2, pts: 24 }
    ],
    estadisticas: {
      goleadores: [{ jugador: 'Maxi Rodríguez', equipo: 'Titanes', puntos: 112 }],
      asistidores: [],
      vallasInvictas: []
    }
  }
];

export default function Torneos({ onNavegarACrearTorneo }) {
  // ==============================================================================
  // ESTADOS LOCALES Y MANEJO DE ANIMACIÓN DEL MODAL
  // ==============================================================================
  const [torneos, setTorneos] = useState(MOCK_TORNEOS);
  const [deporteFiltro, setDeporteFiltro] = useState('');
  const [disciplinaFiltro, setDisciplinaFiltro] = useState('');
  const [modalidadFiltro, setModalidadFiltro] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');

  // Control del Torneo Seleccionado
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [pestanaDetalle, setPestanaDetalle] = useState('posiciones');

  // ESTADO PARA ANIMACIÓN: Controla las clases css de Tailwind (opacity, scale, translate)
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Funciones para Abrir/Cerrar el Modal con transición suave
  const abrirModal = (torneo) => {
    setTorneoSeleccionado(torneo);
    setPestanaDetalle(torneo.modalidad === 'Eliminatoria' ? 'bracket' : 'posiciones');
    
    // Pequeno delay para que el componente se monte en el DOM antes de activar las clases de animacion de entrada
    requestAnimationFrame(() => {
      setIsModalVisible(true);
    });
  };

  const cerrarModal = () => {
    // 1. Dispara la animacion de salida cambiando el estado
    setIsModalVisible(false);
    
    // 2. Espera 200ms (coincidiendo con duration-200 de Tailwind) para desmontar el componente
    setTimeout(() => {
      setTorneoSeleccionado(null);
    }, 200);
  };

  // ==============================================================================
  // LÓGICA DE FILTRADO
  // ==============================================================================
  const torneosFiltrados = useMemo(() => {
    return torneos.filter((torneo) => {
      const coincideDeporte = deporteFiltro ? torneo.deporte.toLowerCase() === deporteFiltro.toLowerCase() : true;
      const coincideDisciplina = disciplinaFiltro ? torneo.disciplina.toLowerCase().includes(disciplinaFiltro.toLowerCase()) : true;
      const coincideModalidad = modalidadFiltro ? torneo.modalidad === modalidadFiltro : true;
      const coincideFecha = fechaFiltro ? torneo.fechaInicio >= fechaFiltro : true;

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
      'Finalizado': 'bg-red-100 text-red-600 ring-red-500/10'
    };
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[estado] || styles['Finalizado']}`}>
        {estado}
      </span>
    );
  };

  return (
    <div className="h-full bg-slate-50/50 font-montserrat text-slate-800">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER DE SECCIÓN */}
        <header className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-bold text-lime-700">Gestión Deportiva</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Torneos</h1>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">Visualiza todos tus torneos, elegí el deporte y la disciplina que más te guste.</p>
          </div>

          <button
            onClick={onNavegarACrearTorneo}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-800 active:scale-[0.98] shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Crear Torneo
          </button>
        </header>

        {/* FILTROS */}
        <section className="mb-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Deporte</label>
              <select
                value={deporteFiltro}
                onChange={(e) => setDeporteFiltro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 transition focus:border-slate-400 focus:bg-white focus:outline-none"
              >
                <option value="">Todos los deportes</option>
                <option value="Fútbol">Fútbol</option>
                <option value="Básquet">Básquet</option>
                <option value="Vóley">Vóley</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Disciplina</label>
              <input
                type="text"
                placeholder="Ej: Futsal, 3x3..."
                value={disciplinaFiltro}
                onChange={(e) => setDisciplinaFiltro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Modalidad</label>
              <select
                value={modalidadFiltro}
                onChange={(e) => setModalidadFiltro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 transition focus:border-slate-400 focus:bg-white focus:outline-none"
              >
                <option value="">Todas las modalidades</option>
                <option value="Liga">Liga</option>
                <option value="Eliminatoria">Eliminatoria</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Desde Fecha</label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 transition focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {(deporteFiltro || disciplinaFiltro || modalidadFiltro || fechaFiltro) && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={limpiarFiltros}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        {/* TABLA DE TORNEOS */}
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-200/80">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Nombre</th>
                  <th scope="col" className="px-6 py-3.5">Deporte / Disciplina</th>
                  <th scope="col" className="px-6 py-3.5">Inicio</th>
                  <th scope="col" className="px-6 py-3.5">Modalidad</th>
                  <th scope="col" className="px-6 py-3.5">Estado</th>
                  <th scope="col" className="px-6 py-3.5 text-start">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {torneosFiltrados.length > 0 ? (
                  torneosFiltrados.map((torneo) => (
                    <tr key={torneo.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-bold text-slate-900">{torneo.nombre}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900">{torneo.deporte}</div>
                        <div className="text-xs text-slate-400">{torneo.disciplina}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{torneo.fechaInicio}</td>
                      <td className="px-6 py-4 text-slate-500">{torneo.modalidad}</td>
                      <td className="px-6 py-4">{getEstadoBadge(torneo.estado)}</td>
                      <td className="px-6 py-4 text-right flex flex-col items-center">
                        <button
                          onClick={() => abrirModal(torneo)}
                          className="w-full inline-flex mb-2 items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-md px-3 py-1.5 transition-all bg-white shadow-xs"
                        >
                          Ver detalle
                        </button>
                        <button
                          className="w-full inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-red-900 border border-red-200 hover:border-red-300 rounded-md px-3 py-1.5 transition-all bg-red-400 shadow-xs"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      No se encontraron torneos que coincidan con los parámetros de búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==============================================================================
            VENTANA MODAL CON ANIMACIÓN (FADE, SCALE & TRANSLATE)
           ============================================================================== */}
        {torneoSeleccionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            
            {/* Fondo difuminado (Backdrop)
                Animación: Opacidad (opacity-0 -> opacity-100) */}
            <div 
              className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 ease-out ${
                isModalVisible ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={cerrarModal}
            />

            {/* Contenedor Principal de la Modal
                Animación: Opacidad, Escala y Desplazamiento en Y (scale-95 -> scale-100, translate-y-2 -> translate-y-0) */}
            <div 
              className={`relative w-full max-w-4xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl transition-all duration-200 ease-out z-10 max-h-[90vh] flex flex-col transform ${
                isModalVisible 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 translate-y-2'
              }`}
            >
              
              {/* Header de la ventana Modal */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Detalles del Torneo</span>
                    {getEstadoBadge(torneoSeleccionado.estado)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{torneoSeleccionado.nombre}</h2>
                  <p className="text-xs text-slate-500">{torneoSeleccionado.deporte} • {torneoSeleccionado.disciplina} • Modalidad: {torneoSeleccionado.modalidad}</p>
                </div>

                <button
                  onClick={cerrarModal}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Pestañas de Navegación */}
              <div className="flex gap-6 border-b border-slate-200 mt-4 text-sm font-medium shrink-0">
                {torneoSeleccionado.modalidad !== 'Eliminatoria' && (
                  <button
                    onClick={() => setPestanaDetalle('posiciones')}
                    className={`pb-3 transition-colors relative ${
                      pestanaDetalle === 'posiciones'
                        ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Tabla de Posiciones
                  </button>
                )}

                {torneoSeleccionado.modalidad !== 'Liga' && (
                  <button
                    onClick={() => setPestanaDetalle('bracket')}
                    className={`pb-3 transition-colors relative ${
                      pestanaDetalle === 'bracket'
                        ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Cuadro / Brackets
                  </button>
                )}

                <button
                  onClick={() => setPestanaDetalle('estadisticas')}
                  className={`pb-3 transition-colors relative ${
                    pestanaDetalle === 'estadisticas'
                      ? 'text-slate-900 font-semibold border-b-2 border-slate-900 -mb-px'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Líderes y Estadísticas
                </button>
              </div>

              {/* Contenido desplazable */}
              <div className="mt-4 overflow-y-auto pr-1 flex-1">
                
                {/* 1. POSICIONES */}
                {pestanaDetalle === 'posiciones' && torneoSeleccionado.posiciones && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="text-xs uppercase text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-3">Pos</th>
                          <th className="py-2.5 px-3">Equipo</th>
                          <th className="py-2.5 px-3 text-center">PJ</th>
                          <th className="py-2.5 px-3 text-center">PG</th>
                          <th className="py-2.5 px-3 text-center">PE</th>
                          <th className="py-2.5 px-3 text-center">PP</th>
                          <th className="py-2.5 px-3 text-right font-bold">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {torneoSeleccionado.posiciones.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono text-xs text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{p.equipo}</td>
                            <td className="py-2.5 px-3 text-center">{p.pj}</td>
                            <td className="py-2.5 px-3 text-center text-slate-500">{p.pg}</td>
                            <td className="py-2.5 px-3 text-center text-slate-500">{p.pe}</td>
                            <td className="py-2.5 px-3 text-center text-slate-500">{p.pp}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{p.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. BRACKETS */}
                {pestanaDetalle === 'bracket' && torneoSeleccionado.bracket && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {torneoSeleccionado.bracket.map((b, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center text-sm">
                        <div>
                          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{b.ronda}</span>
                          <span className="font-medium text-slate-800">{b.partido}</span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded text-slate-700">
                          {b.resultado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. ESTADÍSTICAS */}
                {pestanaDetalle === 'estadisticas' && torneoSeleccionado.estadisticas && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Top Goleadores */}
                    <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/30">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Top Goleadores</h3>
                      {torneoSeleccionado.estadisticas.goleadores?.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {torneoSeleccionado.estadisticas.goleadores.map((g, idx) => (
                            <li key={idx} className="flex justify-between items-center text-slate-700">
                              <span>
                                <strong className="font-medium text-slate-900">{g.jugador}</strong>
                                <span className="text-xs text-slate-400 block">{g.equipo}</span>
                              </span>
                              <span className="font-mono font-bold text-slate-900">{g.goles || g.puntos}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-slate-400 italic">Sin datos registrados.</p>}
                    </div>

                    {/* Asistidores */}
                    <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/30">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Asistencias</h3>
                      {torneoSeleccionado.estadisticas.asistidores?.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {torneoSeleccionado.estadisticas.asistidores.map((a, idx) => (
                            <li key={idx} className="flex justify-between items-center text-slate-700">
                              <span>
                                <strong className="font-medium text-slate-900">{a.jugador}</strong>
                                <span className="text-xs text-slate-400 block">{a.equipo}</span>
                              </span>
                              <span className="font-mono font-bold text-slate-900">{a.asistencias}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-slate-400 italic">Sin datos registrados.</p>}
                    </div>

                    {/* Arcos imbatidos */}
                    <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/30">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Arcos Imbatidos</h3>
                      {torneoSeleccionado.estadisticas.vallasInvictas?.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {torneoSeleccionado.estadisticas.vallasInvictas.map((v, idx) => (
                            <li key={idx} className="flex justify-between items-center text-slate-700">
                              <span>
                                <strong className="font-medium text-slate-900">{v.arquero}</strong>
                                <span className="text-xs text-slate-400 block">{v.equipo}</span>
                              </span>
                              <span className="font-mono font-bold text-slate-900">{v.arcosCero} PJ</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-slate-400 italic">Sin datos registrados.</p>}
                    </div>

                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  onClick={cerrarModal}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cerrar Ventana
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}