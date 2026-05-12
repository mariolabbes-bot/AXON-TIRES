export default function VehiclesModulePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Módulo de Vehículos y Configuración</h1>
        <button className="px-4 py-2 bg-axon-panel border border-axon-border text-white rounded hover:bg-slate-700 transition">
          + Añadir Vehículo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tarjeta de Vehículo Ejemplo */}
        <div className="bg-axon-panel border border-axon-border rounded-lg p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">AB-CD-12</h2>
              <div className="text-sm text-axon-muted">Tracto Camión • 6x4</div>
            </div>
            <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded border border-green-800">
              En Base (Check-In)
            </span>
          </div>

          <div className="mb-4">
            <div className="text-xs text-axon-muted uppercase">Odómetro Actual</div>
            <div className="text-lg font-medium text-white">450,120 KM</div>
          </div>

          {/* Esquema Rápido de Ejes (Mockup) */}
          <div className="bg-axon-bg border border-axon-border rounded p-4 mb-4 flex flex-col items-center space-y-4">
            {/* Eje 1 (Direccional) */}
            <div className="flex w-full justify-around px-8">
              <div className="w-8 h-12 bg-green-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-axon-accent group relative">
                <span className="text-[10px] font-bold text-black">1I</span>
                {/* Tooltip Hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-2 w-48 bg-axon-panel border border-axon-border p-2 rounded shadow-xl z-10 text-left">
                  <div className="text-white text-xs font-bold">AX-3341 (110 PSI)</div>
                  <div className="text-axon-muted text-[10px]">KM Posición: 45,100</div>
                  <div className="text-axon-muted text-[10px]">Surco: 14mm</div>
                </div>
              </div>
              <div className="w-10 h-2 bg-axon-border my-auto"></div> {/* Eje físico */}
              <div className="w-8 h-12 bg-green-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-axon-accent relative group">
                <span className="text-[10px] font-bold text-black">1D</span>
                {/* Tooltip Hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-2 w-48 bg-axon-panel border border-axon-border p-2 rounded shadow-xl z-10 text-left">
                  <div className="text-white text-xs font-bold">AX-3342 (109 PSI)</div>
                  <div className="text-axon-muted text-[10px]">KM Posición: 45,100</div>
                  <div className="text-axon-muted text-[10px]">Surco: 13.5mm</div>
                </div>
              </div>
            </div>

            {/* Eje 2 (Tracción Dual) */}
            <div className="flex w-full justify-around px-2 mt-4">
              <div className="flex space-x-1">
                <div className="w-8 h-12 bg-yellow-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center cursor-pointer"><span className="text-[10px] font-bold text-black">2EI</span></div>
                <div className="w-8 h-12 bg-yellow-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center cursor-pointer"><span className="text-[10px] font-bold text-black">2II</span></div>
              </div>
              <div className="w-16 h-2 bg-axon-border my-auto"></div>
              <div className="flex space-x-1">
                <div className="w-8 h-12 bg-red-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center cursor-pointer"><span className="text-[10px] font-bold text-black">2ID</span></div>
                <div className="w-8 h-12 bg-green-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center cursor-pointer"><span className="text-[10px] font-bold text-black">2ED</span></div>
              </div>
            </div>
            
             {/* Eje 3 (Tracción Dual) */}
             <div className="flex w-full justify-around px-2 mt-2">
              <div className="flex space-x-1">
                <div className="w-8 h-12 bg-green-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center"><span className="text-[10px] font-bold text-black">3EI</span></div>
                <div className="w-8 h-12 bg-green-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center"><span className="text-[10px] font-bold text-black">3II</span></div>
              </div>
              <div className="w-16 h-2 bg-axon-border my-auto"></div>
              <div className="flex space-x-1">
                <div className="w-8 h-12 bg-green-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center"><span className="text-[10px] font-bold text-black">3ID</span></div>
                <div className="w-8 h-12 bg-green-500 rounded-sm border-2 border-axon-panel flex flex-col items-center justify-center"><span className="text-[10px] font-bold text-black">3ED</span></div>
              </div>
            </div>
          </div>

          <button className="w-full py-2 bg-axon-border hover:bg-slate-600 text-white rounded transition text-sm font-medium">
            Ver Telemetría en Vivo
          </button>
        </div>

        {/* Otra tarjeta ... */}
        <div className="bg-axon-panel border border-axon-border rounded-lg p-5 flex flex-col justify-center items-center text-center opacity-50">
          <div className="text-4xl mb-2">🚛</div>
          <h2 className="text-xl font-bold text-white mb-1">XX-YY-99</h2>
          <div className="text-sm text-axon-muted mb-4">Semirremolque • Ejes 3</div>
          <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs rounded border border-blue-800">
            En Ruta
          </span>
        </div>
      </div>
    </div>
  );
}
