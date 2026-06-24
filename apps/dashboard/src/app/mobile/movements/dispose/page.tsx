'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function MobileDispose() {
  const [step, setStep] = useState(1);
  const [allTires, setAllTires] = useState<any[]>([]);
  const [scannedTires, setScannedTires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Keyboard wedge input
  const [rfidInput, setRfidInput] = useState('');
  const rfidInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getTires();
      setAllTires(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;

    const matchedTire = allTires.find(t => t.rfid_id === rfidInput || t.fire_mark_id === rfidInput);
    if (!matchedTire) {
      alert(`RFID o Marca de Fuego "${rfidInput}" no se encuentra registrada.`);
      setRfidInput('');
      return;
    }

    if (matchedTire.state === 'Desecho') {
      alert("Este neumático ya se encuentra desechado.");
      setRfidInput('');
      return;
    }

    if (scannedTires.some(t => t.fire_mark_id === matchedTire.fire_mark_id)) {
      alert("Este neumático ya ha sido escaneado.");
      setRfidInput('');
      return;
    }

    setScannedTires(prev => [...prev, matchedTire]);
    setRfidInput('');
  };

  const handleSimulatedScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      // Find tires that are not already disposed or scanned
      const available = allTires.filter(t => t.state !== 'Desecho' && !scannedTires.some(st => st.fire_mark_id === t.fire_mark_id));
      const toAdd = available.slice(0, 3);
      if (toAdd.length === 0) {
        alert("No hay más neumáticos disponibles en el sistema para desechar.");
      } else {
        setScannedTires(prev => [...prev, ...toAdd]);
      }
      setIsScanning(false);
    }, 1000);
  };

  const handleExecuteDispose = async () => {
    try {
      setLoading(true);
      await api.disposeTires({
        rfids: scannedTires.map(t => t.fire_mark_id),
        branch_id: scannedTires[0]?.branch_id // Preserve location or default
      });
      setStep(2);
    } catch (e) {
      console.error(e);
      alert("Error al procesar la disposición final de neumáticos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <button onClick={() => step > 1 ? setStep(step - 1) : window.history.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            ←
          </button>
          <h2 className="text-lg font-bold text-white">Disposición Final</h2>
        </div>
        <span className="text-[10px] font-mono text-vani-cyan bg-vani-cyan/10 px-2 py-0.5 rounded border border-vani-cyan/20">PASO {step}/2</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-vani-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* STEP 1: SCAN */}
      {step === 1 && !loading && (
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-1">
            <span className="text-xs text-red-400 font-bold uppercase tracking-wider block">⚠️ ADVERTENCIA DE SEGURIDAD</span>
            <p className="text-[10px] text-slate-400 leading-normal">
              Esta operación es permanente. Los neumáticos escaneados cambiarán a estado <strong>Desecho</strong> y cualquier sensor TPMS asociado será liberado automáticamente del sistema.
            </p>
          </div>

          {/* Keyboard wedge scanning */}
          <form onSubmit={handleRfidSubmit} className="space-y-2">
            <label className="text-xs text-slate-400 font-bold uppercase">Escanear Neumático (RFID / Fuego)</label>
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

          <button 
            onClick={handleSimulatedScan}
            disabled={isScanning}
            className="w-full py-3 bg-red-600/10 border border-red-500/30 hover:bg-red-600/20 text-red-400 font-bold rounded-lg text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            {isScanning ? 'LEYENDO...' : 'Simular Lectura RFID (3 Unidades)'}
          </button>

          {/* Scanned List */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
              <span>Lote a Desechar</span>
              <span className="text-white font-mono">{scannedTires.length} uds.</span>
            </div>
            
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {scannedTires.map((t, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">{t.fire_mark_id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{t.rfid_id || 'SIN-RFID'}</span>
                  </div>
                  <button 
                    onClick={() => setScannedTires(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300 text-sm font-bold px-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {scannedTires.length === 0 && (
                <p className="text-slate-600 italic text-center py-8 text-xs">Sin lecturas...</p>
              )}
            </div>
          </div>

          <button 
            onClick={handleExecuteDispose}
            disabled={scannedTires.length === 0}
            className={`w-full py-4 rounded-xl text-lg font-bold tracking-widest uppercase transition-all shadow-lg
              ${scannedTires.length > 0 
                ? 'bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
          >
            Confirmar Baja de Lote
          </button>
        </div>
      )}

      {/* STEP 2: SUCCESS */}
      {step === 2 && (
        <div className="text-center py-10 space-y-6 animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-red-500/20 text-red-400 border border-red-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
            🗑️
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Disposición Final Exitosa</h3>
            <p className="text-xs text-slate-400">Los neumáticos han sido retirados de bodega y registrados en el estado Desecho. Los sensores vinculados fueron liberados.</p>
          </div>

          <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl text-left space-y-2 font-mono text-xs max-w-sm mx-auto">
            <div className="text-slate-400">Total Desechados: <span className="text-white font-bold">{scannedTires.length} uds.</span></div>
            <div className="border-t border-white/10 my-2"></div>
            {scannedTires.map((t, idx) => (
              <div key={idx} className="text-slate-400">{idx+1}. <span className="text-white">{t.fire_mark_id}</span></div>
            ))}
          </div>

          <div className="flex flex-col space-y-2 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
                setScannedTires([]);
                loadData();
                setStep(1);
              }}
              className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 active:scale-95 transition-all text-sm tracking-widest uppercase"
            >
              Desechar Otro Lote
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
