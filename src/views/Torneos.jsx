// src/views/Torneos.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { TorneoWizard } from '../components/TorneoWizard';

// Array inicial vacío listo para recibir torneos reales
const MOCK_TORNEOS = [];

export default function Torneos() {
  const [torneos, setTorneos] = useState(MOCK_TORNEOS);
  const [deporteFiltro, setDeporteFiltro] = useState('');
  const [disciplinaFiltro, setDisciplinaFiltro] = useState('');
  const [modalidadFiltro, setModalidadFiltro] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [pestanaDetalle, setPestanaDetalle] = useState('principal');
  const [isDetalleModalVisible, setIsDetalleModalVisible] = useState(false);

  // 1. Función extraída para poder recargar los torneos cuando queramos
  const cargarTorneos = () => {
    fetch('http://localhost:3000/api/torneos')
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

  const abrirModalDetalle = (torneo) => {
    setTorneoSeleccionado(torneo);
    setPestanaDetalle('principal');
    requestAnimationFrame(() => setIsDetalleModalVisible(true));
  };

  const cerrarModalDetalle = () => {
    setIsDetalleModalVisible(false);
    setTimeout(() => setTorneoSeleccionado(null), 200);
  };

  const eliminarTorneo = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este torneo?')) return;

    try {
      const res = await fetch(`http://localhost:3000/api/torneos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTorneos((prev) => prev.filter((t) => t.id !== id));
      } else {
        console.error('Error del servidor al eliminar el torneo');
      }
    } catch (error) {
      console.error('Error de red al eliminar el torneo:', error);
    }
  };

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
      'Finalizado': 'bg-red-50 text-red-700 ring-red-600/20'
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
    <div className="h-full bg-slate-50/50 font-montserrat text-slate-800">
      <div className="mx-auto max-w-7xl">
        {/* Header de Sección */}
        <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-bold text-lime-700">Gestión Deportiva</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Torneos</h1>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">
              Administra tus torneos, sedes y tablas de competición.
            </p>
          </div>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-all"
          >
            + Crear Torneo
          </button>
        </header>

        {/* Filtros */}
        <section className="mb-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Deporte
              </label>
              <select
                value={deporteFiltro}
                onChange={(e) => setDeporteFiltro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="">Todos los deportes</option>
                <option value="Fútbol">Fútbol</option>
                <option value="Basketball">Básquet</option>
                <option value="Volleyball">Vóley</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Disciplina
              </label>
              <input
                type="text"
                placeholder="Ej: Futsal, 3x3..."
                value={disciplinaFiltro}
                onChange={(e) => setDisciplinaFiltro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Modalidad
              </label>
              <select
                value={modalidadFiltro}
                onChange={(e) => setModalidadFiltro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="">Todas las modalidades</option>
                <option value="Liga">Liga</option>
                <option value="Eliminación Directa">Eliminatoria</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Desde Fecha
              </label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {(deporteFiltro || disciplinaFiltro || modalidadFiltro || fechaFiltro) && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={limpiarFiltros}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        {/* Tabla principal */}
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5">Nombre</th>
                  <th className="px-6 py-3.5">Deporte / Disciplina</th>
                  <th className="px-6 py-3.5">Ubicación / Sede</th>
                  <th className="px-6 py-3.5 text-center">Inscriptos</th>
                  <th className="px-6 py-3.5">Modalidad</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {torneosFiltrados.length > 0 ? (
                  torneosFiltrados.map((torneo) => (
                    <tr key={torneo.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-bold text-slate-900">{torneo.nombre}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">{torneo.deporte || 'Fútbol'}</div>
                        <div className="text-xs text-slate-400">{torneo.disciplina || 'Fútbol 11'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{torneo.ubicacion || 'Sin asignar'}</td>
                      <td className="px-6 py-4 text-center font-semibold">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono text-slate-800">
                          {torneo.equiposInscriptos ?? 0} / {torneo.cantidadEquiposMax ?? 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{torneo.modalidad || 'Liga'}</td>
                      <td className="px-6 py-4">{getEstadoBadge(torneo.estado)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => abrirModalDetalle(torneo)}
                            className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-md px-3 py-1.5 bg-white cursor-pointer"
                          >
                            Ver detalle
                          </button>
                          <button
                            onClick={() => eliminarTorneo(torneo.id)}
                            className="text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-md px-3 py-1.5 bg-white cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No hay torneos registrados. Haz clic en <strong className="text-blue-600 font-semibold">+ Crear Torneo</strong> para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Wizard (Crear Torneo) */}
        {isWizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsWizardOpen(false)} />
            <div className="relative w-full max-w-3xl z-10">
              <TorneoWizard
                onVolver={() => setIsWizardOpen(false)}
                onTorneoCreado={() => {
                  cargarTorneos(); // 3. Se dispara tras crear el torneo para refrescar todo
                  setIsWizardOpen(false);
                }}
              />
            </div>
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
                  {torneoSeleccionado.modalidad === 'Eliminatoria' ? 'Cuadro / Brackets' : 'Tabla de Posiciones'}
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
                    {torneoSeleccionado.modalidad === 'Eliminación Directa' || torneoSeleccionado.modalidad === 'Eliminatoria' ? (
                      /* BRACKETS */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {torneoSeleccionado.bracket && torneoSeleccionado.bracket.length > 0 ? (
                          torneoSeleccionado.bracket.map((b, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center text-sm">
                              <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">{b.ronda}</span>
                                <p className="font-medium text-slate-800">{b.partido}</p>
                              </div>
                              <span className="font-mono text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded">
                                {b.resultado}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 italic">No hay cuadro generado aún.</p>
                        )}
                      </div>
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