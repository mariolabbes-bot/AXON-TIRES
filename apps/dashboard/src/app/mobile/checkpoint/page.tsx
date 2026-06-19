'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export default function MobileCheckpoint() {
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [eventType, setEventType] = useState<'SALIDA_A_RUTA'|'LLEGADA_A_BASE'|null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [scannedTags, setScannedTags] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get('/vehicles').then(res => setVehicles(res)).catch(console.error);
    api.get('/branches').then(res => setBranches(res)).catch(console.error);
  }, []);

  const selectVehicle = (v: any) => {
    if (eventType === 'LLEGADA_A_BASE' && !selectedBranch) {
      alert("Seleccione la sucursal de destino primero");
      return;
    }
    setSelectedVehicle(v);
    setStep(3);
  };

  const startScan = () => {
    setIsScanning(true);
    setScannedTags([]);
    
    // We want to simulate reading all assets, and all tires EXCEPT one.
    // We will purposely skip the very first tire.
    const allAssignedTags: string[] = [];
    
    if (selectedVehicle?.tires && selectedVehicle.tires.length > 0) {
      // Skip index 0 to force a divergence
      const tiresToRead = selectedVehicle.tires.slice(1).map((t:any) => t.fire_mark_id);
      allAssignedTags.push(...tiresToRead);
    }
    
    if (selectedVehicle?.assets && selectedVehicle.assets.length > 0) {
      const assetsToRead = selectedVehicle.assets.map((a:any) => a.rfid_id);
      allAssignedTags.push(...assetsToRead);
    }
    
    // Also simulate reading 1 random extra tag to make it interesting? The user just asked to NOT find 1 tire.
    
    let currentIndex = 0;
    scanIntervalRef.current = setInterval(() => {
      if (currentIndex < allAssignedTags.length) {
        const tag = allAssignedTags[currentIndex];
        setScannedTags(prev => [...prev, tag]);
        currentIndex++;
      } else {
        setIsScanning(false);
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      }
    }, 300);
  };

  const completeCheckpoint = async () => {
    try {
      const res = await api.post('/checkpoints', {
        vehicle_id: selectedVehicle.id,
        branch_id: eventType === 'LLEGADA_A_BASE' ? selectedBranch : selectedVehicle.branch_id,
        event_type: eventType,
        scanned_rfids: scannedTags
      });
      setValidationResult(res);
      setStep(4);
    } catch (e) {
      console.error(e);
      alert('Error en checkpoint');
    }
  };

  const getAxleLayout = (config: string) => {
    const layouts: any = {
      '6x4': [
        { name: 'Dirección', positions: ['1EI', '1ED'] },
        { name: 'Tracción 1', positions: ['2EI', '2II', '2ID', '2ED'] },
        { name: 'Tracción 2', positions: ['3EI', '3II', '3ID', '3ED'] }
      ]
    };
    return layouts[config] || layouts['6x4'];
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Header with back button */}
      <div className="flex items-center space-x-3 mb-2">
        <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          ←
        </button>
        <h2 className="text-lg font-bold">Punto de Control</h2>
      </div>

      {step === 1 && (
        <div className="space-y-4 mt-8">
           <h3 className="text-xl font-bold mb-4 text-center">Seleccione Tipo de Control</h3>
           <button onClick={() => { setEventType('SALIDA_A_RUTA'); setStep(2); }} className="w-full bg-vani-cyan/20 border border-vani-cyan text-vani-cyan py-8 rounded-xl font-bold text-xl mb-4 transition-all active:scale-95">Salida a Ruta</button>
           <button onClick={() => { setEventType('LLEGADA_A_BASE'); setStep(2); }} className="w-full bg-orange-500/20 border border-orange-500 text-orange-400 py-8 rounded-xl font-bold text-xl transition-all active:scale-95">Llegada a Base</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/10 pb-2">
            <span className={eventType === 'SALIDA_A_RUTA' ? 'text-vani-cyan' : 'text-orange-400'}>
               {eventType === 'SALIDA_A_RUTA' ? 'Salida a Ruta' : 'Llegada a Base'}
            </span>
            <button onClick={() => setStep(1)} className="text-slate-500 underline text-xs">Cambiar</button>
          </div>
          
          {eventType === 'LLEGADA_A_BASE' && (
            <div className="mb-4 bg-slate-800/50 p-4 rounded-xl border border-white/5">
              <label className="text-xs text-slate-400 uppercase mb-2 block font-bold">1. Seleccionar Sucursal de Destino</label>
              <select className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 outline-none text-white" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                 <option value="">Seleccione Sucursal...</option>
                 {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
            <label className="text-xs text-slate-400 uppercase mb-2 block font-bold">{eventType === 'LLEGADA_A_BASE' ? '2. Identificar Vehículo' : '1. Identificar Vehículo'}</label>
            <input type="text" placeholder="Dispare RFID al Camión..." className="w-full bg-slate-900 border border-white/10 rounded-lg p-4 text-center text-lg font-mono focus:border-vani-cyan outline-none" />
            
            <div className="mt-6 space-y-2">
              <h3 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Simulación Manual</h3>
              {vehicles.map((v:any) => (
                <button key={v.id} onClick={() => selectVehicle(v)} className="w-full bg-slate-900/50 p-3 rounded-lg flex justify-between items-center border border-transparent hover:border-white/20 active:scale-95 transition-all">
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-white">{v.plate}</span>
                    <span className="text-[10px] text-slate-400">{v.brand} {v.model}</span>
                  </div>
                  <span className={`text-[8px] px-2 py-1 rounded-full uppercase font-bold ${v.status === 'EN_RUTA' ? 'bg-orange-500/20 text-orange-400' : 'bg-vani-cyan/20 text-vani-cyan'}`}>{v.status || 'EN_BASE'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && selectedVehicle && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">{selectedVehicle.plate}</h3>
              <p className="text-xs text-slate-400">Config: {selectedVehicle.axle_config}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Total</div>
              <div className="text-lg font-bold">{scannedTags.length} / {(selectedVehicle.tires?.length || 0) + (selectedVehicle.assets?.length || 0)}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-xl p-4 relative overflow-hidden flex flex-col items-center py-8">
            {/* Visual Diagram */}
            {getAxleLayout(selectedVehicle.axle_config).map((axle:any, idx:number) => (
              <div key={idx} className="w-full flex flex-col items-center mb-6">
                <div className="flex justify-between w-[90%] z-10">
                  <div className="flex space-x-1">
                    {axle.positions.filter((p:string) => p.endsWith('I')).reverse().map((pos:string) => {
                      const tire = selectedVehicle.tires?.find((t:any) => t.axle_position === pos);
                      const isRead = tire && scannedTags.includes(tire.fire_mark_id);
                      return (
                        <div key={pos} className={`w-8 h-16 rounded flex items-center justify-center font-bold text-[8px] transition-all
                            ${isRead ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-105' 
                            : (tire ? 'bg-slate-700 text-white border border-white/20' : 'bg-transparent border border-dashed border-white/10 text-slate-600')}`}>
                          {isRead ? 'OK' : pos}
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-8 h-8 bg-slate-800 rounded-full border border-white/10 flex items-center justify-center shadow-lg text-[6px] text-slate-500 uppercase">{axle.name.substring(0,3)}</div>
                  <div className="flex space-x-1">
                    {axle.positions.filter((p:string) => p.endsWith('D')).map((pos:string) => {
                      const tire = selectedVehicle.tires?.find((t:any) => t.axle_position === pos);
                      const isRead = tire && scannedTags.includes(tire.fire_mark_id);
                      return (
                        <div key={pos} className={`w-8 h-16 rounded flex items-center justify-center font-bold text-[8px] transition-all
                            ${isRead ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-105' 
                            : (tire ? 'bg-slate-700 text-white border border-white/20' : 'bg-transparent border border-dashed border-white/10 text-slate-600')}`}>
                          {isRead ? 'OK' : pos}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div className="absolute top-0 bottom-0 w-2 bg-slate-800 z-0"></div>
          </div>

          {/* Activos Generales */}
          {selectedVehicle.assets && selectedVehicle.assets.length > 0 && (
            <div className="bg-slate-900 border border-white/5 rounded-xl p-4">
               <h4 className="text-xs uppercase font-bold text-slate-400 mb-3">Activos Generales</h4>
               <div className="grid grid-cols-2 gap-2">
                 {selectedVehicle.assets.map((a:any) => {
                   const isRead = scannedTags.includes(a.rfid_id);
                   return (
                     <div key={a.id} className={`p-2 rounded-lg border text-xs flex justify-between items-center transition-all ${isRead ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
                        <span>{a.asset_type}</span>
                        {isRead && <span>✓</span>}
                     </div>
                   )
                 })}
               </div>
            </div>
          )}

          <div className="flex space-x-3">
             <button onClick={startScan} disabled={isScanning} className={`flex-1 font-bold py-4 rounded-xl text-lg shadow-lg relative overflow-hidden transition-all ${isScanning ? 'bg-vani-cyan/50 text-white cursor-not-allowed' : 'bg-vani-cyan text-black active:scale-95'}`}>
                {isScanning ? 'LEYENDO...' : 'GATILLAR RFID'}
                {isScanning && <div className="absolute top-0 left-0 h-full w-full bg-white/30 animate-pulse"></div>}
             </button>
          </div>

          {!isScanning && scannedTags.length > 0 && (
             <button onClick={completeCheckpoint} className="w-full bg-slate-800 border border-white/10 text-white font-bold py-3 rounded-xl mt-2 active:scale-95 transition-all">
                Cerrar y Validar
             </button>
          )}

        </div>
      )}

      {step === 4 && validationResult && (
        <div className="space-y-4 text-center mt-8">
           <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(0,0,0,0.5)]
              ${validationResult.analysis.status === 'OK' ? 'bg-green-500/20 text-green-400 border-2 border-green-500' : 'bg-red-500/20 text-red-400 border-2 border-red-500 animate-pulse'}`}>
              {validationResult.analysis.status === 'OK' ? '✓' : '✗'}
           </div>
           
           <h2 className="text-2xl font-bold text-white">
              {validationResult.analysis.status === 'OK' ? 'Cuadratura Exitosa' : 'Divergencia Detectada'}
           </h2>
           <p className="text-sm font-bold uppercase tracking-widest text-slate-400">El vehículo ahora está {eventType === 'SALIDA_A_RUTA' ? 'EN RUTA' : 'EN BASE'}</p>
           
           {validationResult.analysis.status === 'DIVERGENTE' && (
             <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-left space-y-3 mt-4">
                <p className="text-red-300 font-bold text-sm">⚠️ Se ha notificado al supervisor.</p>
                
                {validationResult.analysis.missing_rfids.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase text-slate-400 mb-1 border-b border-white/10 pb-1">Faltan Físicamente:</h4>
                    {validationResult.analysis.missing_rfids.map((r:string) => {
                      // Try to match it to a tire or asset to display friendly name
                      const tire = selectedVehicle.tires?.find((t:any) => t.fire_mark_id === r);
                      const asset = selectedVehicle.assets?.find((a:any) => a.rfid_id === r);
                      const label = tire ? `Neumático (Pos: ${tire.axle_position}) - ${r}` : (asset ? `Activo: ${asset.asset_type} - ${r}` : r);
                      return <div key={r} className="text-sm font-mono text-red-400 py-1">{label}</div>
                    })}
                  </div>
                )}
                
                {validationResult.analysis.unknown_rfids.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase text-slate-400 mb-1 border-b border-white/10 pb-1 mt-2">Tags No Reconocidos:</h4>
                    {validationResult.analysis.unknown_rfids.map((r:string) => <div key={r} className="text-sm font-mono text-yellow-400 py-1">{r}</div>)}
                  </div>
                )}
             </div>
           )}

           <button onClick={() => {setStep(1); setScannedTags([]); setSelectedVehicle(null); setValidationResult(null); setEventType(null); setSelectedBranch('');}} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold mt-8 active:scale-95 transition-all">
              Finalizar y Volver
           </button>
        </div>
      )}

    </div>
  );
}
