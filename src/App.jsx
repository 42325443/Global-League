// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar.jsx";

// Importación de las diferentes vistas dentro del archivo principal
import Inicio from "./views/Inicio";
import Torneos from "./views/Torneos";
import Equipos from "./views/Equipos";
import Estadisticas from "./views/Estadisticas";
import Arbitros from "./views/Arbitros";
import Calendario from "./views/Calendario";


function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 md:h-screen md:overflow-hidden">
        {/* Navbar fijo para navegación general de la página */}
        <Navbar />

        {/* Ruta para cambio de pantallas */}
        <main className="min-h-[calc(100vh-3.5rem)] w-full min-w-0 overflow-x-hidden overflow-y-auto px-4 pb-6 pt-4 md:ml-55 md:h-screen md:min-h-0 md:w-[calc(100%-13.75rem)] md:overflow-hidden md:px-6 md:pb-8 md:pt-20">
          <Routes>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/torneos" element={<Torneos />} />
            <Route path="/equipos" element={<Equipos />} />
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