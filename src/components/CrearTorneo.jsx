// src/components/CrearTorneo.jsx
import { useState } from 'react';
import { CriteriosDesempate } from './CriteriosDesempate';

export function CrearTorneo() {
  // 1. CORREGIDO: Se agregaron todos los campos necesarios al estado inicial
  const [formData, setFormData] = useState({
    nombreTorneo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    formato: 'liga', // liga o eliminacion
    cantidadMaximaEquipos: '',
    maximoJugadoresPorEquipo: '',
    reglamento: '',
    criterios: null
  });

  const handleCriteriosChange = (criteriosOrdenados) => {
    setFormData(prev => ({ ...prev, criterios: criteriosOrdenados }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones Numéricas
    const maxEquipos = parseInt(formData.cantidadMaximaEquipos, 10);
    const maxJugadores = parseInt(formData.maximoJugadoresPorEquipo, 10);

    if (maxEquipos <= 0 || isNaN(maxEquipos)) {
      alert("⚠️ Error: La cantidad máxima de equipos debe ser un número mayor a 0.");
      return;
    }
    if (maxJugadores <= 0 || isNaN(maxJugadores)) {
      alert("⚠️ Error: El máximo de jugadores por equipo debe ser un número mayor a 0.");
      return;
    }
    if (maxEquipos < 2) {
      alert("⚠️ Para armar un fixture coherente se necesitan al menos 2 equipos registrados.");
      return;
    }

    // Control Cronológico de Fechas
    if (formData.fechaFin) {
      const inicio = new Date(formData.fechaInicio);
      const fin = new Date(formData.fechaFin);

      if (fin < inicio) {
        alert("⚠️ Error: La fecha de finalización no puede ser anterior a la fecha de inicio del torneo.");
        return;
      }
    }

    // Si todo está correcto, procesa el envío
    console.log("Datos validados y listos para enviar al Backend:", formData);
    alert("¡Torneo configurado y guardado con éxito!");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-left">
      <h2 className="text-2xl font-black text-slate-950">Crear Torneo</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección de Información General */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Información general</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del torneo *</label>
              <input 
                type="text" 
                required
                placeholder="Ej: Copa Verano 2026"
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
                value={formData.nombreTorneo}
                onChange={e => setFormData(prev => ({ ...prev, nombreTorneo: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Inicio *</label>
              <input 
                type="date" 
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
                value={formData.fechaInicio}
                onChange={e => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Fin (Opcional)</label>
              <input 
                type="date" 
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
                value={formData.fechaFin}
                onChange={e => setFormData(prev => ({ ...prev, fechaFin: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* 3. CORREGIDO: Sección de Configuración Numérica agregada al HTML */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Configuración de límites</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad Máxima de Equipos *</label>
              <input 
                type="number" 
                required
                min="1"
                placeholder="Ej: 16"
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
                value={formData.cantidadMaximaEquipos}
                onChange={e => setFormData(prev => ({ ...prev, cantidadMaximaEquipos: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Máximo de Jugadores por Equipo *</label>
              <input 
                type="number" 
                required
                min="1"
                placeholder="Ej: 22"
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
                value={formData.maximoJugadoresPorEquipo}
                onChange={e => setFormData(prev => ({ ...prev, maximoJugadoresPorEquipo: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* LLAMADO AL COMPONENTE DE NÉSTOR */}
        <CriteriosDesempate onChange={handleCriteriosChange} />

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 text-sm font-semibold text-white bg-lime-600 hover:bg-lime-500 rounded-md shadow transition-colors"
          >
            Crear Torneo
          </button>
        </div>
      </form>
    </div>
  );
}
