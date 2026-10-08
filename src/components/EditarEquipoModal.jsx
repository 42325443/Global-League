import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export default function EditarEquipoModal({ equipo, onClose, onSaved }) {
  const [formulario, setFormulario] = useState({
    nombreEquipo: equipo.nombreEquipo || equipo.nombre || "",
    idDisciplina: String(equipo.idDisciplina || ""),
    localidad: equipo.localidad || "",
  });
  const [disciplinas, setDisciplinas] = useState([]);
  const [cargandoDisciplinas, setCargandoDisciplinas] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    apiFetch("/catalogos/disciplinas")
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data.error || "No se pudieron cargar las disciplinas.");
        return data;
      })
      .then((data) => {
        if (!cancelado) setDisciplinas(Array.isArray(data) ? data : []);
      })
      .catch((fetchError) => {
        if (!cancelado) setError(fetchError.message || "No se pudieron cargar las disciplinas.");
      })
      .finally(() => {
        if (!cancelado) setCargandoDisciplinas(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const actualizarCampo = (evento) => {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setError("");
    try {
      const response = await apiFetch(`/equipos/${equipo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulario,
          idDisciplina: Number(formulario.idDisciplina),
        }),
      });
      const resultado = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resultado.error || "No se pudo actualizar el equipo.");
      onSaved?.();
      onClose?.();
    } catch (saveError) {
      setError(saveError.message || "No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Cerrar edición"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        disabled={guardando}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-equipo-titulo"
        className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-lime-700">Equipo</span>
            <h2 id="editar-equipo-titulo" className="mt-1 text-xl font-bold text-slate-900">Editar equipo</h2>
          </div>
          <button type="button" onClick={onClose} disabled={guardando} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <form onSubmit={guardar} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Nombre del equipo
            <input
              name="nombreEquipo"
              value={formulario.nombreEquipo}
              onChange={actualizarCampo}
              maxLength={100}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Disciplina
            <select
              name="idDisciplina"
              value={formulario.idDisciplina}
              onChange={actualizarCampo}
              required
              disabled={cargandoDisciplinas}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
            >
              <option value="">{cargandoDisciplinas ? "Cargando disciplinas..." : "Seleccioná una disciplina"}</option>
              {disciplinas.map((disciplina) => {
                const id = disciplina.idDisciplina ?? disciplina.id_disciplina ?? disciplina.id;
                const nombre = disciplina.nombreDisciplina ?? disciplina.nombre_disciplina ?? disciplina.nombre;
                return <option key={id} value={id}>{nombre}</option>;
              })}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Localidad
            <input
              name="localidad"
              value={formulario.localidad}
              onChange={actualizarCampo}
              maxLength={100}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
            />
          </label>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={guardando} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={guardando || cargandoDisciplinas} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
