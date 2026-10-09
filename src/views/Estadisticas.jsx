
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const OPCIONES_DESEMPATE = [
  { valor: "Diferencia", nombre: "Diferencia de marcador" },
  { valor: "MarcadorAFavor", nombre: "Marcador a favor" },
  { valor: "ResultadoDirecto", nombre: "Resultado entre equipos empatados" },
  { valor: "FairPlay", nombre: "Fair play (menos tarjetas)" },
];
const CRITERIOS_PREDETERMINADOS = ["Diferencia", "MarcadorAFavor", "ResultadoDirecto"];

export default function Estadisticas() {
  const [torneos, setTorneos] = useState([]);
  const [datos, setDatos] = useState([]);
  const [partidosCerrados, setPartidosCerrados] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [torneoFiltro, setTorneoFiltro] = useState("Todos");
  const [deporteFiltro, setDeporteFiltro] = useState("Todos");
  const [detalleTorneo, setDetalleTorneo] = useState(null);
  const [errorDetalleTorneo, setErrorDetalleTorneo] = useState(null);
  const [criteriosDesempate, setCriteriosDesempate] = useState(CRITERIOS_PREDETERMINADOS);
  const [guardandoCriterios, setGuardandoCriterios] = useState(false);
  const [mensajeCriterios, setMensajeCriterios] = useState("");

  const torneoSeleccionado = torneos.find((torneo) => String(torneo.id) === torneoFiltro) || null;
  const esTorneoEliminatorio = String(torneoSeleccionado?.modalidad || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("elimin");
  const detalleTorneoActual = Number(detalleTorneo?.torneoId) === Number(torneoSeleccionado?.id)
    ? detalleTorneo
    : null;
  const cargandoDetalleTorneo = Boolean(torneoSeleccionado && !detalleTorneoActual
    && Number(errorDetalleTorneo?.id) !== Number(torneoSeleccionado.id));
  const errorDetalleActual = Number(errorDetalleTorneo?.id) === Number(torneoSeleccionado?.id)
    ? errorDetalleTorneo.mensaje
    : "";

  useEffect(() => {
    let cancelado = false;

    const cargarEstadisticas = async () => {
      try {
        const response = await apiFetch("/estadisticas");
        const resultado = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(resultado.error || "No se pudieron cargar las estadísticas.");
        }
        if (!Array.isArray(resultado.estadisticas) || !Array.isArray(resultado.torneos)) {
          throw new Error("La respuesta de estadísticas no tiene un formato válido.");
        }
        if (!cancelado) {
          setDatos(resultado.estadisticas);
          setTorneos(resultado.torneos);
          setPartidosCerrados(Array.isArray(resultado.partidosCerrados) ? resultado.partidosCerrados : []);
          setDestacados(Array.isArray(resultado.destacados) ? resultado.destacados : []);
          setError("");
        }
      } catch (fetchError) {
        if (!cancelado) setError(fetchError.message || "No se pudieron cargar las estadísticas.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarEstadisticas();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!torneoSeleccionado) return undefined;

    let cancelado = false;

    const cargarDetalle = async () => {
      try {
        if (esTorneoEliminatorio) {
          const response = await apiFetch(`/torneos/${torneoSeleccionado.id}/partidos`);
          const partidos = await response.json().catch(() => []);
          if (!response.ok) throw new Error(partidos.error || "No se pudo cargar el bracket.");
          if (!cancelado) setDetalleTorneo({ torneoId: Number(torneoSeleccionado.id), partidos: Array.isArray(partidos) ? partidos : [] });
          return;
        }

        const response = await apiFetch(`/torneos/${torneoSeleccionado.id}/posiciones`);
        const resultado = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(resultado.error || "No se pudo cargar la tabla de posiciones.");
        if (!cancelado) {
          setDetalleTorneo({ torneoId: Number(torneoSeleccionado.id), posiciones: Array.isArray(resultado.posiciones) ? resultado.posiciones : [], torneo: resultado.torneo });
          setCriteriosDesempate(
            Array.isArray(resultado.criteriosDesempate) && resultado.criteriosDesempate.length === 3
              ? resultado.criteriosDesempate
              : CRITERIOS_PREDETERMINADOS
          );
        }
      } catch (fetchError) {
        if (!cancelado) setErrorDetalleTorneo({ id: Number(torneoSeleccionado.id), mensaje: fetchError.message || "No se pudo cargar el detalle del torneo." });
      }
    };

    cargarDetalle();
    return () => { cancelado = true; };
  }, [torneoSeleccionado, esTorneoEliminatorio]);

  const guardarCriteriosDesempate = async () => {
    if (!torneoSeleccionado || guardandoCriterios || new Set(criteriosDesempate).size !== 3) return;
    setGuardandoCriterios(true);
    setErrorDetalleTorneo(null);
    setMensajeCriterios("");
    try {
      const response = await apiFetch(`/torneos/${torneoSeleccionado.id}/criterios-desempate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteriosDesempate }),
      });
      const resultado = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resultado.error || "No se pudo guardar el orden de desempate.");

      const posicionesResponse = await apiFetch(`/torneos/${torneoSeleccionado.id}/posiciones`);
      const posicionesResultado = await posicionesResponse.json().catch(() => ({}));
      if (!posicionesResponse.ok) throw new Error(posicionesResultado.error || "Se guardó el orden, pero no se pudo actualizar la tabla.");
      setDetalleTorneo({ torneoId: Number(torneoSeleccionado.id), posiciones: posicionesResultado.posiciones || [], torneo: posicionesResultado.torneo });
      setCriteriosDesempate(posicionesResultado.criteriosDesempate || criteriosDesempate);
      setMensajeCriterios(resultado.message || "Orden de desempate actualizado.");
    } catch (saveError) {
      setErrorDetalleTorneo({ id: Number(torneoSeleccionado.id), mensaje: saveError.message || "No se pudo guardar el orden de desempate." });
    } finally {
      setGuardandoCriterios(false);
    }
  };

  const partidosPorRonda = useMemo(() => {
    const grupos = new Map();
    (detalleTorneoActual?.partidos || []).forEach((partido) => {
      const nombre = partido.nombreRonda || `Jornada ${partido.jornada}`;
      if (!grupos.has(nombre)) grupos.set(nombre, []);
      grupos.get(nombre).push(partido);
    });
    return [...grupos.entries()].map(([nombre, partidos]) => ({ nombre, partidos }));
  }, [detalleTorneoActual]);

  const nombreEquipoBracket = (partido, lado) => {
    const nombre = lado === "local" ? partido.equipoLocal : partido.equipoVisitante;
    if (nombre) return nombre;
    if (partido.estado === "Pase libre" && lado === "visitante") return "Pase libre";
    const idOrigen = lado === "local" ? partido.idPartidoOrigenLocal : partido.idPartidoOrigenVisitante;
    const origen = (detalleTorneoActual?.partidos || []).find((item) => Number(item.idPartido) === Number(idOrigen));
    if (!origen) return "Por definir";
    return `Ganador de ${origen.nombreRonda || `Ronda ${origen.jornada}`} #${origen.numeroPartido}`;
  };

  const deportes = useMemo(() => [
    "Todos",
    ...new Set(datos.map((item) => item.deporte).filter(Boolean))
  ], [datos]);

  const datosFiltrados = useMemo(() => {
    return datos.filter((item) => {
      const coincideTorneo =
        torneoFiltro === "Todos" ||
        String(item.torneoId) === torneoFiltro;

      const coincideDeporte =
        deporteFiltro === "Todos" ||
        item.deporte === deporteFiltro;

      return coincideTorneo && coincideDeporte;
    });
  }, [datos, torneoFiltro, deporteFiltro]);

  const datosOrdenados = useMemo(() => {
    return [...datosFiltrados].sort((a, b) => (
      a.torneo.localeCompare(b.torneo)
      || a.posicion - b.posicion
      || a.equipo.localeCompare(b.equipo)
    ));
  }, [datosFiltrados]);

  const partidosFiltrados = partidosCerrados.filter((partido) => (
    (torneoFiltro === "Todos" || String(partido.torneoId) === torneoFiltro)
    && (deporteFiltro === "Todos" || partido.deporte === deporteFiltro)
  ));
  const partidosJugados = partidosFiltrados.length;
  const marcadoresTotales = partidosFiltrados.reduce(
    (total, partido) => total + partido.marcadorLocal + partido.marcadorVisitante,
    0
  );
  const equipos = new Set(datosFiltrados.map((item) => item.equipoId)).size;
  const tipoPuntuacionFiltro = new Set(
    datosFiltrados.map((item) => item.tipoPuntuacion).filter(Boolean)
  );
  const puntuacionHomogenea = tipoPuntuacionFiltro.size <= 1;
  const etiquetaMarcador = puntuacionHomogenea && tipoPuntuacionFiltro.size === 1
    ? `${[...tipoPuntuacionFiltro][0]} acumulados`
    : "Marcadores por deporte";
  const marcadoresAnotados = puntuacionHomogenea ? marcadoresTotales : "—";
  const promedioMarcador = puntuacionHomogenea && partidosJugados > 0
    ? (marcadoresTotales / partidosJugados).toFixed(1)
    : puntuacionHomogenea ? "0.0" : "—";
  const goleadoresFiltrados = destacados
    .filter((jugador) => (
      (torneoFiltro === "Todos" || String(jugador.torneoId) === torneoFiltro)
      && (deporteFiltro === "Todos" || jugador.deporte === deporteFiltro)
    ))
    .sort((a, b) => b.anotaciones - a.anotaciones || b.asistencias - a.asistencias || a.jugador.localeCompare(b.jugador))
    .slice(0, 5);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* ENCABEZADO */}
      {/* ================================================= */}

      <div>
        <span className="text-sm text-lime-700 font-bold">
          Rendimiento deportivo
        </span>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Estadísticas
            </h1>

            <p className="text-slate-500 text-sm font-semibold mt-1">
              Consultá resultados cerrados y el rendimiento de tus equipos.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Cargando estadísticas...
        </div>
      )}

      {/* ================================================= */}
      {/* FILTROS */}
      {/* ================================================= */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold">
              ⚙
            </span>
          </div>

          <div>
            <h2 className="font-bold text-slate-800">
              Filtros
            </h2>

            <p className="text-xs text-slate-500">
              Seleccioná el torneo y deporte que querés consultar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* TORNEO */}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Torneo
            </label>

            <select
              value={torneoFiltro}
              onChange={(e) => {
                setTorneoFiltro(e.target.value);
                const seleccionado = torneos.find((torneo) => String(torneo.id) === e.target.value);
                setDeporteFiltro(seleccionado?.deporte || "Todos");
                setMensajeCriterios("");
                setCriteriosDesempate(CRITERIOS_PREDETERMINADOS);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="Todos">Todos los torneos</option>
              {torneos.map((torneo) => (
                <option key={torneo.id} value={String(torneo.id)}>
                  {torneo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* DEPORTE */}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Deporte
            </label>

            <select
              value={deporteFiltro}
              onChange={(e) => setDeporteFiltro(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
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

      {/* ================================================= */}
      {/* RESUMEN GENERAL */}
      {/* ================================================= */}

      <div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Resumen general
          </h2>

          <span className="text-xs text-slate-500">
            Datos según filtros seleccionados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* EQUIPOS */}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium">
              Equipos
            </p>

            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold text-slate-800">
                {equipos}
              </p>

              <span className="text-2xl">
                🛡️
              </span>
            </div>
          </div>

          {/* PARTIDOS */}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium">
              Partidos jugados
            </p>

            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold text-blue-600">
                {partidosJugados}
              </p>

              <span className="text-2xl">
                ⚽
              </span>
            </div>
          </div>

          {/* GOLES */}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium">
              {etiquetaMarcador}
            </p>

            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold text-emerald-600">
                {marcadoresAnotados}
              </p>

              <span className="text-2xl">
                🎯
              </span>
            </div>
          </div>

          {/* PROMEDIO */}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium">
              Promedio por partido
            </p>

            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold text-violet-600">
                {promedioMarcador}
              </p>

              <span className="text-2xl">
                📈
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ================================================= */}
      {/* TABLA DE POSICIONES */}
      {/* ================================================= */}

      {torneoFiltro === "Todos" ? (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-5 border-b border-slate-200">

          <h2 className="text-lg font-bold text-slate-800">
            Rendimiento por equipo
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Datos calculados por torneo a partir de encuentros cerrados.
          </p>

        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {datosFiltrados.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              {cargando ? "Cargando equipos..." : "No hay equipos para los filtros seleccionados."}
            </p>
          ) : datosOrdenados.map((equipo) => (
            <article key={equipo.id} className="min-w-0 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-extrabold text-slate-600">
                  {equipo.posicion}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-bold leading-5 text-slate-800">{equipo.equipo}</h3>
                  <p className="mt-0.5 break-words text-xs leading-4 text-slate-500">{equipo.torneo} · {equipo.deporte}</p>
                </div>
                <div className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-right">
                  <span className="block text-[10px] font-bold uppercase leading-3 text-blue-600">PTS</span>
                  <span className="text-sm font-extrabold leading-4 text-blue-800">{equipo.puntos}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                {[
                  ["PJ", equipo.pj], ["PG", equipo.pg], ["PE", equipo.pe], ["PP", equipo.pp]
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="rounded-lg bg-slate-50 px-1 py-2">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{etiqueta}</span>
                    <span className={`mt-0.5 block text-sm font-bold ${etiqueta === "PG" ? "text-emerald-600" : etiqueta === "PP" ? "text-rose-500" : "text-slate-700"}`}>{valor}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-500">A favor</span><strong className="text-slate-700">{equipo.gf}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-500">En contra</span><strong className="text-slate-700">{equipo.gc}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">

          <table className="w-full text-sm">

            <thead className="bg-slate-50 border-b border-slate-200">

              <tr>
                <th className="text-left px-5 py-3 font-bold text-slate-500">
                  #
                </th>

                <th className="text-left px-3 py-3 font-bold text-slate-500">
                  Equipo
                </th>

                <th className="text-center px-3 py-3 font-bold text-slate-500">
                  PJ
                </th>

                <th className="text-center px-3 py-3 font-bold text-slate-500">
                  PG
                </th>

                <th className="text-center px-3 py-3 font-bold text-slate-500">
                  PE
                </th>

                <th className="text-center px-3 py-3 font-bold text-slate-500">
                  PP
                </th>

                <th className="text-center px-3 py-3 font-bold text-slate-500">
                  A favor
                </th>

                <th className="text-center px-3 py-3 font-bold text-slate-500">
                  En contra
                </th>

                <th className="text-center px-5 py-3 font-bold text-slate-500">
                  PTS
                </th>
              </tr>

            </thead>

            <tbody>

              {datosFiltrados.length === 0 ? (

                <tr>
                  <td
                    colSpan="9"
                    className="text-center py-10 text-slate-500"
                  >
                    {cargando ? "Cargando equipos..." : "No hay equipos para los filtros seleccionados."}
                  </td>
                </tr>

              ) : (

                datosOrdenados
                  .map((equipo) => (

                    <tr
                      key={equipo.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >

                      <td className="px-5 py-4 font-bold text-slate-500">
                        {equipo.posicion}
                      </td>

                      <td className="px-3 py-4">
                        <span className="font-bold text-slate-800">
                          {equipo.equipo}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {equipo.torneo} · {equipo.deporte}
                        </span>
                      </td>

                      <td className="text-center px-3 py-4 text-slate-600">
                        {equipo.pj}
                      </td>

                      <td className="text-center px-3 py-4 text-emerald-600 font-semibold">
                        {equipo.pg}
                      </td>

                      <td className="text-center px-3 py-4 text-slate-600">
                        {equipo.pe}
                      </td>

                      <td className="text-center px-3 py-4 text-red-500">
                        {equipo.pp}
                      </td>

                      <td className="text-center px-3 py-4 text-slate-600">
                        {equipo.gf}
                      </td>

                      <td className="text-center px-3 py-4 text-slate-600">
                        {equipo.gc}
                      </td>

                      <td className="text-center px-5 py-4">
                        <span className="inline-flex items-center justify-center min-w-10 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">
                          {equipo.puntos}
                        </span>
                      </td>

                    </tr>

                  ))

              )}

            </tbody>

          </table>

        </div>
      </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-lime-700">{esTorneoEliminatorio ? "Cuadro eliminatorio" : "Tabla del torneo"}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-800">{torneoSeleccionado?.nombre}</h2>
            <p className="mt-1 text-xs text-slate-500">{torneoSeleccionado?.deporte} · {torneoSeleccionado?.disciplina} · {torneoSeleccionado?.modalidad}</p>
          </header>

          {errorDetalleActual && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorDetalleActual}</p>}
          {errorDetalleActual ? null : cargandoDetalleTorneo ? (
            <p className="p-8 text-center text-sm text-slate-500">Cargando {esTorneoEliminatorio ? "el bracket" : "la tabla"}…</p>
          ) : esTorneoEliminatorio ? (
            partidosPorRonda.length ? (
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-flow-col md:auto-cols-[minmax(240px,1fr)] md:overflow-x-auto">
                {partidosPorRonda.map((ronda) => (
                  <section key={ronda.nombre} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{ronda.nombre}</h3>
                    <div className="space-y-2">
                      {ronda.partidos.map((partido) => (
                        <article key={partido.idPartido} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                            <span>Partido {partido.numeroPartido}</span>
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${partido.estado === "Finalizado" || partido.estado === "Pase libre" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{partido.estado}</span>
                          </div>
                          <div className={`flex items-center justify-between gap-3 py-1 text-sm ${Number(partido.idEquipoGanador) === Number(partido.idEquipoLocal) && partido.idEquipoGanador ? "font-bold text-emerald-700" : "text-slate-700"}`}>
                            <span className="min-w-0 break-words">{nombreEquipoBracket(partido, "local")}</span>
                            <strong className="shrink-0 tabular-nums">{partido.golesLocal ?? "–"}</strong>
                          </div>
                          <div className={`flex items-center justify-between gap-3 border-t border-slate-100 py-1 text-sm ${Number(partido.idEquipoGanador) === Number(partido.idEquipoVisitante) && partido.idEquipoGanador ? "font-bold text-emerald-700" : "text-slate-700"}`}>
                            <span className="min-w-0 break-words">{nombreEquipoBracket(partido, "visitante")}</span>
                            <strong className="shrink-0 tabular-nums">{partido.golesVisitante ?? "–"}</strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">Este torneo todavía no tiene partidos generados.</p>
            )
          ) : (
            <>
              <section className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">Orden de desempate</h3>
                    <p className="mt-1 text-xs text-slate-500">Estos tres criterios se aplican en orden si hay empate en puntos.</p>
                  </div>
                  {detalleTorneoActual?.torneo?.permiteModificarCriterios && (
                    <button
                      type="button"
                      onClick={guardarCriteriosDesempate}
                      disabled={guardandoCriterios || new Set(criteriosDesempate).size !== 3}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {guardandoCriterios ? "Guardando…" : "Guardar orden"}
                    </button>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {criteriosDesempate.map((criterio, indice) => (
                    <label key={indice} className="text-xs font-semibold text-slate-600">
                      Criterio {indice + 1}
                      <select
                        value={criterio}
                        disabled={!detalleTorneoActual?.torneo?.permiteModificarCriterios || guardandoCriterios}
                        onChange={(event) => setCriteriosDesempate((actuales) => actuales.map((valor, posicion) => (
                          posicion === indice ? event.target.value : valor
                        )))}
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 disabled:bg-slate-100"
                      >
                        {OPCIONES_DESEMPATE.filter((opcion) => (
                          opcion.valor === criterio || !criteriosDesempate.includes(opcion.valor)
                        )).map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.nombre}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                {!detalleTorneoActual?.torneo?.permiteModificarCriterios && (
                  <p className="mt-2 text-xs text-slate-500">El orden ya no se puede editar; se conserva la configuración guardada para la competencia.</p>
                )}
                {mensajeCriterios && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{mensajeCriterios}</p>}
              </section>

              <div className="divide-y divide-slate-100 md:hidden">
                {(detalleTorneoActual?.posiciones || []).length ? detalleTorneoActual.posiciones.map((equipo) => (
                  <article key={equipo.equipoId} className="min-w-0 px-4 py-4">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-extrabold text-slate-600">{equipo.posicion}</span>
                        <div className="min-w-0"><h3 className="break-words text-sm font-bold text-slate-800">{equipo.equipo}</h3>{equipo.estadoParticipacion === "Baja" && <span className="text-[10px] font-bold uppercase text-red-600">Baja</span>}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-extrabold text-blue-800">{equipo.puntos} pts</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                      {[["PJ", equipo.pj], ["PG", equipo.pg], ["PE", equipo.pe], ["PP", equipo.pp]].map(([etiqueta, valor]) => (
                        <div key={etiqueta} className="rounded-lg bg-slate-50 px-1 py-2"><span className="block text-[10px] font-semibold uppercase text-slate-400">{etiqueta}</span><strong className="mt-0.5 block text-sm text-slate-700">{valor}</strong></div>
                      ))}
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-xs">
                      <div className="flex justify-between rounded-lg border border-slate-100 px-3 py-2"><span className="text-slate-500">A favor</span><strong>{equipo.gf}</strong></div>
                      <div className="flex justify-between rounded-lg border border-slate-100 px-3 py-2"><span className="text-slate-500">En contra</span><strong>{equipo.gc}</strong></div>
                    </div>
                  </article>
                )) : <p className="px-4 py-8 text-center text-sm text-slate-500">Todavía no hay equipos en la tabla.</p>}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr>
                    {["#", "Equipo", "PJ", "PG", "PE", "PP", "A favor", "En contra", "DIF", "PTS"].map((titulo) => <th key={titulo} className="px-3 py-3 text-center first:text-left">{titulo}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(detalleTorneoActual?.posiciones || []).map((equipo) => (
                      <tr key={equipo.equipoId} className="hover:bg-slate-50">
                        <td className="px-3 py-3 font-bold text-slate-500">{equipo.posicion}</td>
                        <td className="px-3 py-3 font-semibold text-slate-800">{equipo.equipo}{equipo.estadoParticipacion === "Baja" && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">Baja</span>}</td>
                        {[equipo.pj, equipo.pg, equipo.pe, equipo.pp, equipo.gf, equipo.gc, equipo.diferencia].map((valor, indice) => <td key={indice} className="px-3 py-3 text-center text-slate-600">{valor}</td>)}
                        <td className="px-3 py-3 text-center font-extrabold text-blue-700">{equipo.puntos}</td>
                      </tr>
                    ))}
                    {!detalleTorneoActual?.posiciones?.length && <tr><td colSpan="10" className="px-3 py-8 text-center text-slate-500">Todavía no hay equipos en la tabla.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* ================================================= */}
      {/* PARTE INFERIOR */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================================================= */}
        {/* GOLEADORES */}
        {/* ================================================= */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="p-5 border-b border-slate-200">

            <h2 className="text-lg font-bold text-slate-800">
              Máximos anotadores
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Jugadores con más goles o puntos registrados en actas cerradas.
            </p>

          </div>

          <div className="divide-y divide-slate-100">

            {goleadoresFiltrados.length === 0 ? (

              <div className="p-8 text-center text-sm text-slate-500">
                Todavía no hay eventos individuales registrados en las actas cerradas.
              </div>

            ) : (

              goleadoresFiltrados.map((jugador, index) => (

                <div
                  key={jugador.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-slate-200 text-slate-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-bold text-slate-800">
                        {jugador.jugador}
                      </p>

                      <p className="text-xs text-slate-500">
                        {jugador.equipo}
                      </p>
                    </div>

                  </div>

                  <div className="text-right">

                    <p className="font-bold text-blue-600">
                      {jugador.anotaciones} {jugador.tipoPuntuacion === "Puntos" ? "puntos" : jugador.tipoPuntuacion === "Sets" ? "puntos" : "goles"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {jugador.asistencias} asistencias · {jugador.amarillas + jugador.rojas} tarjetas
                    </p>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

        {/* ================================================= */}
        {/* ESTADÍSTICAS POR EQUIPO */}
        {/* ================================================= */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="p-5 border-b border-slate-200">

            <h2 className="text-lg font-bold text-slate-800">
              Rendimiento por equipo
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Comparación general de los equipos.
            </p>

          </div>

          <div className="p-5 space-y-5">

            {datosOrdenados
              .slice(0, 5)
              .map((equipo) => {

                const porcentajeVictorias =
                  equipo.pj > 0
                    ? Math.round(
                        (equipo.pg / equipo.pj) * 100
                      )
                    : 0;

                return (
                  <div key={equipo.id}>

                    <div className="flex justify-between items-center mb-2">

                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          {equipo.equipo}
                        </p>

                        <p className="text-xs text-slate-500">
                        {equipo.pg} victorias · {equipo.pj} partidos · {equipo.torneo}
                        </p>
                      </div>

                      <span className="text-sm font-bold text-blue-600">
                        {porcentajeVictorias}%
                      </span>

                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${porcentajeVictorias}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              })}

            {datosFiltrados.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-6">
                No hay equipos para mostrar.
              </p>
            )}

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* PIE DE INFORMACIÓN */}
      {/* ================================================= */}

      <div className="bg-slate-800 rounded-xl p-5 text-white">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>
            <h3 className="font-bold">
              Estadísticas Global League
            </h3>

            <p className="text-sm text-slate-300 mt-1">
              Los resultados y las métricas de equipos se consultan desde tus torneos y partidos cerrados.
            </p>
          </div>

          <span className="text-xs bg-slate-700 px-3 py-2 rounded-lg font-semibold">
            Datos del sistema
          </span>

        </div>

      </div>

    </div>
  );
}
