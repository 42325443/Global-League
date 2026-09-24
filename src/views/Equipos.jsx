
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EquipoWizard from "../components/EquipoWizard";

const obtenerEquipos = async () => {
  const response = await fetch("http://localhost:3000/api/equipos");
  if (!response.ok) throw new Error("No se pudieron cargar los equipos.");

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("La respuesta de equipos no es válida.");
  return data;
};

export default function Equipos() {
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [equipos, setEquipos] = useState([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [errorEquipos, setErrorEquipos] = useState("");

  useEffect(() => {
    let cancelado = false;

    obtenerEquipos()
      .then((data) => {
        if (!cancelado) setEquipos(data);
      })
      .catch((error) => {
        if (!cancelado) setErrorEquipos(error.message || "No se pudo conectar con el servidor.");
      })
      .finally(() => {
        if (!cancelado) setCargandoEquipos(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const recargarEquipos = async () => {
    setCargandoEquipos(true);
    setErrorEquipos("");
    try {
      setEquipos(await obtenerEquipos());
    } catch (error) {
      setEquipos([]);
      setErrorEquipos(error.message || "No se pudo conectar con el servidor.");
    } finally {
      setCargandoEquipos(false);
    }
  };

  const equiposFiltrados = equipos.filter((equipo) => {
    const coincideBusqueda = (equipo.nombre || equipo.nombreEquipo || "")
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    return coincideBusqueda;
  });

  return (
    <div>

      {/* ENCABEZADO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <span className="text-sm text-lime-700 font-bold">
            Listado de equipos
          </span>

          <h1 className="text-2xl font-bold">
            Equipos
          </h1>

          <p className="text-slate-500 text-sm font-semibold mt-1">
            Administrá los equipos registrados y crea nuevos para poder anadirlos a tus futuros torneos.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          + Crear equipo
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="flex flex-col md:flex-row gap-3 mb-3">

        <input
          type="text"
          placeholder="Buscar equipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* CANTIDAD */}
      <p className="text-sm text-gray-500 mb-4">
        {cargandoEquipos ? "Cargando equipos..." : `${equiposFiltrados.length} equipos encontrados`}
      </p>

      {errorEquipos && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorEquipos}
        </p>
      )}

      {/* LISTA DE EQUIPOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {equiposFiltrados.map((equipo) => (

          <div
            key={equipo.id}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >

            {/* INFORMACIÓN PRINCIPAL */}
            <div className="flex items-center gap-3 mb-2">

              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                ⚽
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  {equipo.nombre || equipo.nombreEquipo}
                </h2>

                <p className="text-sm text-blue-600 font-medium">
                  {equipo.deporte || "Deporte sin definir"} · {equipo.disciplina || "Disciplina sin definir"}
                </p>
              </div>

            </div>

            {/* DETALLES */}
            <div className="text-sm text-gray-600 mb-5">

              <p>
                <strong>Localidad:</strong>{" "}
                {equipo.localidad}
              </p>

              <p>
                <strong>Capitán:</strong>{" "}
                {equipo.capitan}
              </p>

              <p>
                <strong>Jugadores:</strong>{" "}
                {equipo.cantidadJugadores ?? 0}
              </p>

            </div>

            {/* ACCIONES */}
            <div className="flex gap-2">

              <button
                onClick={() => navigate(`/equipos/${equipo.id}`)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Ver equipo
              </button>

              <button
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Editar
              </button>

              <button
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                Eliminar
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* SIN RESULTADOS */}
      {!cargandoEquipos && !errorEquipos && equiposFiltrados.length === 0 && (
        <div className="text-center py-12 text-gray-500">

          <p className="text-lg font-semibold">
            No se encontraron equipos
          </p>

          <p className="text-sm mt-1">
            Probá con otro nombre o categoría.
          </p>

        </div>
      )}

      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsWizardOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl">
            <EquipoWizard
              onVolver={() => setIsWizardOpen(false)}
              onEquipoCreado={() => {
                setIsWizardOpen(false);
                recargarEquipos();
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
