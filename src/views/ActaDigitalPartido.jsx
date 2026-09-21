import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  UserCheck, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Edit3, 
  ShieldCheck,
  Check
} from 'lucide-react';

export default function ActaDigitalPartido() {
  // Estado del Partido y Metadatos del Acta
  const [partido, setPartido] = useState({
    id: 'PAR-2025-042',
    torneo: 'Liga Global 2025',
    jornada: 'Jornada 5',
    fechaHora: '15/06/2025 - 18:00 Hs',
    cancha: 'Cancha 1 - Sede Central',
    arbitroPrincipal: 'Carlos Gómez',
    equipoLocal: { id: 'EQ-1', nombre: 'Tigres FC' },
    equipoVisitante: { id: 'EQ-2', nombre: 'Leones FC' },
    golesLocal: 2,
    golesVisitante: 1,
    estadoActa: 'borrador' // 'borrador' | 'firmada' | 'cerrada'
  });

  // Plantillas de Jugadores Mock
  const [plantillaLocal] = useState([
    { id: 'J-101', dorsal: 1, nombre: 'Juan Pérez', posicion: 'POR', convocado: true },
    { id: 'J-102', dorsal: 4, nombre: 'Mateo Rossi', posicion: 'DEF', convocado: true },
    { id: 'J-103', dorsal: 8, nombre: 'Lucas Silva', posicion: 'MED', convocado: true },
    { id: 'J-104', dorsal: 10, nombre: 'Diego Fernández', posicion: 'DEL', convocado: true },
    { id: 'J-105', dorsal: 9, nombre: 'Nicolás Martínez', posicion: 'DEL', convocado: true },
  ]);

  const [plantillaVisitante] = useState([
    { id: 'J-201', dorsal: 12, nombre: 'Santiago López', posicion: 'POR', convocado: true },
    { id: 'J-202', dorsal: 3, nombre: 'Tomás Benítez', posicion: 'DEF', convocado: true },
    { id: 'J-203', dorsal: 5, nombre: 'Javier Acosta', posicion: 'MED', convocado: true },
    { id: 'J-204', dorsal: 7, nombre: 'Ezequiel Romero', posicion: 'DEL', convocado: true },
    { id: 'J-205', dorsal: 11, nombre: 'Agustín Castro', posicion: 'DEL', convocado: true },
  ]);

  // Lista de Incidencias / Eventos registrados
  const [incidencias, setIncidencias] = useState([
    { id: 1, minuto: '14', equipo: 'Tigres FC', tipo: 'Gol', jugador: 'Diego Fernández (#10)', detalle: 'Jugada de campo' },
    { id: 2, minuto: '32', equipo: 'Leones FC', tipo: 'Tarjeta Amarilla', jugador: 'Tomás Benítez (#3)', detalle: 'Falta táctica' },
    { id: 3, minuto: '58', equipo: 'Tigres FC', tipo: 'Gol', jugador: 'Nicolás Martínez (#9)', detalle: 'Cabeza' },
    { id: 4, minuto: '75', equipo: 'Leones FC', tipo: 'Gol', jugador: 'Ezequiel Romero (#7)', detalle: 'Penal' },
  ]);

  // Formulario para registrar nueva incidencia
  const [nuevaIncidencia, setNuevaIncidencia] = useState({
    minuto: '',
    equipo: 'Tigres FC',
    tipo: 'Gol',
    jugador: '',
    detalle: ''
  });

  const [observaciones, setObservaciones] = useState('');
  const [firmaArbitro, setFirmaArbitro] = useState(false);

  // Handlers
  const handleAgregarIncidencia = (e) => {
    e.preventDefault();
    if (!nuevaIncidencia.minuto || !nuevaIncidencia.jugador) return;

    const item = {
      id: Date.now(),
      ...nuevaIncidencia
    };

    setIncidencias([...incidencias, item]);
    setNuevaIncidencia({ minuto: '', equipo: 'Tigres FC', tipo: 'Gol', jugador: '', detalle: '' });
  };

  const handleEliminarIncidencia = (id) => {
    setIncidencias(incidencias.filter(inc => inc.id !== id));
  };

  const handleCerrarActa = () => {
    if (!firmaArbitro) {
      alert('Debe incluir la firma/conformidad del árbitro antes de cerrar el acta.');
      return;
    }
    setPartido({ ...partido, estadoActa: 'cerrada' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Barra superior de navegación y acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver a Partidos
          </button>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              partido.estadoActa === 'cerrada' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {partido.estadoActa === 'cerrada' ? 'Acta Confirmada & Cerrada' : 'Borrador en Edición'}
            </span>

            {partido.estadoActa !== 'cerrada' && (
              <>
                <button 
                  onClick={() => alert('Borrador guardado correctamente.')}
                  className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4 text-gray-500" />
                  Guardar Borrador
                </button>

                <button 
                  onClick={handleCerrarActa}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Firmar y Finalizar Acta
                </button>
              </>
            )}
          </div>
        </div>

        {/* Marcador Principal y Cabecera del Partido */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-900 text-white p-4 px-6 flex flex-wrap justify-between items-center gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" /> {partido.torneo} — {partido.jornada}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> {partido.fechaHora} | {partido.cancha}
            </span>
            <span>Árbitro: <strong>{partido.arbitroPrincipal}</strong></span>
          </div>

          <div className="p-6 grid grid-cols-3 items-center text-center">
            {/* Equipo Local */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-2xl flex items-center justify-center border-2 border-blue-200">
                T
              </div>
              <h2 className="text-xl font-bold text-gray-900">{partido.equipoLocal.nombre}</h2>
              <span className="text-xs text-gray-500 uppercase font-semibold">Local</span>
            </div>

            {/* Resultado */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
                <input 
                  type="number" 
                  min="0"
                  value={partido.golesLocal}
                  disabled={partido.estadoActa === 'cerrada'}
                  onChange={(e) => setPartido({...partido, golesLocal: parseInt(e.target.value) || 0})}
                  className="w-16 text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none p-1"
                />
                <span className="text-gray-400">:</span>
                <input 
                  type="number" 
                  min="0"
                  value={partido.golesVisitante}
                  disabled={partido.estadoActa === 'cerrada'}
                  onChange={(e) => setPartido({...partido, golesVisitante: parseInt(e.target.value) || 0})}
                  className="w-16 text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none p-1"
                />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md mt-3 border border-emerald-200">
                Resultado Oficial
              </span>
            </div>

            {/* Equipo Visitante */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 font-bold text-2xl flex items-center justify-center border-2 border-amber-200">
                L
              </div>
              <h2 className="text-xl font-bold text-gray-900">{partido.equipoVisitante.nombre}</h2>
              <span className="text-xs text-gray-500 uppercase font-semibold">Visitante</span>
            </div>
          </div>
        </div>

        {/* Grid Principal: Módulo de Registro y Eventos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda / Central: Carga de Incidencias & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Formulario de Registro de Eventos (Solo en estado Borrador) */}
            {partido.estadoActa !== 'cerrada' && (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Plus className="w-4 h-4 text-blue-600" />
                  Registrar Incidencia / Evento
                </h3>

                <form onSubmit={handleAgregarIncidencia} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Minuto</label>
                    <input 
                      type="number" 
                      placeholder="Ej: 45"
                      value={nuevaIncidencia.minuto}
                      onChange={(e) => setNuevaIncidencia({...nuevaIncidencia, minuto: e.target.value})}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo</label>
                    <select 
                      value={nuevaIncidencia.equipo}
                      onChange={(e) => setNuevaIncidencia({...nuevaIncidencia, equipo: e.target.value})}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="Tigres FC">Tigres FC</option>
                      <option value="Leones FC">Leones FC</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Evento</label>
                    <select 
                      value={nuevaIncidencia.tipo}
                      onChange={(e) => setNuevaIncidencia({...nuevaIncidencia, tipo: e.target.value})}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="Gol">Gol</option>
                      <option value="Tarjeta Amarilla">Tarjeta Amarilla</option>
                      <option value="Tarjeta Roja">Tarjeta Roja</option>
                      <option value="Cambio">Sustitución</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Jugador</label>
                    <input 
                      type="text" 
                      placeholder="Nombre o N° Dorsal"
                      value={nuevaIncidencia.jugador}
                      onChange={(e) => setNuevaIncidencia({...nuevaIncidencia, jugador: e.target.value})}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-10">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Detalle / Observación corta</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Tiro libre / Falta antideportiva"
                      value={nuevaIncidencia.detalle}
                      onChange={(e) => setNuevaIncidencia({...nuevaIncidencia, detalle: e.target.value})}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold p-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Añadir
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Timeline / Cronograma de Incidencias */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Cronograma de Incidencias Registradas
              </h3>

              {incidencias.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No se han registrado incidencias en el acta.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {incidencias.sort((a,b) => parseInt(a.minuto) - parseInt(b.minuto)).map((inc) => (
                    <div key={inc.id} className="py-3 flex items-center justify-between text-sm hover:bg-gray-50 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center">
                          {inc.minuto}'
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{inc.equipo}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              inc.tipo === 'Gol' ? 'bg-emerald-100 text-emerald-800' :
                              inc.tipo === 'Tarjeta Amarilla' ? 'bg-amber-100 text-amber-800' :
                              inc.tipo === 'Tarjeta Roja' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {inc.tipo}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            <strong>{inc.jugador}</strong> {inc.detalle ? `— ${inc.detalle}` : ''}
                          </p>
                        </div>
                      </div>

                      {partido.estadoActa !== 'cerrada' && (
                        <button 
                          onClick={() => handleEliminarIncidencia(inc.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Eliminar evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Planillas / Alineaciones de Equipos */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Alineaciones y Control de Jugadores
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tabla Tigres FC */}
                <div>
                  <h4 className="font-bold text-sm text-gray-800 mb-2 border-b pb-1">Tigres FC (Local)</h4>
                  <ul className="space-y-1 text-xs">
                    {plantillaLocal.map(j => (
                      <li key={j.id} className="flex justify-between items-center p-1.5 bg-gray-50 rounded">
                        <span><strong>#{j.dorsal}</strong> {j.nombre} ({j.posicion})</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Presente
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tabla Leones FC */}
                <div>
                  <h4 className="font-bold text-sm text-gray-800 mb-2 border-b pb-1">Leones FC (Visitante)</h4>
                  <ul className="space-y-1 text-xs">
                    {plantillaVisitante.map(j => (
                      <li key={j.id} className="flex justify-between items-center p-1.5 bg-gray-50 rounded">
                        <span><strong>#{j.dorsal}</strong> {j.nombre} ({j.posicion})</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Presente
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Observaciones & Firma del Árbitro */}
          <div className="space-y-6">
            
            {/* Informe de Observaciones */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Observaciones del Árbitro
              </h3>

              <textarea 
                rows="5"
                placeholder="Escriba comentarios, conductas antideportivas, reclamos de delegados o novedades del encuentro..."
                value={observaciones}
                disabled={partido.estadoActa === 'cerrada'}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 text-gray-800"
              />
            </div>

            {/* Conformidad y Firma Digital */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Cierre y Conformidad Digital
              </h3>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p>Una vez cerrada el acta, la información impactará directamente en la tabla de posiciones y estadísticas de goleadores/sanciones.</p>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={firmaArbitro}
                    disabled={partido.estadoActa === 'cerrada'}
                    onChange={(e) => setFirmaArbitro(e.target.checked)}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-xs text-gray-700 leading-tight">
                    Doy fe de la exactitud de los datos volcados en esta acta digital como Árbitro Principal del encuentro (<strong>{partido.arbitroPrincipal}</strong>).
                  </span>
                </label>
              </div>

              {partido.estadoActa === 'cerrada' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs text-center font-bold">
                  ✓ Acta firmada digitalmente el {new Date().toLocaleDateString()}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}