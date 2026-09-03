import { useState } from "react";
import { useNavigate } from "react-router-dom";

const disciplinas = {
  futbol: {
    nombre: "Fútbol",
    modalidades: [
      "Fútbol 5",
      "Fútbol 7",
      "Fútbol 9",
      "Fútbol 11",
    ],
  },

  basquet: {
    nombre: "Básquet",
    modalidades: [
      "Básquet",
    ],
  },

  voley: {
    nombre: "Vóley",
    modalidades: [
      "Vóley",
    ],
  },
};

const categorias = [
  "Sub 13",
  "Sub 18",
  "E",
  "D",
  "C",
  "B",
  "A",
];

export default function CrearEquipo() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [categoria, setCategoria] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [capitan, setCapitan] = useState("");

  const handleDisciplinaChange = (e) => {
    setDisciplina(e.target.value);
    setModalidad("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const equiposGuardados =
      JSON.parse(localStorage.getItem("equipos")) || [];

    const nuevoEquipo = {
      id: Date.now(),
      nombre,
      disciplina: disciplinas[disciplina].nombre,
      modalidad,
      categoria,
      localidad,
      capitan,
      jugadores: 0,
    };

    const equiposActualizados = [
      ...equiposGuardados,
      nuevoEquipo,
    ];

    localStorage.setItem(
      "equipos",
      JSON.stringify(equiposActualizados)
    );

    alert("Equipo creado correctamente");

    navigate("/equipos");
  };

  return (
    <div className="p-2 max-w-3xl min-w-full mx-auto">

      <div className="mb-3">
        <h1 className="text-2xl font-bold">
          Crear equipo
        </h1>

        <p className="text-slate-500 text-sm font-semibold mt-1">
          Completá los datos del nuevo equipo.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-4"
      >

        {/* Nombre */}
        <div className="mb-5">
          <label className="block font-semibold mb-2">
            Nombre del equipo
          </label>

          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Los Tigres"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        {/* Disciplina */}
        <div className="mb-5">
          <label className="block font-semibold mb-2">
            Disciplina
          </label>

          <select
            value={disciplina}
            onChange={handleDisciplinaChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">
              Seleccioná una disciplina
            </option>

            {Object.entries(disciplinas).map(
              ([clave, disciplina]) => (
                <option key={clave} value={clave}>
                  {disciplina.nombre}
                </option>
              )
            )}
          </select>
        </div>

        {/* Modalidad */}
        <div className="mb-5">
          <label className="block font-semibold mb-2">
            Modalidad
          </label>

          <select
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            required
            disabled={!disciplina}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100"
          >
            <option value="">
              {disciplina
                ? "Seleccioná una modalidad"
                : "Primero seleccioná una disciplina"}
            </option>

            {disciplina &&
              disciplinas[disciplina].modalidades.map(
                (modalidad) => (
                  <option
                    key={modalidad}
                    value={modalidad}
                  >
                    {modalidad}
                  </option>
                )
              )}
          </select>
        </div>

        {/* Categoría */}
        <div className="mb-5">
          <label className="block font-semibold mb-2">
            Categoría
          </label>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">
              Seleccioná una categoría
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

        {/* Localidad */}
        <div className="mb-5">
          <label className="block font-semibold mb-2">
            Localidad
          </label>

          <input
            type="text"
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value)}
            placeholder="Ej: Rosario"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        {/* Capitán */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Capitán
          </label>

          <input
            type="text"
            value={capitan}
            onChange={(e) => setCapitan(e.target.value)}
            placeholder="Ej: Juan Pérez"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3">

          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700"
          >
            Crear equipo
          </button>

          <button
            type="button"
            onClick={() => navigate("/equipos")}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>

        </div>

      </form>
    </div>
  );
}