import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [nuevoJugador, setNuevoJugador] = useState({ nombre: "", apellido: "", dni: "" });
  const [agregandoJugador, setAgregandoJugador] = useState(false);
  const [errorPlantel, setErrorPlantel] = useState("");
  const [mensajePlantel, setMensajePlantel] = useState("");
  const jugadorCapitan = equipo?.jugadores?.find((jugador) => jugador.esCapitan);

  const recargarEquipo = async () => {
    const response = await fetch(`http://localhost:3000/api/equipos/${id}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No se pudo cargar el equipo.");
    setEquipo(data);
  };

  useEffect(() => {
    let cancelado = false;

    fetch(`http://localhost:3000/api/equipos/${id}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "No se pudo cargar el equipo.");
        return data;
      })
      .then((data) => {
        if (!cancelado) setEquipo(data);
      })
      .catch((fetchError) => {
        if (!cancelado) setError(fetchError.message || "No se pudo conectar con el servidor.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  const agregarJugador = async (evento) => {
    evento.preventDefault();
    if (agregandoJugador) return;

    setAgregandoJugador(true);
    setErrorPlantel("");
    setMensajePlantel("");
    try {
      const response = await fetch(`http://localhost:3000/api/equipos/${id}/jugadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoJugador),
      });
      const resultado = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resultado.error || "No se pudo agregar el jugador.");

      setNuevoJugador({ nombre: "", apellido: "", dni: "" });
      await recargarEquipo();
      setMensajePlantel("Jugador agregado al plantel.");
    } catch (saveError) {
      setErrorPlantel(saveError.message || "No se pudo conectar con el servidor.");
    } finally {
      setAgregandoJugador(false);
    }
  };

  const cambiarCapitan = async (evento) => {
    const idJugador = Number(evento.target.value);
    if (!idJugador) return;

    setErrorPlantel("");
    setMensajePlantel("");
    try {
      const response = await fetch(`http://localhost:3000/api/equipos/${id}/capitan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idJugador }),
      });
      const resultado = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resultado.error || "No se pudo cambiar el capitán.");
      await recargarEquipo();
      setMensajePlantel("Capitán actualizado.");
    } catch (saveError) {
      setErrorPlantel(saveError.message || "No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="w-full min-w-0">
      <button
        type="button"
        onClick={() => navigate("/equipos")}
        className="mb-5 text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        ← Volver a Equipos
      </button>

      {cargando ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Cargando equipo...
        </p>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </p>
      ) : equipo && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="text-sm font-bold text-lime-700">Equipo</span>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {equipo.nombre || equipo.nombreEquipo}
            </h1>
            <p className="mt-1 text-sm font-medium text-blue-700">
              {equipo.deporte} · {equipo.disciplina}
            </p>

            <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Localidad</dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">{equipo.localidad}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Capitán</dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {jugadorCapitan
                    ? `${jugadorCapitan.nombre} ${jugadorCapitan.apellido}`
                    : equipo.capitan
                      ? `${equipo.capitan} (pendiente de asociar al plantel)`
                      : "Sin asignar"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jugadores</dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">{equipo.cantidadJugadores}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-900">Plantel</h2>
              <p className="mt-0.5 text-sm text-slate-500">Agregá jugadores y elegí al capitán entre los integrantes.</p>
            </div>

            <form onSubmit={agregarJugador} className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="text"
                placeholder="Nombre"
                value={nuevoJugador.nombre}
                onChange={(evento) => setNuevoJugador((previo) => ({ ...previo, nombre: evento.target.value }))}
                maxLength={80}
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Apellido"
                value={nuevoJugador.apellido}
                onChange={(evento) => setNuevoJugador((previo) => ({ ...previo, apellido: evento.target.value }))}
                maxLength={80}
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="DNI (opcional)"
                value={nuevoJugador.dni}
                onChange={(evento) => setNuevoJugador((previo) => ({ ...previo, dni: evento.target.value }))}
                maxLength={20}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button type="submit" disabled={agregandoJugador} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {agregandoJugador ? "Agregando..." : "+ Agregar jugador"}
              </button>
            </form>

            {equipo.jugadores?.length > 0 && (
              <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                <label htmlFor="equipo-capitan" className="text-sm font-semibold text-slate-700">Capitán del equipo</label>
                <select
                  id="equipo-capitan"
                  value={jugadorCapitan?.idJugador || ""}
                  onChange={cambiarCapitan}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none sm:ml-auto sm:min-w-64"
                >
                  <option value="">Seleccioná un jugador</option>
                  {equipo.jugadores.map((jugador) => (
                    <option key={jugador.idJugador} value={jugador.idJugador}>{jugador.nombre} {jugador.apellido}</option>
                  ))}
                </select>
              </div>
            )}

            {(errorPlantel || mensajePlantel) && (
              <p role={errorPlantel ? "alert" : "status"} className={`mx-5 mt-4 rounded-lg px-3 py-2 text-sm ${errorPlantel ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {errorPlantel || mensajePlantel}
              </p>
            )}

            {equipo.jugadores?.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {equipo.jugadores.map((jugador, index) => (
                  <li key={jugador.idJugador} className="flex items-center gap-3 px-6 py-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {jugador.nombre} {jugador.apellido}
                        {jugador.esCapitan && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">Capitán</span>}
                      </p>
                      {jugador.dni && <p className="mt-0.5 text-xs text-slate-500">DNI: {jugador.dni}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-8 text-center text-sm text-slate-500">
                Este equipo todavía no tiene jugadores registrados.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
