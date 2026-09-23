
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EquipoWizard from "../components/EquipoWizard";

export default function Equipos() {
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const equipos = [
    {
      id: 1,
      nombre: "Los Tigres",
      disciplina: "Fútbol",
      modalidad: "Fútbol 11",
      categoria: "A",
      localidad: "Rosario",
      capitan: "Juan Pérez",
      jugadores: 8,
    },
    {
      id: 2,
      nombre: "Atlético Central",
      disciplina: "Básquet",
      modalidad: "Básquet",
      categoria: "B",
      localidad: "Rosario",
      capitan: "Lucas Gómez",
      jugadores: 11,
    },
    {
      id: 3,
      nombre: "Los Halcones",
      disciplina: "Vóley",
      modalidad: "Vóley",
      categoria: "Sub 18",
      localidad: "Funes",
      capitan: "Martín López",
      jugadores: 9,
    },
    {
      id: 4,
      nombre: "Deportivo Sur",
      disciplina: "Fútbol",
      modalidad: "Fútbol 5",
      categoria: "Sub 13",
      localidad: "Villa Gobernador Gálvez",
      capitan: "Nicolás Rodríguez",
      jugadores: 7,
    },
  ];

  const equiposFiltrados = equipos.filter((equipo) => {
    const coincideBusqueda = equipo.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoria === "Todas" || equipo.categoria === categoria;

    return coincideBusqueda && coincideCategoria;
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

      {/* BUSCADOR Y FILTRO */}
      <div className="flex flex-col md:flex-row gap-3 mb-3">

        <input
          type="text"
          placeholder="Buscar equipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Todas">
            Todas las categorías
          </option>

          <option value="Sub 13">
            Sub 13
          </option>

          <option value="Sub 18">
            Sub 18
          </option>

          <option value="E">
            E
          </option>

          <option value="D">
            D
          </option>

          <option value="C">
            C
          </option>

          <option value="B">
            B
          </option>

          <option value="A">
            A
          </option>
        </select>

      </div>

      {/* CANTIDAD */}
      <p className="text-sm text-gray-500 mb-4">
        {equiposFiltrados.length} equipos encontrados
      </p>

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
                  {equipo.nombre}
                </h2>

                <p className="text-sm text-blue-600 font-medium">
                  {equipo.disciplina} · {equipo.modalidad}
                </p>

                <span className="text-sm text-gray-500">
                  Categoría {equipo.categoria}
                </span>
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
                {equipo.jugadores}
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
      {equiposFiltrados.length === 0 && (
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
              onEquipoCreado={(equipo) => {
                console.log("Equipo creado:", equipo);
                setIsWizardOpen(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
