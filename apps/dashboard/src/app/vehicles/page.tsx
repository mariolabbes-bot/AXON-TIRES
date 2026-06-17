export default function VehiclesModulePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group flex justify-between items-center">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-vani-cyan/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-light text-white tracking-wide mb-1">Nodos de <span className="text-vani-cyan glow-text font-bold">Flota</span></h1>
          <p className="text-slate-400 font-light">Gestión central de vehículos, asignación de neumáticos y activos generales.</p>
        </div>
        <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all tracking-widest text-sm font-light hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          + AÑADIR NODO
        </button>
      </div>

      {/* Grid de Vehículos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Vehículo Card - Principal */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border border-vani-cyan/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-vani-cyan/5 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h2 className="text-2xl font-bold text-white tracking-widest">AB-CD-12</h2>
                <div className="w-2 h-2 rounded-full bg-vani-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></div>
              </div>
              <div className="text-sm text-slate-400 font-mono tracking-wide">ID: RFID-TRUCK-001 | Tractocamión 6x4</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Odómetro</div>
              <div className="text-xl font-light text-white font-mono">151,000 KM</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
            <button className="py-3 bg-vani-cyan/10 hover:bg-vani-cyan border border-vani-cyan/30 hover:border-vani-cyan text-vani-cyan hover:text-black rounded-lg transition-all text-xs tracking-widest font-bold shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              ASIGNAR NEUMÁTICO
            </button>
            <button className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all text-xs tracking-widest font-light">
              ASIGNAR ACTIVO GENERAL
            </button>
          </div>

          <div className="flex space-x-4">
            {/* Activos Generales Asignados */}
            <div className="w-1/3 border-r border-white/10 pr-4 space-y-3">
              <h3 className="text-xs text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Activos (2)</h3>
              <div className="flex items-center space-x-3 p-2 bg-black/20 rounded border border-white/5">
                <span className="text-lg">🧯</span>
                <div>
                  <div className="text-xs text-slate-200">Extintor 10Kg</div>
                  <div className="text-[10px] text-slate-500 font-mono">SN-EXT-1001</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-black/20 rounded border border-white/5">
                <span className="text-lg">🚩</span>
                <div>
                  <div className="text-xs text-slate-200">Pértica LED</div>
                  <div className="text-[10px] text-slate-500 font-mono">SN-PTR-092</div>
                </div>
              </div>
            </div>

            {/* Esquema de Neumáticos (Minimalista) */}
            <div className="w-2/3 pl-2 flex flex-col items-center justify-center space-y-6 py-4">
              
              {/* Eje 1 */}
              <div className="flex items-center w-full justify-center space-x-8">
                <div className="w-10 h-16 rounded border border-vani-cyan/50 bg-vani-cyan/10 flex items-center justify-center cursor-pointer hover:bg-vani-cyan/20 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] relative group">
                  <span className="text-xs font-mono text-vani-cyan">1I</span>
                  <div className="hidden group-hover:block absolute bottom-full mb-2 w-40 bg-black/90 border border-white/10 p-3 rounded-lg backdrop-blur-xl z-20">
                    <div className="text-white text-xs font-bold mb-1">FM-2026-001</div>
                    <div className="text-vani-cyan text-[10px] mb-1">110 PSI • 35°C</div>
                    <div className="text-slate-400 text-[10px] font-mono">KM: 10,000</div>
                  </div>
                </div>
                <div className="w-20 h-1 bg-white/10"></div>
                <div className="w-10 h-16 rounded border border-vani-cyan/50 bg-vani-cyan/10 flex items-center justify-center cursor-pointer hover:bg-vani-cyan/20 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                  <span className="text-xs font-mono text-vani-cyan">1D</span>
                </div>
              </div>

              {/* Eje 2 */}
              <div className="flex items-center w-full justify-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-10 h-16 rounded border border-vani-cyan/50 bg-vani-cyan/10 flex items-center justify-center cursor-pointer"><span className="text-xs font-mono text-vani-cyan">2EI</span></div>
                  <div className="w-10 h-16 rounded border border-white/20 bg-black/40 flex items-center justify-center cursor-pointer"><span className="text-xs font-mono text-slate-500">+</span></div>
                </div>
                <div className="w-20 h-1 bg-white/10"></div>
                <div className="flex space-x-1">
                  <div className="w-10 h-16 rounded border border-white/20 bg-black/40 flex items-center justify-center cursor-pointer"><span className="text-xs font-mono text-slate-500">+</span></div>
                  <div className="w-10 h-16 rounded border border-vani-cyan/50 bg-vani-cyan/10 flex items-center justify-center cursor-pointer"><span className="text-xs font-mono text-vani-cyan">2ED</span></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Vehículo Secundario (Ejemplo) */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h2 className="text-2xl font-bold text-slate-300 tracking-widest">XY-ZZ-99</h2>
              </div>
              <div className="text-sm text-slate-500 font-mono tracking-wide">ID: RFID-TRUCK-002 | Semirremolque</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-600 uppercase tracking-widest">Odómetro</div>
              <div className="text-xl font-light text-slate-400 font-mono">22,400 KM</div>
            </div>
          </div>
          
          <div className="h-48 border border-dashed border-white/10 rounded-xl flex items-center justify-center">
            <span className="text-slate-500 tracking-widest text-xs uppercase">Sin Activos Asignados</span>
          </div>
        </div>

      </div>
    </div>
  );
}
