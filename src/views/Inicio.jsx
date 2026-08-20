export default function Inicio() {
  return (
    <main className="h-full w-full flex flex-col justify-between px-4 py-6 md:p-0 gap-8 md:gap-0">
      
      {/* Sección de Texto Principal */}
      <div className="mainText w-full md:w-150 flex flex-col items-center md:items-start text-center md:text-left mx-auto md:mx-0">
        <h1 className="text-3xl md:text-2xl font-bold py-3 text-slate-900">
          Bienvenido a <br className="hidden md:block" />
          <span className="text-4xl md:text-3xl text-lime-600 block mt-2 md:inline md:mt-0">
            Global League
          </span>
        </h1>
        <p className="my-3 md:my-2 text-base md:text-sm font-semibold text-slate-500 max-w-sm md:max-w-none">
          La plataforma integral para crear, organizar y gestionar
          <br className="hidden md:block" /> torneos deportivos de fútbol, básquet y vóley.
          <br className="hidden md:block" /> Todo lo que necesitás para llevar tu torneo al siguiente nivel.
        </p>
      </div>

      {/* Sección de Iconos */}
      <div className="mainIcons w-full md:w-150 flex flex-col sm:flex-row items-center justify-center md:justify-between gap-4 md:gap-0 mb-8 md:mb-5 mx-auto md:mx-0">
        
        {/* Card Organiza */}
        <div className="card h-auto md:h-35 w-full max-w-[280px] sm:max-w-none sm:w-1/3 md:w-40 p-6 md:p-3 flex flex-col items-center justify-center gap-3 md:gap-2 bg-slate-50 md:bg-transparent rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-transparent transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-12 text-lime-500">
            <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
          </svg>
          <span className="font-bold text-base md:text-sm text-slate-800 md:text-inherit">Organiza</span>
          <p className="text-sm md:text-xs text-slate-500 text-center">Crea y configura torneos a tu medida</p>
        </div>

        {/* Card Gestiona */}
        <div className="card h-auto md:h-35 w-full max-w-[280px] sm:max-w-none sm:w-1/3 md:w-40 p-6 md:p-3 flex flex-col items-center justify-center gap-3 md:gap-2 bg-slate-50 md:bg-transparent rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-transparent transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-12 text-lime-500">
            <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
          </svg>
          <span className="font-bold text-base md:text-sm text-slate-800 md:text-inherit">Gestiona</span>
          <p className="text-sm md:text-xs text-slate-500 text-center">Administra equipos, partidos y fechas</p>
        </div>

        {/* Card Analiza */}
        <div className="card h-auto md:h-35 w-full max-w-[280px] sm:max-w-none sm:w-1/3 md:w-40 p-6 md:p-3 flex flex-col items-center justify-center gap-3 md:gap-2 bg-slate-50 md:bg-transparent rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-transparent transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-12 text-lime-500">
            <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
          </svg>
          <span className="font-bold text-base md:text-sm text-slate-800 md:text-inherit">Analiza</span>
          <p className="text-sm md:text-xs text-slate-500 text-center">Accede a estadísticas y reportes</p>
        </div>

      </div>

      <section className="w-full mb-12">
        <div className="mb-6 md:mb-8 flex flex-col gap-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-lime-600">
            Modalidades
          </span>
          <h2 className="font-montserrat text-2xl md:text-3xl font-bold text-slate-900">
            Deportes Disponibles
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {[
            {
              name: 'Fútbol',
              description:
                'Organizá torneos con fixtures, goleadores, tarjetas, posiciones y una competencia bien definida.',
              badgeColor: 'bg-lime-100 text-lime-700 border-lime-200',
              accent: 'from-lime-200 via-lime-100 to-emerald-100',
              items: ['Fútbol 11', 'Fútbol 5'],
            },
            {
              name: 'Básquet',
              description:
                'Gestioná puntajes por cuarto, faltas, estadística por jugador y fases decisivas del campeonato.',
              badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
              accent: 'from-orange-200 via-orange-100 to-amber-100',
              items: ['5x5', '3x3'],
            },
            {
              name: 'Vóley',
              description:
                'Controlá sets, rotaciones, rankings y llaves finales con un seguimiento claro y rápido.',
              badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
              accent: 'from-blue-200 via-blue-100 to-cyan-100',
              items: ['6x6', '4x4'],
            },
          ].map(({ name, description, badgeColor, accent, items }) => (
            <article
              key={name}
              className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br ${accent} p-5 md:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-[80px] bg-white/20" />

              <div className="relative z-10 flex h-full flex-col justify-between gap-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-lg font-bold text-slate-800 shadow-sm">
                    {name.slice(0, 1)}
                  </span>
                  <span className="rounded-full border border-white/60 bg-white/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {name}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="font-montserrat text-xl md:text-[1.35rem] font-bold text-slate-800">
                    {name}
                  </h3>
                  <p className="text-sm md:text-[0.92rem] leading-relaxed text-slate-700">
                    {description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span
                      key={item}
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeColor}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer w-full flex flex-col gap-4 md:flex-row md:justify-between pb-4 md:pb-0">
        <div className="footerText w-full relative bg-lime-100 p-6 md:p-4 rounded-2xl md:rounded-lg shadow-md flex flex-col md:flex-col justify-center items-center md:items-start text-center md:text-left gap-2 md:gap-0">
          <span className="text-base md:text-sm font-bold text-slate-800">¡Comienza ahora!</span>
          <p className="text-sm text-slate-600 md:text-slate-500 max-w-md md:max-w-none">
            Explorá todas las herramientas que Global League tiene para ofrecerte y crea experiencias deportivas emocionantes.
          </p>
        </div>
      </footer>
    </main>
  );
}