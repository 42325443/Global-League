import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export const ArbitroWizard = ({ onVolver, onArbitroCreado }) => {
  const [paso, setPaso] = useState(1);
  const [deportes, setDeportes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    localidad: "",
    idDeporte: "",
    idDisciplina: "",
    deporte: "",
    especialidad: "",
  });

  useEffect(() => {
    let cancelado = false;

    const cargarCatalogos = async () => {
      try {
        const [respuestaDeportes, respuestaDisciplinas] = await Promise.all([
          apiFetch("/catalogos/deportes"),
          apiFetch("/catalogos/disciplinas"),
        ]);

        if (!respuestaDeportes.ok || !respuestaDisciplinas.ok) {
          throw new Error("No se pudieron cargar los deportes y disciplinas.");
        }

        const [deportesData, disciplinasData] = await Promise.all([
          respuestaDeportes.json(),
          respuestaDisciplinas.json(),
        ]);

        if (!Array.isArray(deportesData) || !Array.isArray(disciplinasData)) {
          throw new Error("La respuesta del catálogo no es válida.");
        }

        const deportesNormalizados = deportesData.map((deporte) => {
          const nombre = deporte.nombreDeporte ?? deporte.nombre_deporte ?? deporte.nombre ?? "";
          const nombreNormalizado = nombre.trim().toLocaleLowerCase();
          const etiqueta = nombreNormalizado === "basketball"
            ? "Básquet"
            : nombreNormalizado === "volleyball"
              ? "Vóley"
              : nombre;

          return {
            id: deporte.idDeporte ?? deporte.id_deporte ?? deporte.id,
            nombre,
            etiqueta,
          };
        }).filter((deporte) => deporte.id && deporte.nombre);

        const disciplinasNormalizadas = disciplinasData.map((disciplina) => ({
          id: disciplina.idDisciplina ?? disciplina.id_disciplina ?? disciplina.id,
          idDeporte: disciplina.idDeporte ?? disciplina.id_deporte,
          nombre: disciplina.nombreDisciplina ?? disciplina.nombre_disciplina ?? disciplina.nombre ?? "",
        })).filter((disciplina) => disciplina.id && disciplina.idDeporte && disciplina.nombre);

        if (!cancelado) {
          setDeportes(deportesNormalizados);
          setDisciplinas(disciplinasNormalizadas);
          setErrorCatalogo("");
        }
      } catch (error) {
        if (!cancelado) {
          setErrorCatalogo(error.message || "No se pudieron cargar las disciplinas.");
        }
      } finally {
        if (!cancelado) setCargandoCatalogo(false);
      }
    };

    cargarCatalogos();
    return () => {
      cancelado = true;
    };
  }, []);

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
      idDeporte: String(deporte.id),
      idDisciplina: "",
      deporte: deporte.etiqueta,
      especialidad: "",
    }));
  };

  const deporteSeleccionado = deportes.find(
    (deporte) => String(deporte.id) === String(formData.idDeporte)
  );
  const especialidades = disciplinas.filter(
    (disciplina) => String(disciplina.idDeporte) === String(formData.idDeporte)
  );

  const puedeAvanzarPaso1 =
    formData.idDeporte && formData.idDisciplina;

  const puedeAvanzarPaso2 =
    formData.nombre &&
    formData.apellido &&
    formData.dni &&
    formData.email &&
    formData.telefono;

  const puedeFinalizar =
    formData.nombre.trim() &&
    formData.apellido.trim() &&
    formData.dni.trim() &&
    formData.email.trim() &&
    formData.telefono.trim() &&
    formData.localidad.trim() &&
    formData.idDisciplina;

  const handleFinalizar = async (e) => {
    e.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setErrorGuardado("");
    try {
      const response = await apiFetch("/arbitros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          dni: formData.dni.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          localidad: formData.localidad.trim(),
          idDisciplina: Number(formData.idDisciplina),
        }),
      });

      const resultado = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resultado.error || "No se pudo guardar el árbitro.");
      }

      onArbitroCreado?.(resultado);
      onVolver?.();
    } catch (error) {
      setErrorGuardado(error.message || "No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
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

          {errorCatalogo && (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorCatalogo}
            </p>
          )}

          <div>

            <h3 className="text-lg font-semibold text-slate-200 mb-3">
              1. Selecciona el Deporte
            </h3>

            {cargandoCatalogo ? (
              <p className="text-sm text-slate-400">Cargando deportes y disciplinas...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {deportes.map((deporte) => {

                const seleccionado =
                  String(formData.idDeporte) === String(deporte.id);

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
                    {deporte.etiqueta}
                  </button>
                );
                })}
              </div>
            )}

          </div>

          {/* ESPECIALIDAD */}

          {formData.deporte && (
            <div>

              <h3 className="text-lg font-semibold text-slate-200 mb-3">
                2. Selecciona la Especialidad
              </h3>

              {especialidades.length === 0 ? (
                <p className="text-sm text-slate-400">No hay disciplinas cargadas para este deporte.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {especialidades.map((especialidad) => {

                    const seleccionado =
                      String(formData.idDisciplina) === String(especialidad.id);

                    return (
                      <button
                        key={especialidad.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({
                          ...prev,
                          idDisciplina: String(especialidad.id),
                          especialidad: especialidad.nombre,
                        }))}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          seleccionado
                            ? "border-blue-500 bg-blue-500/10 text-white font-bold"
                            : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          {especialidad.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

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

          {errorGuardado && (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorGuardado}
            </p>
          )}

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
            disabled={!puedeFinalizar || guardando}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {guardando ? "Guardando árbitro..." : "Guardar y Registrar Árbitro"}
          </button>

        )}

      </div>

    </div>
  );
};

export default ArbitroWizard;
