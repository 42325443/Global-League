
// src/components/EquipoWizard.jsx
import React, { useState } from "react";

export const EquipoWizard = ({ onVolver, onEquipoCreado }) => {
  const [paso, setPaso] = useState(1);

  const [formData, setFormData] = useState({
    nombreEquipo: "",
    deporte: "",
    disciplina: "",
    categoria: "",
    localidad: "",
    capitan: "",
  });

  const [jugadores, setJugadores] = useState([]);

  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: "",
    dni: "",
  });

  // Deportes disponibles
  const deportes = [
    {
      id: 1,
      nombre: "Fútbol",
    },
    {
      id: 2,
      nombre: "Básquet",
    },
    {
      id: 3,
      nombre: "Vóley",
    },
  ];

  // Disciplinas / modalidades
  const disciplinas = {
    Fútbol: [
      "Fútbol 5",
      "Fútbol 7",
      "Fútbol 9",
      "Fútbol 11",
    ],
    Básquet: [
      "Básquet 5v5",
      "Básquet 3x3",
    ],
    Vóley: [
      "Vóley 6v6",
      "Vóley Playa 2v2",
    ],
  };

  // Categorías
  const categorias = [
    "Sub 13",
    "Sub 18",
    "E",
    "D",
    "C",
    "B",
    "A",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const seleccionarDeporte = (deporte) => {
    setFormData((prev) => ({
      ...prev,
      deporte: deporte.nombre,
      disciplina: "",
    }));
  };

  const seleccionarDisciplina = (disciplina) => {
    setFormData((prev) => ({
      ...prev,
      disciplina,
    }));
  };

  const agregarJugador = (e) => {
    e.preventDefault();

    if (!nuevoJugador.nombre.trim()) {
      return;
    }

    const jugador = {
      id: Date.now(),
      nombre: nuevoJugador.nombre.trim(),
      dni: nuevoJugador.dni.trim(),
    };

    setJugadores((prev) => [...prev, jugador]);

    setNuevoJugador({
      nombre: "",
      dni: "",
    });
  };

  const eliminarJugador = (id) => {
    setJugadores((prev) =>
      prev.filter((jugador) => jugador.id !== id)
    );
  };

  const handleFinalizar = (e) => {
    e.preventDefault();

    const equipoNuevo = {
      id: Date.now(),
      nombre: formData.nombreEquipo,
      disciplina: formData.deporte,
      modalidad: formData.disciplina,
      categoria: formData.categoria,
      localidad: formData.localidad,
      capitan: formData.capitan,
      jugadores: jugadores.length,
      listaJugadores: jugadores,
    };

    if (onEquipoCreado) {
      onEquipoCreado(equipoNuevo);
    }

    if (onVolver) {
      onVolver();
    }
  };

  const puedeAvanzarPaso1 =
    formData.deporte && formData.disciplina;

  const puedeAvanzarPaso2 =
    formData.nombreEquipo &&
    formData.categoria &&
    formData.localidad &&
    formData.capitan;

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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              {deportes.map((deporte) => {

                const seleccionado =
                  formData.deporte === deporte.nombre;

                return (
                  <button
                    key={deporte.id}
                    type="button"
                    onClick={() =>
                      seleccionarDeporte(deporte)
                    }
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

          </div>

          {/* DISCIPLINAS */}

          {formData.deporte && (
            <div>

              <h3 className="text-lg font-semibold text-slate-200 mb-3">
                2. Selecciona la Disciplina
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {disciplinas[formData.deporte]?.map(
                  (disciplina) => {

                    const seleccionado =
                      formData.disciplina === disciplina;

                    return (
                      <button
                        key={disciplina}
                        type="button"
                        onClick={() =>
                          seleccionarDisciplina(
                            disciplina
                          )
                        }
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          seleccionado
                            ? "border-blue-500 bg-blue-500/10 text-white font-bold"
                            : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          {disciplina}
                        </span>
                      </button>
                    );
                  }
                )}

              </div>

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

          {/* CATEGORIA */}

          <div>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              Categoría *
            </label>

            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >

              <option value="">
                Seleccionar categoría
              </option>

              {categorias.map((categoria) => (
                <option
                  key={categoria}
                  value={categoria}
                >
                  {categoria}
                </option>
              ))}

            </select>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <input
                type="text"
                placeholder="Nombre y apellido"
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
              disabled={!nuevoJugador.nombre.trim()}
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
                        {jugador.nombre}
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
            disabled={
              !formData.nombreEquipo ||
              !formData.deporte ||
              !formData.disciplina ||
              !formData.categoria ||
              !formData.localidad ||
              !formData.capitan
            }
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Guardar y Crear Equipo
          </button>

        )}

      </div>

    </div>
  );
};

export default EquipoWizard;

