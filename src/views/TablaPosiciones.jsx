import React, { useState } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  Info, 
  Trophy, 
  Calendar, 
  Users, 
  Settings, 
  CheckCircle2 
} from 'lucide-react';

export default function TablaPosiciones() {
  const [torneoSeleccionado, setTorneoSeleccionado] = useState('Liga Global 2025');
  const [cargando, setCargando] = useState(false);

  // Datos mock basados en el wireframe oficial CU-TO-04 / Tabla de Posiciones
  const equipos = [
    { pos: 1, nombre: 'Tigres', pj: 10, pg: 8, pe: 1, pp: 1, gf: 25, gc: 8, dg: 17, pts: 25, estado: 'fase' },
    { pos: 2, nombre: 'Leones', pj: 10, pg: 7, pe: 2, pp: 1, gf: 23, gc: 7, dg: 16, pts: 23, estado: 'fase' },
    { pos: 3, nombre: 'Águilas', pj: 10, pg: 6, pe: 2, pp: 2, gf: 18, gc: 10, dg: 8, pts: 20, estado: 'repechaje' },
    { pos: 4, nombre: 'Halcones', pj: 10, pg: 5, pe: 1, pp: 4, gf: 16, gc: 13, dg: 3, pts: 16, estado: 'repechaje' },
    { pos: 5, nombre: 'Guerreros', pj: 10, pg: 4, pe: 2, pp: 4, gf: 14, gc: 15, dg: -1, pts: 14, estado: 'eliminado' },
    { pos: 6, nombre: 'Panteras', pj: 10, pg: 3, pe: 2, pp: 5, gf: 11, gc: 14, dg: -3, pts: 11, estado: 'eliminado' },
    { pos: 7, nombre: 'Titanes', pj: 10, pg: 2, pe: 1, pp: 7, gf: 9, gc: 18, dg: -9, pts: 7, estado: 'eliminado' },
    { pos: 8, nombre: 'Raptors', pj: 10, pg: 1, pe: 1, pp: 8, gf: 6, gc: 21, dg: -15, pts: 4, estado: 'eliminado' },
  ];

  const handleRefresh = () => {
    setCargando(true);
    setTimeout(() => setCargando(false), 600);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 font-sans">
      {/* Botón Volver y Encabezado Principal */}
      <div className="max-w-7xl mx-auto space-y-6">
        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabla de Posiciones</h1>
          <p className="text-sm text-gray-500">Consulta la clasificación actualizada del torneo</p>
        </div>

        {/* Barra de Filtros y Control */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Torneo
              </label>
              <select 
                value={torneoSeleccionado}
                onChange={(e) => setTorneoSeleccionado(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 font-medium"
              >
                <option value="Liga Global 2025">Liga Global 2025</option>
                <option value="Copa Apertura 2025">Copa Apertura 2025</option>
                <option value="Copa Verano 2026">Copa Verano 2026</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Formato
              </span>
              <span className="text-sm font-semibold text-gray-700">Todos contra Todos</span>
            </div>

            <div className="border-l border-gray-200 pl-6 hidden sm:block">
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Fecha de actualización
              </span>
              <span className="text-sm font-medium text-gray-600">10/06/2025 22:30</span>
            </div>
          </div>

          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Layout Principal: Tabla a la izquierda, Cards a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Principal: Tabla de Posiciones */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="py-3 px-4 text-center">Pos</th>
                      <th scope="col" className="py-3 px-4">Equipo</th>
                      <th scope="col" className="py-3 px-3 text-center">PJ</th>
                      <th scope="col" className="py-3 px-3 text-center">PG</th>
                      <th scope="col" className="py-3 px-3 text-center">PE</th>
                      <th scope="col" className="py-3 px-3 text-center">PP</th>
                      <th scope="col" className="py-3 px-3 text-center">GF</th>
                      <th scope="col" className="py-3 px-3 text-center">GC</th>
                      <th scope="col" className="py-3 px-3 text-center">DG</th>
                      <th scope="col" className="py-3 px-4 text-center font-bold text-gray-900">Pts.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {equipos.map((item) => {
                      // Indicadores visuales según la zona de clasificación
                      let borderClass = 'border-l-4 border-transparent';
                      if (item.estado === 'fase') borderClass = 'border-l-4 border-green-500 bg-green-50/30';
                      if (item.estado === 'repechaje') borderClass = 'border-l-4 border-blue-500 bg-blue-50/30';

                      return (
                        <tr key={item.pos} className={`hover:bg-gray-50 transition-colors ${borderClass}`}>
                          <td className="py-3 px-4 text-center font-bold text-gray-800">{item.pos}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
                              {item.nombre.charAt(0)}
                            </div>
                            {item.nombre}
                          </td>
                          <td className="py-3 px-3 text-center">{item.pj}</td>
                          <td className="py-3 px-3 text-center text-gray-700">{item.pg}</td>
                          <td className="py-3 px-3 text-center text-gray-700">{item.pe}</td>
                          <td className="py-3 px-3 text-center text-gray-700">{item.pp}</td>
                          <td className="py-3 px-3 text-center text-gray-700">{item.gf}</td>
                          <td className="py-3 px-3 text-center text-gray-700">{item.gc}</td>
                          <td className={`py-3 px-3 text-center font-medium ${item.dg > 0 ? 'text-green-600' : item.dg < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                            {item.dg > 0 ? `+${item.dg}` : item.dg}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-900 text-base">{item.pts}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Leyenda y Referencias de Abreviaturas */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-3">
                <div>
                  <span className="font-semibold text-gray-700 block mb-1">Leyenda:</span>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                      <span>Clasifica a la siguiente fase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                      <span>Clasifica a repechaje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
                      <span>Eliminado</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-500">
                  <span><strong>PJ:</strong> Partidos Jugados</span>
                  <span><strong>PG:</strong> Partidos Ganados</span>
                  <span><strong>PE:</strong> Partidos Empatados</span>
                  <span><strong>PP:</strong> Partidos Perdidos</span>
                  <span><strong>GF:</strong> Goles a Favor</span>
                  <span><strong>GC:</strong> Goles en Contra</span>
                  <span><strong>DG:</strong> Diferencia de Goles</span>
                  <span><strong>Pts:</strong> Puntos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Lateral Derecha: Información y Criterios */}
          <div className="space-y-4">
            
            {/* Card 1: Información del torneo */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                Información del torneo
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Torneo</span>
                  <span className="font-semibold text-gray-800">Liga Global 2025</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Formato</span>
                  <span className="font-semibold text-gray-800">Todos contra Todos</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Equipos</span>
                  <span className="font-semibold text-gray-800">8</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Fecha de inicio</span>
                  <span className="font-semibold text-gray-800">01/04/2025</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Fecha de fin</span>
                  <span className="font-semibold text-gray-800">30/06/2025</span>
                </div>
              </div>
            </div>

            {/* Card 2: Criterios de desempate */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Settings className="w-4 h-4 text-blue-600" />
                Criterios de desempate (en orden)
              </h2>
              <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside font-medium">
                <li className="p-2 bg-gray-50 rounded-md border border-gray-100">Diferencia de goles</li>
                <li className="p-2 bg-gray-50 rounded-md border border-gray-100">Goles a favor</li>
                <li className="p-2 bg-gray-50 rounded-md border border-gray-100">Resultado del partido entre los equipos empatados</li>
              </ol>
              <button className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors py-1">
                Ver / Editar criterios
              </button>
            </div>

            {/* Card 3: Mensaje informativo automatizado */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Importante</h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  La tabla se actualiza automáticamente al confirmarse cada acta de partido.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}