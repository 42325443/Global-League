
import { useMemo, useState } from "react";

export default function Estadisticas() {
  // =========================================================
  // DATOS DE EJEMPLO
  // Posteriormente pueden reemplazarse por datos provenientes
  // del backend/API.
  // =========================================================

  const torneos = [
    "Todos",
    "Liga Rosario 2026",
    "Copa Global League 2026",
    "Torneo Apertura 2026",
  ];

  const deportes = [
    "Todos",
    "Fútbol",
    "Básquet",
    "Vóley",
  ];

  const datos = [
    {
      id: 1,
      torneo: "Liga Rosario 2026",
      deporte: "Fútbol",
      equipo: "Los Tigres",
      pj: 8,
      pg: 6,
      pe: 1,
      pp: 1,
      gf: 21,
      gc: 8,
      puntos: 19,
    },
    {
      id: 2,
      torneo: "Liga Rosario 2026",
      deporte: "Fútbol",
      equipo: "Atlético Central",
      pj: 8,
      pg: 5,
      pe: 2,
      pp: 1,
      gf: 18,
      gc: 9,
      puntos: 17,
    },
    {
      id: 3,
      torneo: "Liga Rosario 2026",
      deporte: "Fútbol",
      equipo: "Deportivo Sur",
      pj: 8,
      pg: 4,
      pe: 1,
      pp: 3,
      gf: 15,
      gc: 12,
      puntos: 13,
    },
    {
      id: 4,
      torneo: "Liga Rosario 2026",
      deporte: "Fútbol",
      equipo: "Los Halcones",
      pj: 8,
      pg: 2,
      pe: 2,
      pp: 4,
      gf: 10,
      gc: 16,
      puntos: 8,
    },
    {
      id: 5,
      torneo: "Copa Global League 2026",
      deporte: "Fútbol",
      equipo: "Rosario FC",
      pj: 6,
      pg: 5,
      pe: 0,
      pp: 1,
      gf: 17,
      gc: 6,
      puntos: 15,
    },
    {
      id: 6,
      torneo: "Copa Global League 2026",
      deporte: "Fútbol",
      equipo: "Central Norte",
      pj: 6,
      pg: 3,
      pe: 1,
      pp: 2,
      gf: 12,
      gc: 9,
      puntos: 10,
    },
    {
      id: 7,
      torneo: "Torneo Apertura 2026",
      deporte: "Básquet",
      equipo: "Águilas Basket",
      pj: 7,
      pg: 6,
      pe: 0,
      pp: 1,
      gf: 512,
      gc: 430,
      puntos: 13,
    },
    {
      id: 8,
      torneo: "Torneo Apertura 2026",
      deporte: "Básquet",
      equipo: "Rosario Basket",
      pj: 7,
      pg: 4,
      pe: 0,
      pp: 3,
      gf: 480,
      gc: 455,
      puntos: 11,
    },
  ];

  const goleadores = [
    {
      id: 1,
      jugador: "Martín González",
      equipo: "Los Tigres",
      torneo: "Liga Rosario 2026",
      deporte: "Fútbol",
      goles: 12,
      asistencias: 5,
    },
    {
      id: 2,
      jugador: "Lucas Fernández",
      equipo: "Atlético Central",
      torneo: "Liga Rosario 2026",
      deporte: "Fútbol",
      goles: 10,
      asistencias: 7,
    },
    {
      id: 3,
      jugador: "Juan Rodríguez",
      equipo: "Rosario FC",
      torneo: "Copa Global League 2026",
      deporte: "Fútbol",
      goles: 9,
      asistencias: 4,
    },
    {
      id: 4,
      jugador: "Matías López",
      equipo: "Los Tigres",
      torneo: "Liga Rosario 2026",
      deporte: "Fútbol",
      goles: 8,
      asistencias: 6,
    },
    {
      id: 5,
      jugador: "Nicolás Pérez",
      equipo: "Deportivo Sur",
      torneo: "Liga Rosario 2026",
      deporte: "Fútbol",
      goles: 7,
      asistencias: 3,
    },
  ];

  // =========================================================
  // FILTROS
  // =========================================================

  const [torneoFiltro, setTorneoFiltro] = useState("Todos");
  const [deporteFiltro, setDeporteFiltro] = useState("Todos");

  const datosFiltrados = useMemo(() => {
    return datos.filter((item) => {
      const coincideTorneo =
        torneoFiltro === "Todos" ||
        item.torneo === torneoFiltro;

      const coincideDeporte =
        deporteFiltro === "Todos" ||
        item.deporte === deporteFiltro;

      return coincideTorneo && coincideDeporte;
    });
  }, [torneoFiltro, deporteFiltro]);

  const goleadoresFiltrados = useMemo(() => {
    return goleadores
      .filter((item) => {
        const coincideTorneo =
          torneoFiltro === "Todos" ||
          item.torneo === torneoFiltro;

        const coincideDeporte =
          deporteFiltro === "Todos" ||
          item.deporte === deporteFiltro;

        return coincideTorneo && coincideDeporte;
      })
      .sort((a, b) => b.goles - a.goles);
  }, [torneoFiltro, deporteFiltro]);

  // =========================================================
  // RESUMEN GENERAL
  // =========================================================

  const partidosJugados = datosFiltrados.reduce(
    (total, item) => total + item.pj,
    0
  );

  const golesAFavor = datosFiltrados.reduce(
    (total, item) => total + item.gf,
    0
  );

  const golesEnContra = datosFiltrados.reduce(
    (total, item) => total + item.gc,
    0
  );

  const equipos = new Set(
    datosFiltrados.map((item) => item.equipo)
  ).size;

  const promedioGoles =
    partidosJugados > 0
      ? (golesAFavor / partidosJugados).toFixed(1)
      : "0.0";

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
              Consultá el rendimiento de equipos y jugadores
              de Global League.
            </p>
          </div>
        </div>
      </div>

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
              onChange={(e) => setTorneoFiltro(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {torneos.map((torneo) => (
                <option key={torneo} value={torneo}>
                  {torneo}
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
              Goles / puntos anotados
            </p>

            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold text-emerald-600">
                {golesAFavor}
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
                {promedioGoles}
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-5 border-b border-slate-200">

          <h2 className="text-lg font-bold text-slate-800">
            Tabla de posiciones
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Clasificación de equipos según puntos obtenidos.
          </p>

        </div>

        <div className="overflow-x-auto">

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
                  GF
                </th>

                <th className="text-center px-3 py-3 font-bold text-slate-500">
                  GC
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
                    No hay datos para los filtros seleccionados.
                  </td>
                </tr>

              ) : (

                [...datosFiltrados]
                  .sort((a, b) => b.puntos - a.puntos)
                  .map((equipo, index) => (

                    <tr
                      key={equipo.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >

                      <td className="px-5 py-4 font-bold text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-3 py-4">
                        <span className="font-bold text-slate-800">
                          {equipo.equipo}
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
              Goleadores
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Jugadores con mayor cantidad de goles.
            </p>

          </div>

          <div className="divide-y divide-slate-100">

            {goleadoresFiltrados.length === 0 ? (

              <div className="p-8 text-center text-sm text-slate-500">
                No hay goleadores para los filtros seleccionados.
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
                      {jugador.goles} goles
                    </p>

                    <p className="text-xs text-slate-500">
                      {jugador.asistencias} asistencias
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

            {[...datosFiltrados]
              .sort((a, b) => b.puntos - a.puntos)
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
                          {equipo.pg} victorias · {equipo.pj} partidos
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
              Los datos mostrados actualmente son demostrativos
              y serán reemplazados por información proveniente
              del sistema.
            </p>
          </div>

          <span className="text-xs bg-slate-700 px-3 py-2 rounded-lg font-semibold">
            Modo demostración
          </span>

        </div>

      </div>

    </div>
  );
}
