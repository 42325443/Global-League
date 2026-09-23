// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar.jsx";

// Importación de las diferentes vistas
import Inicio from "./views/Inicio";
import Torneos from "./views/Torneos";
import Equipos from "./views/Equipos";
import CrearEquipo from "./views/CrearEquipo";
import Estadisticas from "./views/Estadisticas";
import Arbitros from "./views/Arbitros";
import CrearArbitro from "./views/CrearArbitro";
import Calendario from "./views/Calendario";

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col md:flex-row md:overflow-hidden max-h-screen">

        {/* Navbar fijo para navegación general */}
        <Navbar />

        {/* Contenido principal */}
        <main className="flex-1 p-4 md:overflow-auto md:p-6 bg-slate-50 md:pt-14 md:mt-3">

          <Routes>

            {/* Inicio */}
            <Route
              path="/inicio"
              element={<Inicio />}
            />

            {/* Torneos */}
            <Route
              path="/torneos"
              element={<Torneos />}
            />

            {/* Equipos */}
            <Route
              path="/equipos"
              element={<Equipos />}
            />

            {/* Crear equipo */}
            <Route
              path="/crear-equipo"
              element={<CrearEquipo />}
            />

            {/* Estadísticas */}
            <Route
              path="/estadisticas"
              element={<Estadisticas />}
            />

            {/* Árbitros */}
            <Route
              path="/arbitros"
              element={<Arbitros />}
            />

            {/* Crear árbitro */}
            <Route
              path="/crear-arbitro"
              element={<CrearArbitro />}
            />

            {/* Calendario */}
            <Route
              path="/calendario"
              element={<Calendario />}
            />

          </Routes>

        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;