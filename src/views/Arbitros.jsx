import { useState } from "react";
import ArbitroWizard from "../components/ArbitroWizard";

export default function Arbitros() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Árbitros
          </h1>

          <p className="text-slate-500 mt-1">
            Gestioná los árbitros registrados en Global League.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
        >
          + Crear árbitro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-500 text-center py-10">
          Todavía no hay árbitros registrados.
        </p>
      </div>

      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsWizardOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl">
            <ArbitroWizard
              onVolver={() => setIsWizardOpen(false)}
              onArbitroCreado={(arbitro) => {
                console.log("Árbitro creado:", arbitro);
                setIsWizardOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
