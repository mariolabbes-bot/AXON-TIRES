export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-vani-cyan/10 rounded-full blur-2xl group-hover:bg-vani-cyan/20 transition-all"></div>
          <div className="text-vani-cyan text-xs font-mono uppercase tracking-widest mb-2">Nodos Activos (Base)</div>
          <div className="text-4xl font-light text-white">12 <span className="text-lg text-slate-500">/ 15</span></div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-vani-accent/10 rounded-full blur-2xl group-hover:bg-vani-accent/20 transition-all"></div>
          <div className="text-vani-accent text-xs font-mono uppercase tracking-widest mb-2">Activos Operativos</div>
          <div className="text-4xl font-light text-white">124</div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
          <div className="text-orange-400 text-xs font-mono uppercase tracking-widest mb-2">Planta Recauchaje</div>
          <div className="text-4xl font-light text-white">8</div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group ring-1 ring-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-red-500/20 rounded-full blur-2xl group-hover:bg-red-500/30 transition-all"></div>
          <div className="text-red-400 text-xs font-mono uppercase tracking-widest mb-2">Anomalías Críticas</div>
          <div className="text-4xl font-bold text-red-500 glow-text">2</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Center / Alertas */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-light text-white tracking-wide">Action Center <span className="text-slate-500 font-mono text-sm ml-2">v1.0</span></h2>
            <button className="text-xs text-vani-cyan hover:text-white transition-colors">VER TODAS</button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-black/40 border border-red-500/20 p-5 rounded-xl hover:border-red-500/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                </div>
                <div>
                  <div className="text-red-400 font-medium tracking-wide">Pérdida de Presión Crítica (90 PSI)</div>
                  <div className="text-sm text-slate-400 mt-1 font-mono">ID: AX-1092 | Nodo: AB-CD-12 | Eje: 1D</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/50 text-sm rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                ANALIZAR NODO
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/40 border border-vani-accent/20 p-5 rounded-xl hover:border-vani-accent/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-vani-accent/10 flex items-center justify-center border border-vani-accent/30">
                  <div className="w-3 h-3 bg-vani-accent rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
                </div>
                <div>
                  <div className="text-vani-accent font-medium tracking-wide">Límite Kilométrico Superado</div>
                  <div className="text-sm text-slate-400 mt-1 font-mono">ID: AX-8831 | Vida: 120,450 KM | KPI: 98%</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-vani-accent/10 hover:bg-vani-accent text-vani-accent hover:text-black border border-vani-accent/50 text-sm font-bold rounded-lg transition-all shadow-[0_0_10px_rgba(250,204,21,0.2)] hover:shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                ROTAR ACTIVO
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de Bodega */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-light text-white tracking-wide">Bodega Central</h2>
          </div>
          
          <div className="space-y-5">
            <div className="flex justify-between items-center group">
              <span className="text-slate-400 font-light tracking-wider group-hover:text-white transition-colors">Stock Nuevo</span>
              <span className="text-white font-mono text-lg">45</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="bg-vani-cyan h-full w-[75%] shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
            </div>

            <div className="flex justify-between items-center group pt-2">
              <span className="text-slate-400 font-light tracking-wider group-hover:text-white transition-colors">Recauchados</span>
              <span className="text-white font-mono text-lg">12</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="bg-vani-accent h-full w-[20%] shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
            </div>

            <div className="flex justify-between items-center group pt-2">
              <span className="text-slate-400 font-light tracking-wider group-hover:text-white transition-colors">Reparación</span>
              <span className="text-white font-mono text-lg">3</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full w-[5%] shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
            </div>

            <div className="flex justify-between items-center pt-6 mt-4 border-t border-white/10">
              <span className="text-slate-300 font-light tracking-widest uppercase">Total Stock</span>
              <span className="text-vani-cyan font-bold text-3xl glow-text">60</span>
            </div>
          </div>
          
          <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all tracking-widest text-sm font-light hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            GESTIONAR INVENTARIO
          </button>
        </div>
      </div>
    </div>
  );
}
