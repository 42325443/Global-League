// src/components/TorneoWizard.jsx
import React, { useState, useEffect } from 'react';

export const TorneoWizard = ({ onVolver, onTorneoCreado }) => {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Catálogos desde el backend
  const [deportes, setDeportes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [formatos, setFormatos] = useState([]);

  // Estado para la gestión de equipos
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [nuevoEquipoNombre, setNuevoEquipoNombre] = useState('');
  const [mostrandoCrearEquipo, setMostrandoCrearEquipo] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombreTorneo: '',
    descripcionTorneo: '',
    idDeporte: '',
    idDisciplina: '',
    idFormato: '',
    fechaInicio: '',
    fechaFin: '',
    ubicacion: 'Campus Rosario',
    cantidadEquiposMax: 12
  });

  useEffect(() => {
    fetch('http://localhost:3000/api/catalogos/deportes')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (data && data.length > 0) setDeportes(data);
        else throw new Error();
      })
      .catch(() => {
        setDeportes([
          { id_deporte: 1, nombre: 'Fútbol' },
          { id_deporte: 2, nombre: 'Básquet' },
          { id_deporte: 3, nombre: 'Vóley' }
        ]);
      });
  }, []);

  useEffect(() => {
    if (formData.idDeporte) {
      const idDep = Number(formData.idDeporte);

      fetch(`http://localhost:3000/api/catalogos/disciplinas?idDeporte=${idDep}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const filtradas = data.filter(
            (disc) => Number(disc.id_deporte || disc.idDeporte) === idDep
          );
          if (filtradas.length > 0) {
            setDisciplinas(filtradas);
          } else {
            throw new Error();
          }
        })
        .catch(() => {
          if (idDep === 1) {
            setDisciplinas([
              { id_disciplina: 1, nombre: 'Fútbol 11' },
              { id_disciplina: 2, nombre: 'Futsal' },
              { id_disciplina: 3, nombre: 'Fútbol 7' }
            ]);
          } else if (idDep === 2) {
            setDisciplinas([
              { id_disciplina: 4, nombre: 'Básquet 5v5' },
              { id_disciplina: 5, nombre: 'Básquet 3x3' }
            ]);
          } else if (idDep === 3) {
            setDisciplinas([
              { id_disciplina: 6, nombre: 'Vóley 6v6' },
              { id_disciplina: 7, nombre: 'Vóley Playa (2v2)' }
            ]);
          } else {
            setDisciplinas([]);
          }
        });
    }
  }, [formData.idDeporte]);

  useEffect(() => {
    fetch('http://localhost:3000/api/catalogos/formatos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFormatos(data))
      .catch(() => {
        setFormatos([
          { id_formato: 1, nombre: 'Liga', descripcion: 'Todos contra todos por puntos' },
          { id_formato: 2, nombre: 'Eliminatoria', descripcion: 'Cuadro de eliminación directa (Brackets)' }
        ]);
      });
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/api/equipos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEquiposDisponibles(data))
      .catch(() => {
        setEquiposDisponibles([
          { id: 101, nombre: 'Deportivo Rosario' },
          { id: 102, nombre: 'Atlético Central' },
          { id: 103, nombre: 'Unión del Sur' },
          { id: 104, nombre: 'Titanes FC' }
        ]);
      });
  }, []);

  const handleChangeInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSeleccionarEquipo = (equipo) => {
    if (equiposSeleccionados.some((e) => e.id === equipo.id)) {
      setEquiposSeleccionados(equiposSeleccionados.filter((e) => e.id !== equipo.id));
    } else {
      setEquiposSeleccionados([...equiposSeleccionados, equipo]);
    }
  };

  const handleCrearEquipoRapido = (e) => {
    e.preventDefault();
    if (!nuevoEquipoNombre.trim()) return;

    const equipoNuevo = {
      id: Date.now(),
      nombre: nuevoEquipoNombre.trim()
    };

    setEquiposDisponibles((prev) => [...prev, equipoNuevo]);
    setEquiposSeleccionados((prev) => [...prev, equipoNuevo]);
    setNuevoEquipoNombre('');
    setMostrandoCrearEquipo(false);
  };

  const handleFinalizar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const payload = {
      nombreTorneo: formData.nombreTorneo,
      descripcionTorneo: formData.descripcionTorneo,
      idDisciplina: Number(formData.idDisciplina) || 1,
      idFormato: Number(formData.idFormato) || 1,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      ubicacion: formData.ubicacion,
      cantidadEquiposMax: formData.cantidadEquiposMax,
      equiposIds: equiposSeleccionados.map((eq) => eq.id)
    };

    try {
      const response = await fetch('http://localhost:3000/api/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error();

      const torneoCreado = await response.json();
      if (onTorneoCreado) onTorneoCreado(torneoCreado);
      if (onVolver) onVolver();
    } catch {
      const depNombre = deportes.find((d) => String(d.id_deporte) === String(formData.idDeporte))?.nombre || 'Fútbol';
      const discNombre = disciplinas.find((d) => String(d.id_disciplina) === String(formData.idDisciplina))?.nombre || 'Fútbol 11';
      const fmtNombre = formatos.find((f) => String(f.id_formato) === String(formData.idFormato))?.nombre || 'Liga';

      const torneoLocal = {
        id: Date.now(),
        nombre: formData.nombreTorneo,
        deporte: depNombre,
        disciplina: discNombre,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        ubicacion: formData.ubicacion || 'Sin definir',
        modalidad: fmtNombre,
        estado: 'Próximo',
        equiposInscriptos: equiposSeleccionados.length,
        cantidadEquiposMax: formData.cantidadEquiposMax === 'Sin limite' ? 'Sin limite' : Number(formData.cantidadEquiposMax),
        posiciones: [],
        bracket: [],
        estadisticas: { goleadores: [], asistidores: [], amarillas: [] }
      };

      if (onTorneoCreado) onTorneoCreado(torneoLocal);
      if (onVolver) onVolver();
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-800">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Paso {paso} de 4</span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Crear Nuevo Torneo</h2>
        </div>
        <button
          type="button"
          onClick={onVolver}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-medium"
        >
          ✕ Cancelar
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= paso ? 'bg-blue-500' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {paso === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">1. Selecciona el Deporte</h3>
            <div className="grid grid-cols-3 gap-3">
              {deportes.map((dep) => {
                const selected = String(formData.idDeporte) === String(dep.id_deporte);
                return (
                  <button
                    key={dep.id_deporte}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, idDeporte: dep.id_deporte, idDisciplina: '' }))}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                      selected
                        ? 'border-blue-500 bg-blue-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {dep.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {formData.idDeporte && (
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-3">2. Selecciona la Disciplina</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {disciplinas.map((disc) => {
                  const selected = String(formData.idDisciplina) === String(disc.id_disciplina);
                  return (
                    <button
                      key={disc.id_disciplina}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, idDisciplina: disc.id_disciplina }))}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-blue-500 bg-blue-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{disc.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Formato de Competición</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formatos.map((fmt) => {
              const selected = String(formData.idFormato) === String(fmt.id_formato);
              return (
                <button
                  key={fmt.id_formato}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, idFormato: fmt.id_formato }))}
                  className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                    selected
                      ? 'border-blue-500 bg-blue-500/10 text-white font-bold shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="block text-base font-semibold mb-1 text-slate-100">{fmt.nombre}</span>
                  <span className="block text-xs text-slate-400 font-normal">{fmt.descripcion}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-200">Equipos Participantes</h3>
              <p className="text-xs text-slate-400">Inscribe equipos al torneo (opcional).</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrandoCrearEquipo(!mostrandoCrearEquipo)}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
            >
              {mostrandoCrearEquipo ? 'Cancelar' : '+ Crear Equipo'}
            </button>
          </div>

          {mostrandoCrearEquipo && (
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex gap-2">
              <input
                type="text"
                placeholder="Nombre del nuevo equipo..."
                value={nuevoEquipoNombre}
                onChange={(e) => setNuevoEquipoNombre(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleCrearEquipoRapido}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Agregar
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
            {equiposDisponibles.map((eq) => {
              const seleccionado = equiposSeleccionados.some((e) => e.id === eq.id);
              return (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => toggleSeleccionarEquipo(eq)}
                  className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${
                    seleccionado
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{eq.nombre}</span>
                  {seleccionado && <span>✓</span>}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Equipos seleccionados: <strong className="text-white">{equiposSeleccionados.length}</strong>
          </p>
        </div>
      )}

      {paso === 4 && (
        <form onSubmit={handleFinalizar} className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">Datos Básicos del Torneo</h3>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Torneo *</label>
            <input
              type="text"
              name="nombreTorneo"
              required
              value={formData.nombreTorneo}
              onChange={handleChangeInput}
              placeholder="Ej: Copa Apertura 2026"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Inicio *</label>
              <input
                type="date"
                name="fechaInicio"
                required
                value={formData.fechaInicio}
                onChange={handleChangeInput}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Fin (Aproximada) *</label>
              <input
                type="date"
                name="fechaFin"
                required
                value={formData.fechaFin}
                onChange={handleChangeInput}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Sede / Ubicación</label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChangeInput}
                placeholder="Ej: Campus Rosario"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Límite de Equipos</label>
              <select
                name="cantidadEquiposMax"
                value={formData.cantidadEquiposMax}
                onChange={handleChangeInput}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value={4}>4 Equipos</option>
                <option value={8}>8 Equipos</option>
                <option value={12}>12 Equipos</option>
                <option value={16}>16 Equipos</option>
                <option value={24}>24 Equipos</option>
                <option value={32}>32 Equipos</option>
                <option value="Sin limite">Sin límite (N/A)</option>
              </select>
            </div>
          </div>
        </form>
      )}

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">
        {paso > 1 ? (
          <button
            type="button"
            onClick={() => setPaso((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
          >
            Anterior
          </button>
        ) : (
          <div />
        )}

        {paso < 4 ? (
          <button
            type="button"
            onClick={() => setPaso((p) => p + 1)}
            disabled={
              (paso === 1 && (!formData.idDeporte || !formData.idDisciplina)) ||
              (paso === 2 && !formData.idFormato)
            }
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalizar}
            disabled={cargando || !formData.nombreTorneo || !formData.fechaInicio || !formData.fechaFin}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
          >
            {cargando ? 'Guardando...' : 'Guardar y Registrar Torneo'}
          </button>
        )}
      </div>
    </div>
  );
};