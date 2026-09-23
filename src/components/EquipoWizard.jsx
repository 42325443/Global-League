
// src/components/EquipoWizard.jsx
import { useEffect, useState } from "react";

export const EquipoWizard = ({ onVolver, onEquipoCreado }) => {
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState("");

  const [formData, setFormData] = useState({
    nombreEquipo: "",
    idDeporte: "",
    idDisciplina: "",
    localidad: "",
    capitan: "",
  });

  const [deportes, setDeportes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [cargandoDeportes, setCargandoDeportes] = useState(true);
  const [cargandoDisciplinas, setCargandoDisciplinas] = useState(false);
  const [errorDeportes, setErrorDeportes] = useState("");
  const [errorDisciplinas, setErrorDisciplinas] = useState("");

  const [jugadores, setJugadores] = useState([]);

  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: "",
    apellido: "",
    dni: "",
  });

  useEffect(() => {
    let cancelado = false;

    fetch("http://localhost:3000/api/catalogos/deportes")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudieron cargar los deportes");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) throw new Error("No hay deportes disponibles");

        if (!cancelado) {
          setDeportes(data.map((deporte) => ({
            id: deporte.idDeporte ?? deporte.id_deporte ?? deporte.id,
            nombre: deporte.nombreDeporte ?? deporte.nombre_deporte ?? deporte.nombre,
          })));
        }
      })
      .catch(() => {
        if (!cancelado) {
          setDeportes([]);
          setErrorDeportes("No se pudo cargar el catálogo de deportes. Verificá que el backend esté activo.");
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoDeportes(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!formData.idDeporte) {
      return undefined;
    }

    let cancelado = false;

    const cargarDisciplinas = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/catalogos/disciplinas?idDeporte=${encodeURIComponent(formData.idDeporte)}`
        );
        if (!response.ok) throw new Error("No se pudieron cargar las disciplinas");

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Respuesta de disciplinas inválida");

        const disciplinasFiltradas = data.filter(
          (disciplina) => Number(disciplina.idDeporte ?? disciplina.id_deporte) === Number(formData.idDeporte)
        );

        if (!cancelado) {
          const disciplinasNormalizadas = disciplinasFiltradas.map((disciplina) => ({
            id: disciplina.idDisciplina ?? disciplina.id_disciplina ?? disciplina.id,
            nombre: disciplina.nombreDisciplina ?? disciplina.nombre_disciplina ?? disciplina.nombre,
          }));
          setDisciplinas(disciplinasNormalizadas);
          setErrorDisciplinas(
            disciplinasNormalizadas.length === 0
              ? "No hay disciplinas cargadas para este deporte."
              : ""
          );
        }
      } catch {
        if (!cancelado) {
          setDisciplinas([]);
          setErrorDisciplinas("No se pudieron cargar las disciplinas. Verificá que el backend esté activo.");
        }
      } finally {
        if (!cancelado) setCargandoDisciplinas(false);
      }
    };

    cargarDisciplinas();

    return () => {
      cancelado = true;
    };
  }, [formData.idDeporte]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const seleccionarDeporte = (deporte) => {
    if (String(formData.idDeporte) === String(deporte.id)) return;

    setFormData((prev) => ({
      ...prev,
      idDeporte: String(deporte.id),
      idDisciplina: "",
    }));
    setCargandoDisciplinas(true);
    setDisciplinas([]);
    setErrorDisciplinas("");
  };

  const seleccionarDisciplina = (disciplina) => {
    setFormData((prev) => ({
      ...prev,
      idDisciplina: String(disciplina.id),
    }));
  };

  const agregarJugador = (e) => {
    e.preventDefault();

    if (!nuevoJugador.nombre.trim() || !nuevoJugador.apellido.trim()) {
      return;
    }

    const jugador = {
      id: Date.now(),
      nombre: nuevoJugador.nombre.trim(),
      apellido: nuevoJugador.apellido.trim(),
      dni: nuevoJugador.dni.trim(),
    };

    setJugadores((prev) => [...prev, jugador]);

    setNuevoJugador({
      nombre: "",
      apellido: "",
      dni: "",
    });
  };

  const eliminarJugador = (id) => {
    setJugadores((prev) =>
      prev.filter((jugador) => jugador.id !== id)
    );
  };

  const handleFinalizar = async (e) => {
    e.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setErrorGuardado("");

    try {
      const response = await fetch("http://localhost:3000/api/equipos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEquipo: formData.nombreEquipo.trim(),
          idDisciplina: Number(formData.idDisciplina),
          localidad: formData.localidad.trim(),
          capitan: formData.capitan.trim(),
          jugadores: jugadores.map(({ nombre, apellido, dni }) => ({
            nombre,
            apellido,
            dni,
          })),
        }),
      });

      const resultado = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resultado.error || "No se pudo guardar el equipo y sus jugadores.");
      }

      if (onEquipoCreado) onEquipoCreado(resultado);
      if (onVolver) onVolver();
    } catch (error) {
      setErrorGuardado(error.message || "No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const puedeAvanzarPaso1 =
    formData.idDeporte && formData.idDisciplina;

  const puedeAvanzarPaso2 =
    formData.nombreEquipo.trim() &&
    formData.localidad.trim() &&
    formData.capitan.trim();

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-800">

      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Paso {paso} de 3
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-white">
            Crear Nuevo Equipo
          </h2>
        </div>

        <button
          type="button"
          onClick={onVolver}
          disabled={guardando}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-medium"
        >
          ✕ Cancelar
        </button>

      </div>

      {/* BARRA DE PROGRESO */}
      <div className="grid grid-cols-3 gap-2 mb-8">

        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= paso
                ? "bg-blue-500"
                : "bg-slate-800"
            }`}
          />
        ))}

      </div>

      {/* ========================================= */}
      {/* PASO 1 - DEPORTE Y DISCIPLINA */}
      {/* ========================================= */}

      {paso === 1 && (
        <div className="space-y-6">

          <div>

            <h3 className="text-lg font-semibold text-slate-200 mb-3">
              1. Selecciona el Deporte
            </h3>

            {cargandoDeportes ? (
              <p className="text-sm text-slate-400">Cargando deportes...</p>
            ) : errorDeportes ? (
              <p role="alert" className="text-sm text-red-400">{errorDeportes}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {deportes.map((deporte) => {
                  const seleccionado =
                    String(formData.idDeporte) === String(deporte.id);

                  return (
                    <button
                      key={deporte.id}
                      type="button"
                      onClick={() => seleccionarDeporte(deporte)}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        seleccionado
                          ? "border-blue-500 bg-blue-500/10 text-white font-bold"
                          : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {deporte.nombre}
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* DISCIPLINAS */}

          {formData.idDeporte && (
            <div>

              <h3 className="text-lg font-semibold text-slate-200 mb-3">
                2. Selecciona la Disciplina
              </h3>

              {cargandoDisciplinas ? (
                <p className="text-sm text-slate-400">Cargando disciplinas...</p>
              ) : disciplinas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {disciplinas.map((disciplina) => {
                    const seleccionado =
                      String(formData.idDisciplina) === String(disciplina.id);

                    return (
                      <button
                        key={disciplina.id}
                        type="button"
                        onClick={() => seleccionarDisciplina(disciplina)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          seleccionado
                            ? "border-blue-500 bg-blue-500/10 text-white font-bold"
                            : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          {disciplina.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p
                  role={errorDisciplinas ? "alert" : undefined}
                  className={`text-sm ${errorDisciplinas ? "text-red-400" : "text-slate-400"}`}
                >
                  {errorDisciplinas || "No hay disciplinas disponibles para este deporte."}
                </p>
              )}

            </div>
          )}

        </div>
      )}

      {/* ========================================= */}
      {/* PASO 2 - DATOS DEL EQUIPO */}
      {/* ========================================= */}

      {paso === 2 && (
        <div className="space-y-5">

          <h3 className="text-lg font-semibold text-slate-200">
            Datos del Equipo
          </h3>

          {/* NOMBRE */}

          <div>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre del Equipo *
            </label>

            <input
              type="text"
              name="nombreEquipo"
              value={formData.nombreEquipo}
              onChange={handleChange}
              placeholder="Ej: Los Tigres"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />

          </div>

          {/* LOCALIDAD */}

          <div>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              Localidad *
            </label>

            <input
              type="text"
              name="localidad"
              value={formData.localidad}
              onChange={handleChange}
              placeholder="Ej: Rosario"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />

          </div>

          {/* CAPITAN */}

          <div>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              Capitán *
            </label>

            <input
              type="text"
              name="capitan"
              value={formData.capitan}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />

          </div>

        </div>
      )}

      {/* ========================================= */}
      {/* PASO 3 - JUGADORES */}
      {/* ========================================= */}

      {paso === 3 && (
        <div className="space-y-5">

          <div>

            <h3 className="text-lg font-semibold text-slate-200">
              Jugadores
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Agregá los jugadores que forman parte del equipo.
            </p>

          </div>

          {/* AGREGAR JUGADOR */}

          <form
            onSubmit={agregarJugador}
            className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3"
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              <input
                type="text"
                placeholder="Nombre"
                value={nuevoJugador.nombre}
                onChange={(e) =>
                  setNuevoJugador((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />

              <input
                type="text"
                placeholder="Apellido"
                value={nuevoJugador.apellido}
                onChange={(e) =>
                  setNuevoJugador((prev) => ({
                    ...prev,
                    apellido: e.target.value,
                  }))
                }
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />

              <input
                type="text"
                placeholder="DNI"
                value={nuevoJugador.dni}
                onChange={(e) =>
                  setNuevoJugador((prev) => ({
                    ...prev,
                    dni: e.target.value,
                  }))
                }
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />

            </div>

            <button
              type="submit"
              disabled={!nuevoJugador.nombre.trim() || !nuevoJugador.apellido.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              + Agregar jugador
            </button>

          </form>

          {/* LISTA DE JUGADORES */}

          <div className="space-y-2">

            {jugadores.length === 0 ? (

              <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl">

                <p className="text-sm text-slate-500">
                  Todavía no agregaste jugadores.
                </p>

              </div>

            ) : (

              jugadores.map((jugador, index) => (

                <div
                  key={jugador.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-800 rounded-lg"
                >

                  <div className="flex items-center gap-3">

                    <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                      {index + 1}
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-slate-200">
                        {jugador.nombre} {jugador.apellido}
                      </p>

                      {jugador.dni && (
                        <p className="text-xs text-slate-500">
                          DNI: {jugador.dni}
                        </p>
                      )}

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      eliminarJugador(jugador.id)
                    }
                    className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    Eliminar
                  </button>

                </div>

              ))
            )}

          </div>

          {/* CANTIDAD */}

          <p className="text-xs text-slate-400 font-medium">
            Jugadores registrados:{" "}
            <strong className="text-white">
              {jugadores.length}
            </strong>
          </p>

        </div>
      )}

      {/* ========================================= */}
      {/* BOTONES DE NAVEGACIÓN */}
      {/* ========================================= */}

      {errorGuardado && (
        <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorGuardado}
        </p>
      )}

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">

        {/* ANTERIOR */}

        {paso > 1 ? (

          <button
            type="button"
            onClick={() =>
              setPaso((p) => p - 1)
            }
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
          >
            Anterior
          </button>

        ) : (

          <div />

        )}

        {/* SIGUIENTE / FINALIZAR */}

        {paso < 3 ? (

          <button
            type="button"
            disabled={
              (paso === 1 && !puedeAvanzarPaso1) ||
              (paso === 2 && !puedeAvanzarPaso2)
            }
            onClick={() =>
              setPaso((p) => p + 1)
            }
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Siguiente
          </button>

        ) : (

          <button
            type="button"
            onClick={handleFinalizar}
            disabled={guardando ||
              !formData.nombreEquipo.trim() ||
              !formData.idDeporte ||
              !formData.idDisciplina ||
              !formData.localidad.trim() ||
              !formData.capitan.trim()
            }
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {guardando ? "Guardando..." : "Guardar y Crear Equipo"}
          </button>

        )}

      </div>

    </div>
  );
};

export default EquipoWizard;

