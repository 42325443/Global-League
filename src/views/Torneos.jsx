export default function Torneos() {
  return (

    <div className="vistaTorneos min-h-full w-full min-w-0 overflow-x-hidden">

      <header className="vistaTorneosHeader flex w-full flex-col md:items-center items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between mb-3">

        <div className="torneosTexto min-w-0">
          <h1 className="tituloTorneos text-2xl font-bold">Torneos</h1>
          <p className="max-w-3xl text-sm font-semibold text-slate-600">Creá y organizá tus torneos, elegí deporte y formato, luego podrás verlos en esta página</p>
        </div>

        <button type="button" className="botonCrearTorneo shrink-0 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">+ Crear Torneo</button>

      </header>

      <div className="torneosContenido w-full h-full overflow-x-hidden overflow-y-auto rounded-md bg-white p-4 shadow-md md:h-[calc(100%-5.5rem)] md:overflow-hidden">
      
      </div>

    </div>

  );
}