import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth.js';
import Inicio from './views/Inicio';
import Torneos from './views/Torneos';
import Equipos from './views/Equipos';
import EquipoDetalle from './views/EquipoDetalle';
import CrearEquipo from './views/CrearEquipo';
import Estadisticas from './views/Estadisticas';
import Arbitros from './views/Arbitros';
import CrearArbitro from './views/CrearArbitro';
import Calendario from './views/Calendario';
import Login from './views/Login';
import Registro from './views/Registro';

function RutasAplicacion() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Cargando…</main>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:max-h-screen md:flex-row md:overflow-hidden">
      <Navbar role={user.nombre} onLogout={logout} />
      <main className="min-w-0 flex-1 bg-slate-50 p-4 md:mt-3 md:overflow-auto md:p-6 md:pt-14">
        <Routes>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/torneos" element={<Torneos />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/equipos/:id" element={<EquipoDetalle />} />
          <Route path="/crear-equipo" element={<CrearEquipo />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/arbitros" element={<Arbitros />} />
          <Route path="/crear-arbitro" element={<CrearArbitro />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/actas" element={<Navigate to="/arbitros" replace />} />
          <Route path="/posiciones" element={<Navigate to="/estadisticas" replace />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RutasAplicacion />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
