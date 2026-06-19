'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export default function MobileInventory() {
  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  
  const [breakdown, setBreakdown] = useState<any>(null);
  const [scannedTags, setScannedTags] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get('/branches').then(res => setBranches(res)).catch(console.error);
  }, []);

  // Fetch breakdown when branch is selected
  useEffect(() => {
    if (selectedBranch && step === 2) {
      api.get(`/inventory/breakdown/${selectedBranch.id}`)
         .then(res => setBreakdown(res))
         .catch(console.error);
    }
  }, [selectedBranch, step]);

  const toggleScan = () => {
    if (isScanning) {
      // Stop scanning and Finish
      setIsScanning(false);
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      executeAudit();
    } else {
      // Start scanning
      setIsScanning(true);
      const allTags = [
        ...(breakdown?.tires_list || []),
        ...(breakdown?.assets_list || [])
      ].map(t => t.rfid);
      
      // Simulate reading tags rapidly
      let currentIndex = 0;
      scanIntervalRef.current = setInterval(() => {
        if (currentIndex < allTags.length) {
          const tag = allTags[currentIndex];
          setScannedTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
          currentIndex++;
        } else {
          // Maybe add one unknown tag for divergence testing
          if (currentIndex === allTags.length) {
              setScannedTags(prev => [...prev, "TAG-EXTINTOR-UNKNOWN"]);
              currentIndex++;
          }
        }
      }, 300);
    }
  };

  const executeAudit = async () => {
    try {
      const res = await api.post('/inventory', {
        branch_id: selectedBranch.id,
        scanned_rfids: scannedTags
      });
      setAuditResult(res.audit);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert('Error en auditoría');
    }
  };

  const getFoundCount = (state: string, isTire: boolean) => {
    if (!breakdown) return 0;
    const list = isTire ? breakdown.tires_list : breakdown.assets_list;
    const itemsOfState = list.filter((item:any) => item.state === state);
    const rfidOfState = itemsOfState.map((i:any) => i.rfid);
    return scannedTags.filter(tag => rfidOfState.includes(tag)).length;
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-3 mb-2">
        <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          ←
        </button>
        <h2 className="text-lg font-bold">Auditoría Bodega</h2>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Seleccione la Bodega a auditar</p>
          {branches.map((b:any) => (
             <button key={b.id} onClick={() => {setSelectedBranch(b); setStep(2);}} className="w-full bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-transparent hover:border-vani-cyan active:scale-95 transition-all">
                <span className="font-bold text-lg">{b.name}</span>
                <span className="text-xs text-vani-cyan uppercase tracking-widest font-bold">Seleccionar</span>
             </button>
          ))}
        </div>
      )}

      {step === 2 && breakdown && (
        <div className="space-y-4 flex flex-col">
           <div className="flex justify-between items-center border-b border-white/10 pb-2">
             <h3 className="text-sm font-bold text-vani-cyan uppercase tracking-widest">{selectedBranch.name}</h3>
             <button onClick={() => {setStep(1); setScannedTags([]);}} className="text-slate-500 underline text-xs">Cambiar</button>
           </div>
           
           <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-white/5">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Progreso</p>
                <div className="text-3xl font-black text-white">{scannedTags.length} <span className="text-sm text-slate-500 font-normal">leídos</span></div>
              </div>
              {isScanning && (
                <div className="flex items-center space-x-2">
                   <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                   <span className="text-xs text-red-400 font-bold uppercase tracking-widest">Escaneando...</span>
                </div>
              )}
           </div>

           {/* Tablas Dinámicas */}
           <div className="space-y-6 flex-1 overflow-y-auto">
             <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Neumáticos</h4>
                <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                  {breakdown.tires.length === 0 ? <div className="p-3 text-center text-xs text-slate-500">Sin stock</div> : 
                    breakdown.tires.map((t:any) => {
                      const found = getFoundCount(t.state, true);
                      const isComplete = found === t.count;
                      return (
                        <div key={t.state} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0">
                          <span className="text-sm font-bold text-slate-300">{t.state}</span>
                          <div className="flex items-center space-x-3">
                             <span className="text-xs text-slate-500">Esp: {t.count}</span>
                             <span className={`text-sm font-black px-2 py-0.5 rounded ${isComplete ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-white'}`}>{found}</span>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
             </div>

             <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Activos Generales</h4>
                <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                  {breakdown.assets.length === 0 ? <div className="p-3 text-center text-xs text-slate-500">Sin stock</div> : 
                    breakdown.assets.map((a:any) => {
                      const found = getFoundCount(a.category, false);
                      const isComplete = found === a.count;
                      return (
                        <div key={a.category} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0">
                          <span className="text-sm font-bold text-slate-300">{a.category}</span>
                          <div className="flex items-center space-x-3">
                             <span className="text-xs text-slate-500">Esp: {a.count}</span>
                             <span className={`text-sm font-black px-2 py-0.5 rounded ${isComplete ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-white'}`}>{found}</span>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
             </div>
           </div>

           <button onClick={toggleScan} className={`w-full font-bold py-5 rounded-xl text-lg shadow-lg relative overflow-hidden transition-all active:scale-95 ${isScanning ? 'bg-red-600 text-white border border-red-500' : 'bg-green-600 text-white border border-green-500'}`}>
              {isScanning ? 'FINALIZAR INVENTARIO' : 'INICIAR INVENTARIO'}
              {isScanning && <div className="absolute top-0 left-0 h-full w-full bg-black/10 animate-pulse"></div>}
           </button>
        </div>
      )}

      {step === 3 && auditResult && (
         <div className="space-y-6 mt-4">
            <h2 className="text-2xl font-bold text-center">Informe de Cuadratura</h2>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-800 p-4 rounded-xl text-center border border-white/5">
                  <div className="text-3xl font-black text-blue-400">{auditResult.total_scanned}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Leídos</div>
               </div>
               <div className={`p-4 rounded-xl text-center border ${auditResult.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className={`text-2xl font-black ${auditResult.status === 'COMPLETED' ? 'text-green-400' : 'text-red-400'}`}>
                    {auditResult.status === 'COMPLETED' ? 'EXITOSA' : 'DIVERGENCIA'}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Estado Final</div>
               </div>
            </div>

            {auditResult.status === 'WITH_DISCREPANCIES' && (
              <div className="space-y-4">
                 <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl">
                    <h3 className="font-bold text-red-400 mb-2 text-sm uppercase tracking-widest">Faltantes (No Leídos)</h3>
                    <div className="text-xs font-mono max-h-24 overflow-y-auto space-y-1">
                       {auditResult.missing_assets?.length === 0 ? <span className="text-slate-500">Ninguno</span> : 
                         auditResult.missing_assets?.map((r:string) => <div key={r} className="bg-black/30 px-2 py-1 rounded">{r}</div>)
                       }
                    </div>
                 </div>
                 <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-xl">
                    <h3 className="font-bold text-yellow-400 mb-2 text-sm uppercase tracking-widest">Sobrantes (No Registrados)</h3>
                    <div className="text-xs font-mono max-h-24 overflow-y-auto space-y-1">
                       {auditResult.extra_assets?.length === 0 ? <span className="text-slate-500">Ninguno</span> :
                         auditResult.extra_assets?.map((r:string) => <div key={r} className="bg-black/30 px-2 py-1 rounded">{r}</div>)
                       }
                    </div>
                 </div>
              </div>
            )}

            <button onClick={() => {setStep(1); setScannedTags([]); setAuditResult(null); setSelectedBranch(null);}} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl active:scale-95 transition-all">
               Finalizar y Volver
            </button>
         </div>
      )}
    </div>
  );
}
