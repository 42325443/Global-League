import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  TrophyIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import EquipoWizard from "../components/EquipoWizard";
import EditarEquipoModal from "../components/EditarEquipoModal";
import { apiFetch } from "../lib/api";

const obtenerEquipos = async () => {
  const response = await apiFetch("/equipos");
  if (!response.ok) throw new Error("No se pudieron cargar los equipos.");

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("La respuesta de equipos no es válida.");
  return data;
};

const inicialesEquipo = (nombre = "") => nombre
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((palabra) => palabra.charAt(0).toLocaleUpperCase())
  .join("") || "EQ";

export default function Equipos() {
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState("");
  const [deporteFiltro, setDeporteFiltro] = useState("Todos");
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("Todas");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [equipos, setEquipos] = useState([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [errorEquipos, setErrorEquipos] = useState("");
  const [equipoAEditar, setEquipoAEditar] = useState(null);
  const [equipoAEliminar, setEquipoAEliminar] = useState(null);
  const [eliminandoEquipo, setEliminandoEquipo] = useState(false);
  const [errorEliminacionEquipo, setErrorEliminacionEquipo] = useState("");

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

  const eliminarEquipo = async () => {
    if (!equipoAEliminar || eliminandoEquipo) return;
    setEliminandoEquipo(true);
    setErrorEliminacionEquipo("");
    setErrorEquipos("");
    try {
      const response = await apiFetch(`/equipos/${equipoAEliminar.id}`, { method: "DELETE" });
      const resultado = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resultado.error || "No se pudo eliminar el equipo.");
      setEquipoAEliminar(null);
      await recargarEquipos();
    } catch (error) {
      setErrorEliminacionEquipo(error.message || "No se pudo conectar con el servidor.");
    } finally {
      setEliminandoEquipo(false);
    }
  };

  const deportes = useMemo(() => [
    "Todos",
    ...new Set(equipos.map((equipo) => equipo.deporte).filter(Boolean).sort((a, b) => a.localeCompare(b))),
  ], [equipos]);

  const disciplinas = useMemo(() => [
    "Todas",
    ...new Set(equipos
      .filter((equipo) => deporteFiltro === "Todos" || equipo.deporte === deporteFiltro)
      .map((equipo) => equipo.disciplina)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))),
  ], [equipos, deporteFiltro]);

  const equiposFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();
    return equipos.filter((equipo) => {
      const nombre = equipo.nombre || equipo.nombreEquipo || "";
      const coincideBusqueda = !texto || [nombre, equipo.capitan, equipo.localidad]
        .some((valor) => String(valor || "").toLocaleLowerCase().includes(texto));
      const coincideDeporte = deporteFiltro === "Todos" || equipo.deporte === deporteFiltro;
      const coincideDisciplina = disciplinaFiltro === "Todas" || equipo.disciplina === disciplinaFiltro;
      return coincideBusqueda && coincideDeporte && coincideDisciplina;
    });
  }, [equipos, busqueda, deporteFiltro, disciplinaFiltro]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setDeporteFiltro("Todos");
    setDisciplinaFiltro("Todas");
  };
  const hayFiltrosActivos = busqueda || deporteFiltro !== "Todos" || disciplinaFiltro !== "Todas";

  return (
    <div className="min-w-0 space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-lime-50/70 p-5 shadow-sm sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border border-lime-200/70" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-8 h-32 w-32 rounded-full border border-blue-100" />
        <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-lime-700">
              <span className="h-2 w-2 rounded-full bg-lime-500 ring-4 ring-lime-100" />
              Gestión de planteles
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Equipos</h1>
              <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600">
                {cargandoEquipos ? "…" : `${equipos.length} ${equipos.length === 1 ? "equipo" : "equipos"}`}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Administrá tus planteles, capitanes y jugadores para prepararlos para competir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Crear equipo
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Filtros de equipos">
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(220px,1.5fr)_minmax(170px,1fr)_minmax(170px,1fr)]">
          <label className="relative block min-w-0">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Buscar equipo</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-[2.45rem] h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Nombre, capitán o localidad…"
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Deporte</span>
            <select
              value={deporteFiltro}
              onChange={(event) => {
                setDeporteFiltro(event.target.value);
                setDisciplinaFiltro("Todas");
              }}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              {deportes.map((deporte) => <option key={deporte} value={deporte}>{deporte === "Todos" ? "Todos los deportes" : deporte}</option>)}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Disciplina</span>
            <select
              value={disciplinaFiltro}
              onChange={(event) => setDisciplinaFiltro(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              {disciplinas.map((disciplina) => <option key={disciplina} value={disciplina}>{disciplina === "Todas" ? "Todas las disciplinas" : disciplina}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-slate-500" aria-live="polite">
            {cargandoEquipos ? "Cargando planteles…" : `${equiposFiltrados.length} de ${equipos.length} ${equipos.length === 1 ? "equipo" : "equipos"}`}
          </p>
          {hayFiltrosActivos && (
            <button type="button" onClick={limpiarFiltros} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900">
              <XMarkIcon className="h-4 w-4" /> Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {errorEquipos && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorEquipos}</p>
      )}

      {!cargandoEquipos && !errorEquipos && equiposFiltrados.length > 0 && (
        <section className="min-w-0" aria-label="Tus planteles">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Tus planteles</h2>
              <p className="text-xs text-slate-500">Información y accesos de cada equipo.</p>
            </div>
            <TrophyIcon className="h-5 w-5 shrink-0 text-lime-600" aria-hidden="true" />
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {equiposFiltrados.map((equipo) => {
              const nombre = equipo.nombre || equipo.nombreEquipo || "Equipo sin nombre";
              return (
                <article
                  key={equipo.id}
                  className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                >
                  <div aria-hidden="true" className="h-1 bg-gradient-to-r from-lime-400 via-blue-500 to-cyan-400" />
                  <div className="min-w-0 p-4 sm:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black tracking-wide text-white shadow-sm ring-4 ring-slate-100">
                        {inicialesEquipo(nombre)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-700">
                          {equipo.deporte || "Deporte"} · {equipo.disciplina || "Disciplina"}
                        </p>
                        <h3 className="mt-0.5 truncate text-lg font-extrabold leading-tight text-slate-900" title={nombre}>{nombre}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/equipos/${equipo.id}`)}
                        aria-label={`Ver ${nombre}`}
                        title="Ver equipo"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                        <div className="min-w-0">
                          <span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Capitán</span>
                          <span className="block truncate text-sm font-bold text-slate-800">{equipo.capitan || "Sin asignar"}</span>
                        </div>
                        <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-extrabold text-blue-800">
                          <UserGroupIcon className="h-4 w-4" />
                          {equipo.cantidadJugadores ?? 0}
                          <span className="hidden text-[10px] font-semibold sm:inline">jugadores</span>
                        </span>
                      </div>
                      <div className="col-span-2 flex min-w-0 items-center gap-2 px-1 py-1 text-xs text-slate-500">
                        <MapPinIcon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{equipo.localidad || "Localidad sin definir"}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/equipos/${equipo.id}`)}
                        className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        Ver equipo <ArrowRightIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEquipoAEditar(equipo)}
                        aria-label={`Editar ${nombre}`}
                        title="Editar equipo"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorEliminacionEquipo("");
                          setEquipoAEliminar(equipo);
                        }}
                        aria-label={`Eliminar ${nombre}`}
                        title="Eliminar equipo"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!cargandoEquipos && !errorEquipos && equiposFiltrados.length === 0 && (
        <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <UserGroupIcon className="h-6 w-6" />
          </span>
          <h2 className="mt-3 font-extrabold text-slate-800">{equipos.length ? "No hay equipos para esos filtros" : "Todavía no creaste equipos"}</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {equipos.length ? "Probá cambiar los filtros o la búsqueda." : "Creá tu primer plantel y agregá sus jugadores para empezar."}
          </p>
          {equipos.length ? (
            <button type="button" onClick={limpiarFiltros} className="mt-4 rounded-lg px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50">Limpiar filtros</button>
          ) : (
            <button type="button" onClick={() => setIsWizardOpen(true)} className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Crear equipo</button>
          )}
        </section>
      )}

      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsWizardOpen(false)} />
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

      {equipoAEditar && (
        <EditarEquipoModal
          equipo={equipoAEditar}
          onClose={() => setEquipoAEditar(null)}
          onSaved={recargarEquipos}
        />
      )}

      {equipoAEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancelar eliminación"
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setEquipoAEliminar(null)}
            disabled={eliminandoEquipo}
          />
          <section role="alertdialog" aria-modal="true" aria-labelledby="eliminar-equipo-titulo" className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="eliminar-equipo-titulo" className="text-lg font-bold text-slate-900">¿Eliminar este equipo?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Se eliminarán también los jugadores del plantel. Si el equipo ya está inscripto en un torneo, el sistema bloqueará la eliminación para proteger ese historial.
            </p>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">{equipoAEliminar.nombre || equipoAEliminar.nombreEquipo}</p>
            {errorEliminacionEquipo && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorEliminacionEquipo}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEquipoAEliminar(null)} disabled={eliminandoEquipo} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={eliminarEquipo} disabled={eliminandoEquipo} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {eliminandoEquipo ? "Eliminando..." : "Eliminar equipo"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
