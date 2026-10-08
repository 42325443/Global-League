import { useEffect, useState } from "react";
import ArbitroWizard from "../components/ArbitroWizard";
import { apiFetch } from "../lib/api";

const etiquetaDeporte = (nombre = "") => {
  const normalizado = nombre.trim().toLocaleLowerCase();
  if (normalizado === "basketball") return "Básquet";
  if (normalizado === "volleyball") return "Vóley";
  return nombre;
};

export default function Arbitros() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [arbitros, setArbitros] = useState([]);
  const [cargandoArbitros, setCargandoArbitros] = useState(true);
  const [errorArbitros, setErrorArbitros] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [deporteFiltro, setDeporteFiltro] = useState("Todos");
  const [arbitroSeleccionado, setArbitroSeleccionado] = useState(null);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");

  const deportes = ["Todos", "Fútbol", "Básquet", "Vóley"];

  useEffect(() => {
    let cancelado = false;

    const cargarArbitros = async () => {
      try {
        const response = await apiFetch("/arbitros");
        const resultado = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(resultado.error || "No se pudieron cargar los árbitros.");
        }
        if (!Array.isArray(resultado)) {
          throw new Error("La respuesta de árbitros no es válida.");
        }
        if (!cancelado) {
          setArbitros(resultado);
          setErrorArbitros("");
        }
      } catch (error) {
        if (!cancelado) {
          setErrorArbitros(error.message || "No se pudo conectar con el servidor.");
        }
      } finally {
        if (!cancelado) setCargandoArbitros(false);
      }
    };

    cargarArbitros();
    return () => {
      cancelado = true;
    };
  }, []);

  const agregarArbitro = (arbitro) => {
    setArbitros((prev) => [arbitro, ...prev]);
    setErrorArbitros("");
  };

  const cambiarEstadoArbitro = async () => {
    if (!arbitroSeleccionado || actualizandoEstado) return;

    const nuevoEstado = arbitroSeleccionado.estado === "Activo" ? "Inactivo" : "Activo";
    setActualizandoEstado(true);
    setErrorEstado("");

    try {
      const response = await apiFetch(`/arbitros/${arbitroSeleccionado.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const resultado = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resultado.error || "No se pudo actualizar el estado del árbitro.");
      }

      const actualizarArbitro = (arbitro) =>
        arbitro.id === resultado.id ? { ...arbitro, estado: resultado.estado } : arbitro;

      setArbitros((prev) => prev.map(actualizarArbitro));
      setArbitroSeleccionado((prev) =>
        prev?.id === resultado.id ? { ...prev, estado: resultado.estado } : prev
      );
    } catch (error) {
      setErrorEstado(error.message || "No se pudo actualizar el estado del árbitro.");
    } finally {
      setActualizandoEstado(false);
    }
  };

  const arbitrosFiltrados = arbitros.filter((arbitro) => {
    const nombreCompleto =
      `${arbitro.nombre} ${arbitro.apellido}`.toLowerCase();

    const coincideBusqueda =
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      arbitro.dni.includes(busqueda);

    const coincideDeporte =
      deporteFiltro === "Todos" ||
      etiquetaDeporte(arbitro.deporte) === deporteFiltro;

    return coincideBusqueda && coincideDeporte;
  });

  return (
    <div>
      {/* ENCABEZADO */}
      <span className="text-sm text-lime-700 font-bold">
        Listado de Árbitros
      </span>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Árbitros
          </h1>

          <p className="text-slate-500 text-sm font-semibold mt-1">
            Gestioná los árbitros registrados en Global League.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
        >
          + Crear árbitro
        </button>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">
            Árbitros registrados
          </p>

          <p className="text-3xl font-bold text-slate-800 mt-1">
            {arbitros.length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">
            Activos
          </p>

          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {arbitros.filter(
              (arbitro) => arbitro.estado === "Activo"
            ).length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">
            Deportes
          </p>

          <p className="text-3xl font-bold text-blue-600 mt-1">
            {new Set(arbitros.map((arbitro) => etiquetaDeporte(arbitro.deporte)).filter(Boolean)).size}
          </p>
        </div>

      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* BUSCADOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Buscar árbitro
            </label>

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, apellido o DNI..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* FILTRO DEPORTE */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Deporte
            </label>

            <select
              value={deporteFiltro}
              onChange={(e) => setDeporteFiltro(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
            >
              {deportes.map((deporte) => (
                <option key={deporte} value={deporte}>
                  {deporte}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* LISTADO */}
      {errorArbitros && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorArbitros}
        </p>
      )}

      {cargandoArbitros ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center text-sm text-slate-500">
          Cargando árbitros...
        </div>
      ) : arbitrosFiltrados.length === 0 ? (

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">

          {arbitros.length === 0 ? (
            <>
              <div className="text-4xl mb-3">
                ⚖️
              </div>

              <h2 className="text-lg font-bold text-slate-700">
                Todavía no hay árbitros registrados
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Creá el primer árbitro para comenzar a gestionar el módulo.
              </p>

              <button
                onClick={() => setIsWizardOpen(true)}
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm"
              >
                + Crear primer árbitro
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-700">
                No se encontraron árbitros
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Probá modificando la búsqueda o el filtro.
              </p>
            </>
          )}

        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {arbitrosFiltrados.map((arbitro) => (

            <div
              key={arbitro.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition"
            >

              {/* CABECERA CARD */}
              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    {arbitro.nombre.charAt(0)}
                    {arbitro.apellido.charAt(0)}
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-800">
                      {arbitro.nombre} {arbitro.apellido}
                    </h2>

                    <p className="text-xs text-slate-500">
                      DNI: {arbitro.dni}
                    </p>
                  </div>

                </div>

                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  arbitro.estado === "Activo"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {arbitro.estado}
                </span>

              </div>

              {/* INFORMACIÓN */}
              <div className="mt-5 space-y-2">

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Deporte
                  </span>

                  <span className="font-semibold text-slate-700">
                    {etiquetaDeporte(arbitro.deporte)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Especialidad
                  </span>

                  <span className="font-semibold text-slate-700 text-right">
                    {arbitro.especialidad}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Localidad
                  </span>

                  <span className="font-semibold text-slate-700">
                    {arbitro.localidad}
                  </span>
                </div>

              </div>

              {/* BOTÓN */}
              <button
                onClick={() => setArbitroSeleccionado(arbitro)}
                className="w-full mt-5 border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-sm font-semibold transition"
              >
                Ver perfil
              </button>

            </div>

          ))}

        </div>

      )}

      {/* ================================================= */}
      {/* MODAL CREAR ÁRBITRO */}
      {/* ================================================= */}

      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">

          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsWizardOpen(false)}
          />

          <div className="relative z-10 w-full max-w-3xl">

            <ArbitroWizard
              onVolver={() => setIsWizardOpen(false)}
              onArbitroCreado={agregarArbitro}
            />

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* MODAL PERFIL */}
      {/* ================================================= */}

      {arbitroSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setArbitroSeleccionado(null)}
          />

          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">

              <div className="flex items-center gap-3">

                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                  {arbitroSeleccionado.nombre.charAt(0)}
                  {arbitroSeleccionado.apellido.charAt(0)}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {arbitroSeleccionado.nombre}{" "}
                    {arbitroSeleccionado.apellido}
                  </h2>

                  <p className="text-sm text-slate-500">
                    Árbitro de {etiquetaDeporte(arbitroSeleccionado.deporte)}
                  </p>
                </div>

              </div>

              <button
                onClick={() => setArbitroSeleccionado(null)}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>

            </div>

            {/* ESTADO */}
            <div className="mb-5">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                arbitroSeleccionado.estado === "Activo"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}>
                ● {arbitroSeleccionado.estado}
              </span>
            </div>

            {/* DATOS */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">

              <div className="flex justify-between p-4 border-b border-slate-200">
                <span className="text-sm text-slate-500">
                  DNI
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  {arbitroSeleccionado.dni}
                </span>
              </div>

              <div className="flex justify-between p-4 border-b border-slate-200">
                <span className="text-sm text-slate-500">
                  Email
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  {arbitroSeleccionado.email}
                </span>
              </div>

              <div className="flex justify-between p-4 border-b border-slate-200">
                <span className="text-sm text-slate-500">
                  Teléfono
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  {arbitroSeleccionado.telefono}
                </span>
              </div>

              <div className="flex justify-between p-4 border-b border-slate-200">
                <span className="text-sm text-slate-500">
                  Localidad
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  {arbitroSeleccionado.localidad}
                </span>
              </div>

              <div className="flex justify-between p-4 border-b border-slate-200">
                <span className="text-sm text-slate-500">
                  Deporte
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  {etiquetaDeporte(arbitroSeleccionado.deporte)}
                </span>
              </div>

              <div className="flex justify-between p-4">
                <span className="text-sm text-slate-500">
                  Especialidad
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  {arbitroSeleccionado.especialidad}
                </span>
              </div>

            </div>

            {errorEstado && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorEstado}
              </p>
            )}

            {/* ACCIONES */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => {
                  setArbitroSeleccionado(null);
                  setErrorEstado("");
                }}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                onClick={cambiarEstadoArbitro}
                disabled={actualizandoEstado}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60 ${
                  arbitroSeleccionado.estado === "Activo"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actualizandoEstado
                  ? "Actualizando..."
                  : arbitroSeleccionado.estado === "Activo"
                    ? "Desactivar árbitro"
                    : "Reactivar árbitro"}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
