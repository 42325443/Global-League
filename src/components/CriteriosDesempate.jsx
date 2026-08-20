import { useState } from 'react';

const CRITERIOS_DISPONIBLES = [
  { id: 'dg', name: 'Diferencia de goles' },
  { id: 'gf', name: 'Goles a favor' },
  { id: 'rm', name: 'Resultado mutuo entre equipos empatados' },
  { id: 'fp', name: 'Fair Play (Menos tarjetas)' }
];

export function CriteriosDesempate({ onChange }) {
  const [criterios, setCriterios] = useState({
    primero: '',
    segundo: '',
    tercero: ''
  });

  const handleSelectChange = (prioridad, valor) => {
    const nuevosCriterios = { ...criterios, [prioridad]: valor };
    setCriterios(nuevosCriterios);
    if (onChange) {
      onChange(nuevosCriterios);
    }
  };

  const isOptionDisabled = (optionId, currentPrioridad) => {
    return Object.entries(criterios).some(
      ([prioridad, valor]) => prioridad !== currentPrioridad && valor === optionId
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
      <h3 className="text-lg font-bold text-slate-900 mb-1">Sistema de desempate</h3>
      <p className="text-xs text-slate-500 mb-4">
        Definí el orden de prioridad de los criterios de desempate antes del inicio del torneo.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">1er criterio</label>
          <select
            value={criterios.primero}
            onChange={(e) => handleSelectChange('primero', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
          >
            <option value="">Seleccione un criterio</option>
            {CRITERIOS_DISPONIBLES.map((cri) => (
              <option key={cri.id} value={cri.id} disabled={isOptionDisabled(cri.id, 'primero')}>
                {cri.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">2do criterio</label>
          <select
            value={criterios.segundo}
            onChange={(e) => handleSelectChange('segundo', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
            disabled={!criterios.primero}
          >
            <option value="">Seleccione un criterio</option>
            {CRITERIOS_DISPONIBLES.map((cri) => (
              <option key={cri.id} value={cri.id} disabled={isOptionDisabled(cri.id, 'segundo')}>
                {cri.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">3er criterio</label>
          <select
            value={criterios.tercero}
            onChange={(e) => handleSelectChange('tercero', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
            disabled={!criterios.segundo}
          >
            <option value="">Seleccione un criterio</option>
            {CRITERIOS_DISPONIBLES.map((cri) => (
              <option key={cri.id} value={cri.id} disabled={isOptionDisabled(cri.id, 'tercero')}>
                {cri.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
