import { useState } from "react";

function CrearEquipo() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [localidad, setLocalidad] = useState("");

  const [equipos, setEquipos] = useState([]);

  const crearEquipo = (e) => {
    e.preventDefault();

    if (!nombre.trim() || !categoria || !localidad.trim()) {
      alert("Por favor, completá todos los campos.");
      return;
    }

    const nuevoEquipo = {
      id: Date.now(),
      nombre: nombre.trim(),
      categoria,
      localidad: localidad.trim(),
    };

    setEquipos([...equipos, nuevoEquipo]);

    // Limpiar formulario
    setNombre("");
    setCategoria("");
    setLocalidad("");

    // Ocultar formulario
    setMostrarFormulario(false);

    alert("Equipo creado correctamente.");
  };

  return (
    <div className="p-6">
      <button
        onClick={() => setMostrarFormulario(true)}
        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Crear equipo
      </button>

      {mostrarFormulario && (
        <div className="mt-6 max-w-md rounded-lg border p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">
            Crear equipo
          </h2>

          <form onSubmit={crearEquipo} className="space-y-4">

            <div>
              <label className="mb-1 block font-medium">
                Nombre del equipo
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Los Pumas"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Categoría
              </label>

              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">Seleccionar categoría</option>
                <option value="Sub-15">Sub-15</option>
                <option value="Sub-17">Sub-17</option>
                <option value="Sub-20">Sub-20</option>
                <option value="Primera">Primera</option>
                <option value="Veteranos">Veteranos</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Localidad
              </label>

              <input
                type="text"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                placeholder="Ej: Paraná"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div className="flex gap-3">

              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
              >
                Guardar equipo
              </button>

              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="rounded-lg bg-gray-400 px-4 py-2 font-semibold text-white hover:bg-gray-500"
              >
                Cancelar
              </button>

            </div>
          </form>
        </div>
      )}

      {equipos.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold">
            Equipos creados
          </h2>

          <div className="space-y-3">
            {equipos.map((equipo) => (
              <div
                key={equipo.id}
                className="rounded-lg border p-4"
              >
                <h3 className="font-bold">
                  {equipo.nombre}
                </h3>

                <p>
                  Categoría: {equipo.categoria}
                </p>

                <p>
                  Localidad: {equipo.localidad}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CrearEquipo;