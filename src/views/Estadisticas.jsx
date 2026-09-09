
export default function Estadisticas({torneosCreados, torneosTerminados, torneosEnCurso}) {
  return (

    <div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">

        <div>

          <span className="text-sm text-lime-700 font-bold">Historial deportivo</span>

          <h1 className="text-2xl font-bold">
            Estadísticas
          </h1>

          <p className="text-slate-500 text-sm font-semibold mt-1">
            Revisá las estadísticas históricas de tu perfil.
          </p>
        
        </div>

      </div>

    </div>
  );
}