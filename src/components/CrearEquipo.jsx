import { useState } from "react";

function CrearEquipo() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [localidad, setLocalidad] = useState("");

  const [equipos, setEquipos] = useState([]);

  // Estados para agregar jugador
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [mostrarJugador, setMostrarJugador] = useState(false);

  const [nombreJugador, setNombreJugador] = useState("");
  const [apellidoJugador, setApellidoJugador] = useState("");
  const [dniJugador, setDniJugador] = useState("");

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
      jugadores: [],
    };

    setEquipos([...equipos, nuevoEquipo]);

      setNombre("");
      setCategoria("");
      setLocalidad("");

      setMostrarFormulario(false);

    alert("Equipo creado correctamente.");
  };

  // Abrir formulario para agregar jugador
  const abrirFormularioJugador = (equipo) => {
    setEquipoSeleccionado(equipo);

    setNombreJugador("");
    setApellidoJugador("");
    setDniJugador("");

    setMostrarJugador(true);
  };

  // Agregar jugador al equipo
  const agregarJugador = (e) => {
    e.preventDefault();

    if (
      !nombreJugador.trim() ||
      !apellidoJugador.trim() ||
      !dniJugador.trim()
    ) {
      alert("Por favor, completá todos los campos del jugador.");
      return;
    }

    const nuevoJugador = {
      id: Date.now(),
      nombre: nombreJugador.trim(),
      apellido: apellidoJugador.trim(),
      dni: dniJugador.trim(),
    };

    setEquipos(
      equipos.map((equipo) => {
        if (equipo.id === equipoSeleccionado.id) {
          return {
            ...equipo,
            jugadores: [...equipo.jugadores, nuevoJugador],
          };
        }

        return equipo;
      })
    );

    setNombreJugador("");
    setApellidoJugador("");
    setDniJugador("");

    setMostrarJugador(false);
    setEquipoSeleccionado(null);

    alert("Jugador agregado correctamente.");
  };

  return (
    <div className="p-6">

      {/* BOTÓN CREAR EQUIPO */}
      <button
        onClick={() => setMostrarFormulario(true)}
        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Crear equipo
      </button>

      {/* FORMULARIO CREAR EQUIPO */}
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
                <option value="">
                  Seleccionar categoría
                </option>

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

      {/* LISTA DE EQUIPOS */}
      {equipos.length > 0 && (
        <div className="mt-8">

          <h2 className="mb-4 text-xl font-bold">
            Equipos creados
          </h2>

          <div className="space-y-4">

            {equipos.map((equipo) => (

              <div
                key={equipo.id}
                className="rounded-lg border p-4 shadow-sm"
              >

                <h3 className="text-lg font-bold">
                  {equipo.nombre}
                </h3>

                <p>
                  Categoría: {equipo.categoria}
                </p>

                <p>
                  Localidad: {equipo.localidad}
                </p>

                {/* BOTÓN AGREGAR JUGADOR */}
                <button
                  onClick={() => abrirFormularioJugador(equipo)}
                  className="mt-4 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
                >
                  + Agregar jugador
                </button>

                {/* JUGADORES DEL EQUIPO */}
                {equipo.jugadores.length > 0 && (
                  <div className="mt-4">

                    <h4 className="font-semibold">
                      Jugadores:
                    </h4>

                    <ul className="mt-2 space-y-2">

                      {equipo.jugadores.map((jugador) => (
                        <li
                          key={jugador.id}
                          className="rounded border p-2"
                        >
                          <strong>
                            {jugador.nombre} {jugador.apellido}
                          </strong>

                          <span className="ml-2 text-gray-600">
                            DNI: {jugador.dni}
                          </span>
                        </li>
                      ))}

                    </ul>

                  </div>
                )}

              </div>

            ))}

          </div>
        </div>
      )}

      {/* FORMULARIO AGREGAR JUGADOR */}
      {mostrarJugador && equipoSeleccionado && (

        <div className="mt-6 max-w-md rounded-lg border p-6 shadow">

          <h2 className="mb-2 text-2xl font-bold">
            Agregar jugador
          </h2>

          <p className="mb-4 text-gray-600">
            Equipo:{" "}
            <strong>
              {equipoSeleccionado.nombre}
            </strong>
          </p>

          <form
            onSubmit={agregarJugador}
            className="space-y-4"
          >

            <div>
              <label className="mb-1 block font-medium">
                Nombre
              </label>

              <input
                type="text"
                value={nombreJugador}
                onChange={(e) =>
                  setNombreJugador(e.target.value)
                }
                placeholder="Ej: Lionel"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Apellido
              </label>

              <input
                type="text"
                value={apellidoJugador}
                onChange={(e) =>
                  setApellidoJugador(e.target.value)
                }
                placeholder="Ej: Messi"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                DNI
              </label>

              <input
                type="text"
                value={dniJugador}
                onChange={(e) =>
                  setDniJugador(e.target.value)
                }
                placeholder="Ej: 12345678"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div className="flex gap-3">

              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
              >
                Agregar jugador
              </button>

              <button
                type="button"
                onClick={() => {
                  setMostrarJugador(false);
                  setEquipoSeleccionado(null);
                }}
                className="rounded-lg bg-gray-400 px-4 py-2 font-semibold text-white hover:bg-gray-500"
              >
                Cancelar
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}

export default CrearEquipo;