import React, { useState } from "react";

export const ArbitroWizard = ({ onVolver, onArbitroCreado }) => {
  const [paso, setPaso] = useState(1);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    localidad: "",
    deporte: "",
    especialidad: "",
  });

  const deportes = [
    {
      id: 1,
      nombre: "Fútbol",
      especialidades: [
        "Fútbol 5",
        "Fútbol 7",
        "Fútbol 9",
        "Fútbol 11",
      ],
    },
    {
      id: 2,
      nombre: "Básquet",
      especialidades: [
        "Básquet 5v5",
        "Básquet 3x3",
      ],
    },
    {
      id: 3,
      nombre: "Vóley",
      especialidades: [
        "Vóley 6v6",
        "Vóley Playa 2v2",
      ],
    },
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
      especialidad: "",
    }));
  };

  const deporteSeleccionado = deportes.find(
    (deporte) => deporte.nombre === formData.deporte
  );

  const puedeAvanzarPaso1 =
    formData.deporte && formData.especialidad;

  const puedeAvanzarPaso2 =
    formData.nombre &&
    formData.apellido &&
    formData.dni &&
    formData.email &&
    formData.telefono;

  const puedeFinalizar =
    formData.nombre &&
    formData.apellido &&
    formData.dni &&
    formData.email &&
    formData.telefono &&
    formData.localidad &&
    formData.deporte &&
    formData.especialidad;

  const handleFinalizar = (e) => {
    e.preventDefault();

    const arbitroNuevo = {
      id: Date.now(),
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni,
      email: formData.email,
      telefono: formData.telefono,
      localidad: formData.localidad,
      deporte: formData.deporte,
      especialidad: formData.especialidad,
    };

    if (onArbitroCreado) {
      onArbitroCreado(arbitroNuevo);
    }

    if (onVolver) {
      onVolver();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-800">

      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Paso {paso} de 3
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-white">
            Registrar Nuevo Árbitro
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
      {/* PASO 1 - DEPORTE */}
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

          {/* ESPECIALIDAD */}

          {formData.deporte && (
            <div>

              <h3 className="text-lg font-semibold text-slate-200 mb-3">
                2. Selecciona la Especialidad
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {deporteSeleccionado?.especialidades.map(
                  (especialidad) => {

                    const seleccionado =
                      formData.especialidad === especialidad;

                    return (
                      <button
                        key={especialidad}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            especialidad,
                          }))
                        }
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          seleccionado
                            ? "border-blue-500 bg-blue-500/10 text-white font-bold"
                            : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          {especialidad}
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
      {/* PASO 2 - DATOS PERSONALES */}
      {/* ========================================= */}

      {paso === 2 && (
        <div className="space-y-5">

          <h3 className="text-lg font-semibold text-slate-200">
            Datos del Árbitro
          </h3>

          {/* NOMBRE Y APELLIDO */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nombre *
              </label>

              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Apellido *
              </label>

              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

          </div>

          {/* DNI */}

          <div>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              DNI *
            </label>

            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="Ej: 40123456"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />

          </div>

          {/* EMAIL */}

          <div>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              Correo electrónico *
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ej: juan@email.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />

          </div>

          {/* TELEFONO */}

          <div>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              Teléfono *
            </label>

            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 341 555 1234"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />

          </div>

        </div>
      )}

      {/* ========================================= */}
      {/* PASO 3 - INFORMACIÓN Y CONFIRMACIÓN */}
      {/* ========================================= */}

      {paso === 3 && (
        <div className="space-y-5">

          <h3 className="text-lg font-semibold text-slate-200">
            Información y Confirmación
          </h3>

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

          {/* RESUMEN */}

          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-3">

            <h4 className="text-sm font-bold text-white mb-4">
              Resumen del registro
            </h4>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400">
                Árbitro
              </span>

              <span className="text-slate-200 font-medium text-right">
                {formData.nombre} {formData.apellido}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400">
                DNI
              </span>

              <span className="text-slate-200">
                {formData.dni}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400">
                Deporte
              </span>

              <span className="text-slate-200">
                {formData.deporte}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400">
                Especialidad
              </span>

              <span className="text-slate-200">
                {formData.especialidad}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400">
                Localidad
              </span>

              <span className="text-slate-200">
                {formData.localidad || "Sin completar"}
              </span>
            </div>

          </div>

        </div>
      )}

      {/* ========================================= */}
      {/* BOTONES */}
      {/* ========================================= */}

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">

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
            disabled={!puedeFinalizar}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Guardar y Registrar Árbitro
          </button>

        )}

      </div>

    </div>
  );
};

export default ArbitroWizard;