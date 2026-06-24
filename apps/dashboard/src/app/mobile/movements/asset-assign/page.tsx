'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function MobileAssetAssign() {
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [searchVehicle, setSearchVehicle] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Keyboard wedge RFID scanning emulation
  const [rfidInput, setRfidInput] = useState('');
  const rfidInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vData, aData] = await Promise.all([
        api.getVehicles(),
        api.getAssets()
      ]);
      setVehicles(vData);
      // Filter assets in warehouse
      setAvailableAssets(aData.filter((a: any) => a.state.includes('Bodega')));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (v: any) => {
    setSelectedVehicle(v);
    setStep(2);
  };

  // Handles physical scanning keyboard wedge trigger
  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;

    // Search matched asset in bodega
    const matchedAsset = availableAssets.find(a => a.rfid_id === rfidInput || a.serial_number === rfidInput);
    if (!matchedAsset) {
      alert(`RFID o N° Serie "${rfidInput}" no se encuentra disponible en bodega.`);
      setRfidInput('');
      return;
    }

    if (selectedAssetType && matchedAsset.asset_type !== selectedAssetType) {
      alert(`El activo escaneado es de tipo "${matchedAsset.asset_type}", se requiere "${selectedAssetType}".`);
      setRfidInput('');
      return;
    }

    handleAssetSelect(matchedAsset);
    setRfidInput('');
  };

  const handleAssetSelect = async (asset: any) => {
    try {
      setLoading(true);
      await api.assignAsset({
        vehicle_id: selectedVehicle.id,
        asset_id: asset.id,
        start_odometer: selectedVehicle.current_odometer || 0
      });
      setSelectedAsset(asset);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Error asignando activo.");
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => v.plate.toLowerCase().includes(searchVehicle.toLowerCase()));
  const assetTypes = ['Extintor 10Kg', 'Pértica Leds', 'Llanta Metálica'];

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <button onClick={() => step > 1 ? setStep(step - 1) : window.history.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            ←
          </button>
          <h2 className="text-lg font-bold text-white">Asignar Activos</h2>
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
          <p className="text-xs text-slate-400">Seleccione el vehículo al que asignará activos de seguridad:</p>
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
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Activos</span>
                  <span className="text-sm font-bold text-vani-cyan">{v.general_assets?.length || 0}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: CATEGORY & RFID SCAN */}
      {step === 2 && selectedVehicle && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <span className="text-2xl font-bold text-white tracking-widest block">{selectedVehicle.plate}</span>
              <span className="text-xs text-slate-400">{selectedVehicle.brand} {selectedVehicle.model}</span>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-500 block font-mono">Odómetro</span>
              <span className="text-white font-mono font-bold">{(selectedVehicle.current_odometer || 0).toLocaleString()} KM</span>
            </div>
          </div>

          {/* Installed Assets */}
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activos Actualmente Instalados:</h4>
            {selectedVehicle.general_assets?.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay activos asignados.</p>
            ) : (
              <div className="space-y-1 text-xs">
                {selectedVehicle.general_assets?.map((a: any) => (
                  <div key={a.id} className="flex justify-between items-center bg-black/30 p-2.5 rounded border border-white/5">
                    <span className="text-white font-bold">{a.asset_type}</span>
                    <span className="text-slate-400 font-mono">{a.serial_number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400">1. Seleccione la categoría de activo a asignar:</p>
          <div className="grid grid-cols-3 gap-2">
            {assetTypes.map(type => (
              <button 
                key={type}
                onClick={() => setSelectedAssetType(type)}
                className={`py-3 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center border transition-all
                  ${selectedAssetType === type 
                    ? 'bg-vani-cyan/20 text-vani-cyan border-vani-cyan shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                    : 'bg-slate-800 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
              >
                {type === 'Extintor 10Kg' ? '🧯' : type === 'Pértica Leds' ? '🚩' : '🎡'}<br/>
                <span className="mt-1 block font-sans truncate">{type.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {selectedAssetType && (
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Escanear {selectedAssetType}</h4>

              {/* Keyboard wedge input */}
              <form onSubmit={handleRfidSubmit} className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Disparar Lector RFID al Activo Físico</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    ref={rfidInputRef}
                    placeholder="Dispare o escriba RFID del activo..." 
                    value={rfidInput}
                    onChange={e => setRfidInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-3 text-white font-mono text-sm outline-none focus:border-vani-cyan"
                  />
                  <button type="submit" className="bg-vani-cyan/20 border border-vani-cyan text-vani-cyan font-bold px-4 rounded-lg text-xs uppercase tracking-widest">Gatillar</button>
                </div>
              </form>

              <div className="border-t border-white/10 my-3"></div>

              <h4 className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">O seleccionar manualmente de Bodega:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {availableAssets
                  .filter(a => a.asset_type === selectedAssetType)
                  .map(a => (
                    <button 
                      key={a.id}
                      onClick={() => handleAssetSelect(a)}
                      className="w-full bg-slate-950/60 hover:bg-slate-950 border border-white/5 hover:border-vani-cyan p-3 rounded-lg flex justify-between items-center text-left text-xs active:scale-95 transition-all"
                    >
                      <div>
                        <span className="font-bold text-white block">{a.serial_number}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{a.rfid_id}</span>
                      </div>
                      <span className="text-lg">➕</span>
                    </button>
                  ))}
                {availableAssets.filter(a => a.asset_type === selectedAssetType).length === 0 && (
                  <p className="text-slate-500 italic text-center py-4 text-xs">No hay {selectedAssetType} disponibles en bodega.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SUCCESS SUMMARY */}
      {step === 3 && selectedAsset && (
        <div className="text-center py-10 space-y-6 animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 border border-green-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            🧯
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Activo Asignado</h3>
            <p className="text-xs text-slate-400">Se completó el registro del activo general en el vehículo. Los reemplazos anteriores fueron devueltos a la bodega base.</p>
          </div>

          <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl text-left space-y-3 font-mono text-xs max-w-sm mx-auto">
            <div className="text-slate-400">Vehículo: <span className="text-white font-bold">{selectedVehicle?.plate}</span></div>
            <div className="text-slate-400">Tipo de Activo: <span className="text-white">{selectedAsset.asset_type}</span></div>
            <div className="text-slate-400">N° Serie: <span className="text-white">{selectedAsset.serial_number}</span></div>
            <div className="text-slate-400">RFID: <span className="text-white">{selectedAsset.rfid_id}</span></div>
          </div>

          <div className="flex flex-col space-y-2 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
                setSelectedVehicle(null);
                setSelectedAsset(null);
                setSelectedAssetType(null);
                loadData();
                setStep(1);
              }}
              className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 active:scale-95 transition-all text-sm tracking-widest uppercase"
            >
              Asignar Otro Activo
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
