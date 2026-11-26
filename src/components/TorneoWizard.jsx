// src/components/TorneoWizard.jsx
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const formatearFechaResumen = (valor) => {
  if (!valor) return 'Sin definir';
  const fecha = new Date(`${valor}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return valor;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(fecha);
};

export const TorneoWizard = ({ onVolver, onTorneoCreado }) => {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [creado, setCreado] = useState(false);
  const [error, setError] = useState(null);
  const [errorEquipos, setErrorEquipos] = useState('');
  const [cargandoEquipos, setCargandoEquipos] = useState(true);

  // Catálogos desde el backend
  const [deportes, setDeportes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [formatos, setFormatos] = useState([]);

  // Estado para la gestión de equipos
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [criteriosDesempate, setCriteriosDesempate] = useState([
    'Diferencia',
    'MarcadorAFavor',
    'ResultadoDirecto'
  ]);
  const [reglasSancion, setReglasSancion] = useState([
    { tipoEvento: 'Tarjeta Amarilla', cantidadAcumulada: 3, partidosSuspension: 1 },
    { tipoEvento: 'Tarjeta Roja', cantidadAcumulada: 1, partidosSuspension: 1 }
  ]);

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

  const equiposDeLaDisciplina = equiposDisponibles.filter(
    (equipo) => String(equipo.idDisciplina) === String(formData.idDisciplina)
  );
  const limiteSeleccion = formData.cantidadEquiposMax === 'Sin limite'
    ? Number.POSITIVE_INFINITY
    : Number(formData.cantidadEquiposMax);
  const deporteSeleccionado = deportes.find((deporte) => (
    String(deporte.idDeporte || deporte.id_deporte) === String(formData.idDeporte)
  ));
  const disciplinaSeleccionada = disciplinas.find((disciplina) => (
    String(disciplina.idDisciplina || disciplina.id_disciplina) === String(formData.idDisciplina)
  ));
  const formatoSeleccionado = formatos.find((formato) => (
    String(formato.id_formato) === String(formData.idFormato)
  ));

  useEffect(() => {
    apiFetch('/catalogos/deportes')
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

      apiFetch(`/catalogos/disciplinas?idDeporte=${idDep}`)
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
    apiFetch('/catalogos/formatos')
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
    apiFetch('/equipos')
      .then((res) => {
        if (!res.ok) throw new Error('No se pudieron cargar los equipos.');
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('La respuesta de equipos no es válida.');
        setEquiposDisponibles(data);
      })
      .catch((fetchError) => setErrorEquipos(fetchError.message || 'No se pudieron cargar los equipos.'))
      .finally(() => setCargandoEquipos(false));
  }, []);

  const handleChangeInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSeleccionarEquipo = (equipo) => {
    setEquiposSeleccionados((seleccionados) => {
      if (seleccionados.some((e) => Number(e.id) === Number(equipo.id))) {
        return seleccionados.filter((e) => Number(e.id) !== Number(equipo.id));
      }
      if (seleccionados.length >= limiteSeleccion) return seleccionados;
      return [...seleccionados, equipo];
    });
  };

  const handleSeleccionDeporte = (deporte) => {
    setFormData((prev) => ({ ...prev, idDeporte: deporte.idDeporte || deporte.id_deporte, idDisciplina: '' }));
    setEquiposSeleccionados([]);
  };

  const handleSeleccionDisciplina = (disciplina) => {
    const idDisciplina = disciplina.idDisciplina || disciplina.id_disciplina;
    setFormData((prev) => ({ ...prev, idDisciplina }));
    setEquiposSeleccionados((seleccionados) => (
      seleccionados.filter((equipo) => String(equipo.idDisciplina) === String(idDisciplina))
    ));
  };

  const continuarAConfirmacion = () => {
    setError(null);
    if (!formData.nombreTorneo.trim()) {
      setError('Ingresá un nombre para el torneo.');
      return;
    }
    if (!formData.fechaInicio || !formData.fechaFin) {
      setError('Completá las fechas de inicio y fin del torneo.');
      return;
    }
    if (formData.fechaFin < formData.fechaInicio) {
      setError('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
      return;
    }
    setPaso(5);
  };

  const handleFinalizar = async () => {
    if (cargando || creado) return;
    setError(null);
    if (!formData.nombreTorneo.trim()) {
      setError('Ingresá un nombre para el torneo.');
      setPaso(4);
      return;
    }
    if (equiposSeleccionados.length < 2) {
      setError('Seleccioná al menos 2 equipos para crear los partidos del torneo.');
      setPaso(3);
      return;
    }
    if (equiposSeleccionados.length > limiteSeleccion) {
      setError(`El límite del torneo es de ${limiteSeleccion} equipos.`);
      setPaso(3);
      return;
    }
    if (!formData.fechaInicio || !formData.fechaFin) {
      setError('Completá las fechas de inicio y fin del torneo.');
      setPaso(4);
      return;
    }
    if (formData.fechaFin < formData.fechaInicio) {
      setError('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
      setPaso(4);
      return;
    }
    setCargando(true);
    setError(null);

    const payload = {
      nombreTorneo: formData.nombreTorneo,
      descripcionTorneo: formData.descripcionTorneo,
      idDisciplina: Number(formData.idDisciplina),
      idFormato: Number(formData.idFormato),
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      ubicacion: formData.ubicacion,
      cantidadEquiposMax: formData.cantidadEquiposMax,
      equiposIds: equiposSeleccionados.map((eq) => eq.id),
      criteriosDesempate,
      reglasSancion
    };

    try {
      const response = await apiFetch('/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resultado = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resultado.error || 'No se pudo guardar el torneo.');

      if (onTorneoCreado) onTorneoCreado(resultado);
      setCreado(true);
    } catch (saveError) {
      setError(saveError.message || 'No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-800">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${creado ? 'text-emerald-400' : 'text-blue-400'}`}>
            {creado ? 'Creación completada' : `Paso ${paso} de 6`}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {creado ? 'Torneo creado exitosamente' : 'Crear nuevo torneo'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onVolver}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-medium"
        >
          {creado ? 'Cerrar' : '✕ Cancelar'}
        </button>
      </div>

      {!creado && <div className="grid grid-cols-6 gap-2 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= paso ? 'bg-blue-500' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>}

      {creado ? (
        <div role="status" className="flex flex-col items-center py-5 text-center sm:py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-9 w-9">
              <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">¡Todo listo!</p>
          <h3 className="mt-2 font-montserrat text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Torneo creado exitosamente
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            <span className="font-semibold text-slate-200">{formData.nombreTorneo.trim()}</span> ya está guardado y disponible en tu lista de torneos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-300">
              {equiposSeleccionados.length} equipos participantes
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-300">
              {formatoSeleccionado?.nombre || 'Formato configurado'}
            </span>
          </div>
        </div>
      ) : null}

      {!creado && paso === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">1. Selecciona el Deporte</h3>
            <div className="grid grid-cols-3 gap-3">
              {deportes.map((dep) => {
                const idDeporte = dep.idDeporte || dep.id_deporte;
                const selected = String(formData.idDeporte) === String(idDeporte);
                return (
                  <button
                    key={idDeporte}
                    type="button"
                    onClick={() => handleSeleccionDeporte(dep)}
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
                  const idDisciplina = disc.idDisciplina || disc.id_disciplina;
                  const selected = String(formData.idDisciplina) === String(idDisciplina);
                  return (
                    <button
                      key={idDisciplina}
                      type="button"
                      onClick={() => handleSeleccionDisciplina(disc)}
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

      {!creado && paso === 2 && (
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

      {!creado && paso === 3 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-200">Equipos Participantes</h3>
              <p className="text-xs text-slate-400">Seleccioná equipos ya registrados en el sistema.</p>
            </div>
          </div>

          {cargandoEquipos ? (
            <p className="text-sm text-slate-400">Cargando equipos...</p>
          ) : errorEquipos ? (
            <p role="alert" className="text-sm text-red-400">{errorEquipos}</p>
          ) : equiposDisponibles.length === 0 ? (
            <p className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-300">
              Todavía no hay equipos guardados. Creá un equipo desde la pestaña Equipos y volvé a este paso.
            </p>
          ) : !formData.idDisciplina ? (
            <p className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-300">
              Seleccioná una disciplina en el primer paso para ver los equipos compatibles.
            </p>
          ) : equiposDeLaDisciplina.length === 0 ? (
            <p className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-300">
              No hay equipos guardados para la disciplina seleccionada.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
              {equiposDeLaDisciplina.map((eq) => {
                const seleccionado = equiposSeleccionados.some((e) => Number(e.id) === Number(eq.id));
                const limiteAlcanzado = equiposSeleccionados.length >= limiteSeleccion && !seleccionado;
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleSeleccionarEquipo(eq)}
                    disabled={limiteAlcanzado}
                    className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${
                      seleccionado
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : limiteAlcanzado
                          ? 'border-slate-800 bg-slate-800/20 text-slate-600 cursor-not-allowed'
                          : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{eq.nombre || eq.nombreEquipo}</span>
                    {seleccionado && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-xs text-slate-400 font-medium">
            Equipos seleccionados: <strong className="text-white">{equiposSeleccionados.length}</strong>
          </p>
          {equiposSeleccionados.length < 2 && (
            <p className="text-xs text-amber-300">Elegí al menos 2 equipos para generar el fixture automáticamente.</p>
          )}
          {Number.isFinite(limiteSeleccion) && (
            <p className="text-xs text-slate-500">Límite actual: {limiteSeleccion} equipos.</p>
          )}
        </div>
      )}

      {!creado && paso === 4 && (
        <form onSubmit={(event) => { event.preventDefault(); continuarAConfirmacion(); }} className="space-y-4">
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
                min={formData.fechaInicio || undefined}
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

      {!creado && paso === 5 && (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300">Reglas deportivas</p>
            <h3 className="mt-0.5 text-base font-semibold text-white">Criterios para desempatar posiciones</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Los tres criterios se aplican en el orden elegido cuando hay igualdad de puntos.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {criteriosDesempate.map((criterio, indice) => (
              <label key={indice} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 p-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-300">{indice + 1}</span>
                <select
                  value={criterio}
                  onChange={(event) => setCriteriosDesempate((actuales) => actuales.map((valor, posicion) => (
                    posicion === indice ? event.target.value : valor
                  )))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="Diferencia">Diferencia de marcador</option>
                  <option value="MarcadorAFavor">Marcador a favor</option>
                  <option value="ResultadoDirecto">Resultado directo</option>
                  <option value="FairPlay">Fair play (menos tarjetas)</option>
                </select>
              </label>
            ))}
          </div>
          <p className="text-[11px] leading-4 text-slate-500">
            El orden no puede repetir criterios. Si continúa el empate luego de los tres, se mantiene la igualdad.
          </p>
          <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-bold text-slate-100">Reglas de suspensión</h4>
              <p className="text-[11px] leading-4 text-slate-400">Se aplican al cerrar actas.</p>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {reglasSancion.map((regla, indice) => (
                <div key={regla.tipoEvento} className="rounded-lg border border-slate-700 bg-slate-900/60 p-2.5">
                  <p className="mb-2 text-xs font-semibold text-slate-200">{regla.tipoEvento}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[10px] font-semibold leading-4 text-slate-400">
                      Cantidad
                      <input type="number" min="1" max="100" required value={regla.cantidadAcumulada} onChange={(event) => setReglasSancion((actuales) => actuales.map((item, i) => i === indice ? { ...item, cantidadAcumulada: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-blue-500" />
                    </label>
                    <label className="block text-[10px] font-semibold leading-4 text-slate-400">
                      Partidos
                      <input type="number" min="1" max="20" required value={regla.partidosSuspension} onChange={(event) => setReglasSancion((actuales) => actuales.map((item, i) => i === indice ? { ...item, partidosSuspension: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-blue-500" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {!creado && paso === 6 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">Revisión final</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Confirmá la creación del torneo</h3>
            <p className="mt-1 text-sm text-slate-400">Revisá estos datos antes de guardar la competencia.</p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-5">
            <h4 className="break-words text-base font-bold text-white">{formData.nombreTorneo.trim()}</h4>
            <dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 border-t border-slate-700 pt-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Deporte y disciplina</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-200">
                  {[deporteSeleccionado?.nombre, disciplinaSeleccionada?.nombre].filter(Boolean).join(' · ') || 'Sin definir'}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Formato</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">{formatoSeleccionado?.nombre || 'Sin definir'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fechas</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {formatearFechaResumen(formData.fechaInicio)} – {formatearFechaResumen(formData.fechaFin)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sede / ubicación</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-200">{formData.ubicacion.trim() || 'Sin asignar'}</dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipos participantes</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {equiposSeleccionados.length} equipos · Límite {formData.cantidadEquiposMax === 'Sin limite' ? 'sin límite' : formData.cantidadEquiposMax}
                </dd>
                <ul className="mt-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
                  {equiposSeleccionados.map((equipo) => (
                    <li key={equipo.id} className="max-w-full truncate rounded-full border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-300" title={equipo.nombre || equipo.nombreEquipo}>
                      {equipo.nombre || equipo.nombreEquipo}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Desempates (en orden)</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {criteriosDesempate.map((criterio, indice) => (
                    <span key={criterio} className="rounded-full border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-300">
                      {indice + 1}. {criterio === 'MarcadorAFavor' ? 'Marcador a favor' : criterio === 'ResultadoDirecto' ? 'Resultado directo' : criterio === 'FairPlay' ? 'Fair play' : 'Diferencia'}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suspensiones automáticas</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {reglasSancion.map((regla) => `${regla.cantidadAcumulada} ${regla.tipoEvento === 'Tarjeta Amarilla' ? 'amarillas' : 'roja(s)'} → ${regla.partidosSuspension} partido(s)`).join(' · ')}
                </dd>
              </div>
            </dl>
          </div>
          <p className="text-xs leading-5 text-slate-400">Al confirmar, el torneo se guardará con los equipos seleccionados.</p>
        </div>
      )}

      {!creado && error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-4">
        {creado ? (
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onVolver}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
            >
              Volver a torneos
            </button>
          </div>
        ) : (
          <>
            {paso > 1 ? (
              <button
                type="button"
                onClick={() => { setError(null); setPaso((actual) => actual - 1); }}
                disabled={cargando}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Anterior
              </button>
            ) : <div />}

            {paso < 3 ? (
              <button
                type="button"
                onClick={() => { setError(null); setPaso((actual) => actual + 1); }}
                disabled={
                  (paso === 1 && (!formData.idDeporte || !formData.idDisciplina)) ||
                  (paso === 2 && !formData.idFormato)
                }
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            ) : paso === 3 ? (
              <button
                type="button"
                onClick={() => { setError(null); setPaso(4); }}
                disabled={equiposSeleccionados.length < 2 || equiposSeleccionados.length > limiteSeleccion}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            ) : paso === 4 ? (
              <button
                type="button"
                onClick={continuarAConfirmacion}
                disabled={!formData.nombreTorneo.trim() || !formData.fechaInicio || !formData.fechaFin}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Configurar desempates
              </button>
            ) : paso === 5 ? (
              <button
                type="button"
                onClick={() => { setError(null); setPaso(6); }}
                disabled={new Set(criteriosDesempate).size !== 3}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Revisar torneo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalizar}
                disabled={cargando}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
              >
                {cargando ? 'Creando torneo…' : 'Confirmar y crear torneo'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
