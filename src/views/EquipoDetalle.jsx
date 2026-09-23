import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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
                <dd className="mt-1 text-sm font-medium text-slate-800">{equipo.capitan}</dd>
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
              <p className="mt-0.5 text-sm text-slate-500">Jugadores registrados en este equipo.</p>
            </div>

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
