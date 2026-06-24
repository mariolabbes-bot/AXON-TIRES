'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function MobileTireAssign() {
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableTires, setAvailableTires] = useState<any[]>([]);
  const [searchVehicle, setSearchVehicle] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedTire, setSelectedTire] = useState<any>(null);
  const [odometer, setOdometer] = useState<number>(0);
  const [interventions, setInterventions] = useState<{ [pos: string]: any }>({});
  const [loading, setLoading] = useState(true);

  // For physical/keyboard wedge RFID scanner emulation
  const [rfidInput, setRfidInput] = useState('');
  const rfidInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vData, tData] = await Promise.all([
        api.getVehicles(),
        api.getTires()
      ]);
      setVehicles(vData);
      // Filter tires that are in warehouse states
      setAvailableTires(tData.filter((t: any) => t.state.includes('Bodega')));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (v: any) => {
    setSelectedVehicle(v);
    setOdometer(v.current_odometer || 0);
    setInterventions({});
    setStep(2);
  };

  // Keyboard wedge RFID scanner trigger
  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;
    
    // Search the scanned RFID in bodega tires
    const matchedTire = availableTires.find(t => t.rfid_id === rfidInput || t.fire_mark_id === rfidInput);
    if (!matchedTire) {
      alert(`RFID o Marca de Fuego "${rfidInput}" no se encuentra disponible en bodega.`);
      setRfidInput('');
      return;
    }

    if (selectedPosition) {
      handleTireSelect(matchedTire);
    }
    setRfidInput('');
  };

  const handleTireSelect = (tire: any) => {
    if (!selectedPosition) return;
    
    // Check if tire is already selected in another position in this batch
    const alreadyAssigned = Object.values(interventions).some((t: any) => t.fire_mark_id === tire.fire_mark_id);
    if (alreadyAssigned) {
      alert("Este neumático ya ha sido seleccionado para otra posición.");
      return;
    }

    setInterventions(prev => ({
      ...prev,
      [selectedPosition]: tire
    }));
    setSelectedPosition(null);
    setSelectedTire(null);
  };

  const handleSaveAssignments = async () => {
    if (Object.keys(interventions).length === 0) {
      alert("Debe realizar al menos una asignación.");
      return;
    }
    if (odometer < (selectedVehicle.current_odometer || 0)) {
      alert(`El kilometraje no puede ser menor al actual (${selectedVehicle.current_odometer.toLocaleString()} KM)`);
      return;
    }

    try {
      setLoading(true);
      // Assign all selected tires one by one
      for (const pos of Object.keys(interventions)) {
        const tire = interventions[pos];
        await api.assignTire({
          vehicle_id: selectedVehicle.id,
          tire_fire_mark: tire.fire_mark_id,
          axle_position: pos,
          start_odometer: odometer
        });
      }
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Error registrando las asignaciones de neumáticos.");
    } finally {
      setLoading(false);
    }
  };

  // Layout positions generator helper
  const getAxleLayout = (config: string) => {
    if (config === '6x4') {
      return [
        { name: 'Frontal', positions: ['1I', '1D'] },
        { name: 'Tracción 1', positions: ['2EI', '2II', '2ID', '2ED'] },
        { name: 'Tracción 2', positions: ['3EI', '3II', '3ID', '3ED'] }
      ];
    }
    if (config === '4x2') {
      return [
        { name: 'Frontal', positions: ['1I', '1D'] },
        { name: 'Tracción', positions: ['2EI', '2II', '2ID', '2ED'] }
      ];
    }
    if (config === '2 Ejes') {
      return [
        { name: 'Eje 1', positions: ['1EI', '1II', '1ID', '1ED'] },
        { name: 'Eje 2', positions: ['2EI', '2II', '2ID', '2ED'] }
      ];
    }
    return [{ name: 'Eje 1', positions: ['1I', '1D'] }];
  };

  const filteredVehicles = vehicles.filter(v => v.plate.toLowerCase().includes(searchVehicle.toLowerCase()));

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <button onClick={() => step > 1 ? setStep(step - 1) : window.history.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            ←
          </button>
          <h2 className="text-lg font-bold text-white">Asignar Neumáticos</h2>
        </div>
        <span className="text-[10px] font-mono text-vani-cyan bg-vani-cyan/10 px-2 py-0.5 rounded border border-vani-cyan/20">PASO {step}/3</span>
      </div>

      {loading && step !== 2 && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-vani-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* STEP 1: SELECT VEHICLE */}
      {step === 1 && !loading && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Seleccione el vehículo a intervenir e instalar neumáticos:</p>
          <input 
            type="text" 
            placeholder="Buscar patente..." 
            value={searchVehicle} 
            onChange={e => setSearchVehicle(e.target.value)} 
            className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-vani-cyan"
          />

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredVehicles.map(v => (
              <button 
                key={v.id} 
                onClick={() => handleSelectVehicle(v)} 
                className="w-full bg-slate-800/40 p-4 rounded-xl flex justify-between items-center border border-white/5 hover:border-vani-cyan active:scale-[0.98] transition-all text-left"
              >
                <div>
                  <span className="text-lg font-bold text-white block tracking-wider">{v.plate}</span>
                  <span className="text-xs text-slate-400">{v.brand} {v.model} | {v.vehicle_type}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-vani-cyan block">{v.axle_config}</span>
                  <span className="text-xs font-mono text-slate-500">{v.tires?.length || 0} Neum.</span>
                </div>
              </button>
            ))}
            {filteredVehicles.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">No se encontraron vehículos.</p>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: AXLE INTERACTION */}
      {step === 2 && selectedVehicle && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <span className="text-2xl font-bold text-white tracking-widest block">{selectedVehicle.plate}</span>
              <span className="text-xs text-slate-400">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.axle_config})</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Kilometraje Actual</span>
              <span className="text-lg font-mono text-vani-cyan">{(selectedVehicle.current_odometer || 0).toLocaleString()} KM</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">Toque una posición del eje para escanear/asignar neumático:</p>

          {/* Chasis Diagram */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center py-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 bg-white/5 border border-white/10 rounded-t-2xl border-b-0"></div>
            
            <div className="w-full space-y-8 z-10 relative">
              {getAxleLayout(selectedVehicle.axle_config).map((axle, idx) => (
                <div key={idx} className="relative flex justify-center items-center w-full">
                  <div className="absolute w-[80%] h-1 bg-slate-800 rounded-full z-0"></div>
                  <div className="flex justify-between w-[95%] z-10">
                    
                    {/* Left positions */}
                    <div className="flex space-x-1.5">
                      {axle.positions.filter(p => p.endsWith('I')).reverse().map(pos => {
                        const activeTire = selectedVehicle.tires?.find((t: any) => t.axle_position === pos);
                        const stagedTire = interventions[pos];
                        return (
                          <div 
                            key={pos} 
                            onClick={() => setSelectedPosition(pos)}
                            className={`w-9 h-16 rounded flex items-center justify-center font-bold text-[8px] transition-all cursor-pointer select-none
                              ${stagedTire 
                                ? 'bg-gradient-to-b from-green-500 to-emerald-600 text-black shadow-[0_0_12px_rgba(34,197,94,0.5)] border border-green-400 animate-pulse' 
                                : activeTire 
                                  ? 'bg-slate-700 text-white border border-white/20 hover:border-vani-cyan' 
                                  : 'bg-slate-950 border border-dashed border-white/20 text-slate-600 hover:border-vani-cyan hover:text-vani-cyan'
                              }`}
                          >
                            <div className="flex flex-col items-center">
                              <span>{pos}</span>
                              <span className="text-[6px] mt-0.5 truncate max-w-[32px] font-mono">
                                {stagedTire ? stagedTire.fire_mark_id : activeTire ? activeTire.fire_mark_id : '+'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Differential */}
                    <div className="w-8 h-8 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center shadow-lg text-[6px] text-slate-500 uppercase z-10">{axle.name.substring(0,3)}</div>

                    {/* Right positions */}
                    <div className="flex space-x-1.5">
                      {axle.positions.filter(p => p.endsWith('D')).map(pos => {
                        const activeTire = selectedVehicle.tires?.find((t: any) => t.axle_position === pos);
                        const stagedTire = interventions[pos];
                        return (
                          <div 
                            key={pos} 
                            onClick={() => setSelectedPosition(pos)}
                            className={`w-9 h-16 rounded flex items-center justify-center font-bold text-[8px] transition-all cursor-pointer select-none
                              ${stagedTire 
                                ? 'bg-gradient-to-b from-green-500 to-emerald-600 text-black shadow-[0_0_12px_rgba(34,197,94,0.5)] border border-green-400 animate-pulse' 
                                : activeTire 
                                  ? 'bg-slate-700 text-white border border-white/20 hover:border-vani-cyan' 
                                  : 'bg-slate-950 border border-dashed border-white/20 text-slate-600 hover:border-vani-cyan hover:text-vani-cyan'
                              }`}
                          >
                            <div className="flex flex-col items-center">
                              <span>{pos}</span>
                              <span className="text-[6px] mt-0.5 truncate max-w-[32px] font-mono">
                                {stagedTire ? stagedTire.fire_mark_id : activeTire ? activeTire.fire_mark_id : '+'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              ))}
            </div>

            <div className="absolute top-0 bottom-0 w-1 bg-slate-800 z-0"></div>
          </div>

          {/* Odometer Input */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Registrar Kilometraje Actual del Camión</label>
            <input 
              type="number" 
              value={odometer}
              onChange={e => setOdometer(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white text-lg font-mono outline-none focus:border-vani-cyan"
            />
          </div>

          <button 
            onClick={handleSaveAssignments}
            disabled={Object.keys(interventions).length === 0}
            className={`w-full py-4 rounded-xl text-lg font-bold tracking-widest uppercase transition-all shadow-lg
              ${Object.keys(interventions).length > 0 
                ? 'bg-vani-cyan text-black hover:bg-cyan-400 active:scale-[0.98]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
          >
            Confirmar e Instalar ({Object.keys(interventions).length})
          </button>

          {/* Selection Modal / Scanner Simulation */}
          {selectedPosition && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-vani-cyan/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-lg font-bold text-white">Instalar en Posición: <span className="text-vani-cyan">{selectedPosition}</span></h3>
                  <button onClick={() => { setSelectedPosition(null); setRfidInput(''); }} className="text-slate-400 hover:text-white text-xl font-bold">&times;</button>
                </div>

                {/* Keyboard Wedge RFID Emulation Input */}
                <form onSubmit={handleRfidSubmit} className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase tracking-widest block font-bold">Escanear RFID (Simulación de Disparo)</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      ref={rfidInputRef}
                      placeholder="Dispare o escriba RFID..." 
                      value={rfidInput}
                      onChange={e => setRfidInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-white/10 rounded-lg p-3 text-white font-mono text-sm outline-none focus:border-vani-cyan"
                    />
                    <button type="submit" className="bg-vani-cyan/20 border border-vani-cyan text-vani-cyan font-bold px-4 rounded-lg text-xs uppercase tracking-widest">Gatillar</button>
                  </div>
                </form>

                <div className="border-t border-white/10 my-3"></div>

                <label className="text-xs text-slate-400 uppercase tracking-widest block font-bold mb-2">Selección Rápida de Bodega</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableTires.map(t => (
                    <button 
                      key={t.fire_mark_id}
                      onClick={() => handleTireSelect(t)}
                      className="w-full bg-slate-900/60 border border-white/5 hover:border-vani-cyan p-3 rounded-lg flex justify-between items-center text-left hover:bg-slate-900 active:scale-95 transition-all text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{t.fire_mark_id}</span>
                        <span className="text-slate-400 block">{t.brand} {t.model} | {t.size}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{t.rfid_id}</span>
                    </button>
                  ))}
                  {availableTires.length === 0 && (
                    <p className="text-slate-500 italic text-center py-4">No hay neumáticos disponibles en Bodega.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SUCCESS SUMMARY */}
      {step === 3 && (
        <div className="text-center py-10 space-y-6 animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 border border-green-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            ✓
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Montaje Exitoso</h3>
            <p className="text-xs text-slate-400">Se han registrado las asignaciones en el vehículo e ingresado en las bitácoras correspondientes.</p>
          </div>

          <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl text-left space-y-3 font-mono text-xs max-w-sm mx-auto">
            <div className="text-slate-400">Camión: <span className="text-white font-bold">{selectedVehicle?.plate}</span></div>
            <div className="text-slate-400">Kilometraje: <span className="text-white">{odometer.toLocaleString()} KM</span></div>
            <div className="border-t border-white/10 my-2"></div>
            <div className="text-[10px] text-vani-cyan uppercase tracking-wider mb-2 font-bold font-sans">Neumáticos Instalados:</div>
            {Object.keys(interventions).map(pos => (
              <div key={pos} className="flex justify-between items-center text-slate-300">
                <span>Posición {pos}:</span>
                <span className="text-white">{interventions[pos].fire_mark_id}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-2 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
                setSelectedVehicle(null);
                setInterventions({});
                setOdometer(0);
                setSelectedPosition(null);
                setSelectedTire(null);
                loadData();
                setStep(1);
              }}
              className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 active:scale-95 transition-all text-sm tracking-widest uppercase"
            >
              Registrar Otro Vehículo
            </button>
            <Link 
              href="/mobile/movements"
              className="w-full bg-transparent text-slate-400 hover:text-white font-medium py-2 rounded-xl text-center text-xs tracking-wider uppercase"
            >
              Volver a Movimientos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
