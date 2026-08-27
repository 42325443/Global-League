// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar.jsx";

// Importación de las diferentes vistas dentro del archivo principal
import Inicio from "./views/Inicio";
import Torneos from "./views/Torneos";
import Equipos from "./views/Equipos";
import CrearEquipo from "./views/CrearEquipo";
import Estadisticas from "./views/Estadisticas";
import Arbitros from "./views/Arbitros";
import Calendario from "./views/Calendario";


function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col md:flex-row">
        {/* Navbar fijo para navegación general de la página */}
        <Navbar />

        {/* Ruta para cambio de pantallas */}
        <main className="flex-1 mt-5 p-4 md:p-6 bg-slate-50 md:pt-14">
          <Routes>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/torneos" element={<Torneos />} />
            <Route path="/equipos" element={<Equipos />} />
            <Route path="/crear-equipo" element={<CrearEquipo />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/arbitros" element={<Arbitros />} />
            <Route path="/calendario" element={<Calendario />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}


export default App;