'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function MobileRetread() {
  const [tab, setTab] = useState<'envio' | 'recepcion'>('envio');
  const [branches, setBranches] = useState<any[]>([]);
  const [allTires, setAllTires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Flow State
  const [step, setStep] = useState(1);
  const [scannedTires, setScannedTires] = useState<any[]>([]); // list of tires scanned
  const [selectedBranch, setSelectedBranch] = useState<string>(''); // Planta Recauchaje for Envio, Base Interna for Recepcion
  const [resultDoc, setResultDoc] = useState<any>(null);

  // Scanner Keyboard wedge input
  const [rfidInput, setRfidInput] = useState('');
  const rfidInputRef = useRef<HTMLInputElement>(null);

  // Simulation parameters
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, tData] = await Promise.all([
        api.getBranches(),
        api.getTires()
      ]);
      setBranches(bData);
      setAllTires(tData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: 'envio' | 'recepcion') => {
    setTab(newTab);
    setStep(1);
    setScannedTires([]);
    setSelectedBranch('');
    setResultDoc(null);
  };

  // Keyboard wedge RFID scanner trigger
  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;

    // Search matches
    const matchedTire = allTires.find(t => t.rfid_id === rfidInput || t.fire_mark_id === rfidInput);
    if (!matchedTire) {
      alert(`RFID o Marca de Fuego "${rfidInput}" no se encuentra en el sistema.`);
      setRfidInput('');
      return;
    }

    // Check duplicate
    if (scannedTires.some(t => t.fire_mark_id === matchedTire.fire_mark_id)) {
      alert("Este neumático ya fue escaneado.");
      setRfidInput('');
      return;
    }

    if (tab === 'envio') {
      // In dispatch, tires must be in bodega (nuevo/usado) to go to retread
      if (!matchedTire.state.includes('Bodega')) {
        alert(`El neumático está en estado "${matchedTire.state}". Debe estar en Bodega para enviarlo a recauchaje.`);
        setRfidInput('');
        return;
      }
      setScannedTires(prev => [...prev, matchedTire]);
    } else {
      // In reception, tires should typically be in 'Planta Recauchaje' state
      if (matchedTire.state !== 'Planta Recauchaje') {
        alert(`El neumático está en estado "${matchedTire.state}". Debe estar en Planta Recauchaje para recibirlo.`);
        setRfidInput('');
        return;
      }
      // Add returning tire with status = 'OK' by default
      setScannedTires(prev => [...prev, { ...matchedTire, status: 'OK' }]);
    }

    setRfidInput('');
  };

  // Simulates reading 3 appropriate tires quickly
  const handleTriggerSimulatedScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      if (tab === 'envio') {
        // Find available bodega tires
        const available = allTires.filter(t => t.state.includes('Bodega') && !scannedTires.some(st => st.fire_mark_id === t.fire_mark_id));
        const toAdd = available.slice(0, 3);
        if (toAdd.length === 0) {
          alert("No hay más neumáticos libres en bodega para simular.");
        } else {
          setScannedTires(prev => [...prev, ...toAdd]);
        }
      } else {
        // Find tires in retread plant
        const inRetread = allTires.filter(t => t.state === 'Planta Recauchaje' && !scannedTires.some(st => st.fire_mark_id === t.fire_mark_id));
        const toAdd = inRetread.slice(0, 3).map(t => ({ ...t, status: 'OK' }));
        if (toAdd.length === 0) {
          alert("No hay más neumáticos registrados en 'Planta Recauchaje' para simular.");
        } else {
          setScannedTires(prev => [...prev, ...toAdd]);
        }
      }
      setIsScanning(false);
    }, 1200);
  };

  const toggleTireStatus = (idx: number) => {
    setScannedTires(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        status: copy[idx].status === 'OK' ? 'REJECTED' : 'OK'
      };
      return copy;
    });
  };

  const handleExecuteSend = async () => {
    if (!selectedBranch) {
      alert("Seleccione la planta de recauchaje de destino.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.sendRetread({
        supplier_branch_id: selectedBranch,
        rfids: scannedTires.map(t => t.fire_mark_id)
      });
      setResultDoc(res.document);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Error registrando despacho a recauchaje.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReceive = async () => {
    if (!selectedBranch) {
      alert("Seleccione la bodega interna receptora.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.receiveRetread({
        branch_id: selectedBranch,
        tires: scannedTires.map(t => ({ rfid: t.fire_mark_id, status: t.status }))
      });
      setResultDoc(res.document);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Error registrando recepción de recauchaje.");
    } finally {
      setLoading(false);
    }
  };

  // Filter branch locations
  const retreadPlants = branches.filter(b => b.type === 'Planta Recauchaje');
  const internalWarehouses = branches.filter(b => b.type === 'Base Interna');

  return (
    <div className="flex flex-col space-y-4">
      {/* Tabs */}
      {step === 1 && (
        <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={() => handleTabChange('envio')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all
              ${tab === 'envio' 
                ? 'bg-vani-cyan text-black shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                : 'text-slate-400 hover:text-white'
              }`}
          >
            ♻️ Enviar a Recauchaje
          </button>
          <button 
            onClick={() => handleTabChange('recepcion')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all
              ${tab === 'recepcion' 
                ? 'bg-vani-cyan text-black shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                : 'text-slate-400 hover:text-white'
              }`}
          >
            📥 Recibir de Planta
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <button onClick={() => step > 1 ? setStep(step - 1) : window.history.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            ←
          </button>
          <h2 className="text-lg font-bold text-white">
            {tab === 'envio' ? 'Envío a Recauchaje' : 'Recepción de Recauchaje'}
          </h2>
        </div>
        <span className="text-[10px] font-mono text-vani-cyan bg-vani-cyan/10 px-2 py-0.5 rounded border border-vani-cyan/20">PASO {step}/3</span>
      </div>

      {loading && step !== 2 && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-vani-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* STEP 1: SCAN TIRES */}
      {step === 1 && !loading && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            {tab === 'envio' 
              ? 'Escanee los neumáticos de bodega que enviará a recauchaje:' 
              : 'Escanee los neumáticos que regresan desde la planta de recauchaje:'}
          </p>

          {/* Keyboard wedge scanning */}
          <form onSubmit={handleRfidSubmit} className="space-y-2">
            <div className="flex space-x-2">
              <input 
                type="text" 
                ref={rfidInputRef}
                placeholder="Dispare o escriba RFID/Marca de Fuego..." 
                value={rfidInput}
                onChange={e => setRfidInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg p-3 text-white font-mono text-sm outline-none focus:border-vani-cyan"
              />
              <button type="submit" className="bg-vani-cyan/20 border border-vani-cyan text-vani-cyan font-bold px-4 rounded-lg text-xs uppercase tracking-widest">Gatillar</button>
            </div>
          </form>

          <button 
            onClick={handleTriggerSimulatedScan}
            disabled={isScanning}
            className="w-full py-3 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400 font-bold rounded-lg text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            {isScanning ? 'LEYENDO...' : 'Simular Lectura RFID (3 Unidades)'}
          </button>

          {/* Scanned List */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
              <span>Neumáticos Escaneados</span>
              <span className="text-white font-mono">{scannedTires.length} uds.</span>
            </div>
            
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {scannedTires.map((t, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">{t.fire_mark_id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{t.rfid_id || 'SIN-RFID'}</span>
                  </div>
                  
                  {tab === 'recepcion' ? (
                    <button 
                      onClick={() => toggleTireStatus(idx)}
                      className={`px-3 py-1 rounded font-bold uppercase tracking-wider text-[9px] transition-all
                        ${t.status === 'OK' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        }`}
                    >
                      {t.status === 'OK' ? 'Recauchado OK' : 'Desecho / Rechazado'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setScannedTires(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300 text-sm font-bold px-1"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              {scannedTires.length === 0 && (
                <p className="text-slate-600 italic text-center py-8 text-xs">Sin lecturas...</p>
              )}
            </div>
          </div>

          <button 
            onClick={() => setStep(2)}
            disabled={scannedTires.length === 0}
            className={`w-full py-4 rounded-xl text-lg font-bold tracking-widest uppercase transition-all shadow-lg
              ${scannedTires.length > 0 
                ? 'bg-vani-cyan text-black hover:bg-cyan-400 active:scale-[0.98]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
          >
            Continuar con Destino →
          </button>
        </div>
      )}

      {/* STEP 2: SELECT BRANCH & SAVE */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl space-y-2">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Resumen de Escaneo</span>
            <div className="flex justify-between items-center text-sm font-mono text-white">
              <span>Total Neumáticos:</span>
              <span className="font-bold">{scannedTires.length} uds.</span>
            </div>
            {tab === 'recepcion' && (
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Exitosos: {scannedTires.filter(t => t.status === 'OK').length}</span>
                <span>Rechazados: {scannedTires.filter(t => t.status !== 'OK').length}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
              {tab === 'envio' ? 'Seleccionar Planta Proveedora de Destino' : 'Seleccionar Bodega de Recepción'}
            </label>
            <select 
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-vani-cyan"
            >
              <option value="">Seleccione Sucursal...</option>
              {tab === 'envio' 
                ? retreadPlants.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                : internalWarehouses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
              }
            </select>
          </div>

          <button 
            onClick={tab === 'envio' ? handleExecuteSend : handleExecuteReceive}
            disabled={!selectedBranch || loading}
            className={`w-full py-4 rounded-xl text-lg font-bold tracking-widest uppercase transition-all shadow-lg
              ${selectedBranch && !loading
                ? 'bg-vani-cyan text-black hover:bg-cyan-400 active:scale-[0.98]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
          >
            {tab === 'envio' ? 'Confirmar y Despachar' : 'Confirmar e Ingresar'}
          </button>
        </div>
      )}

      {/* STEP 3: SUCCESS & RECEIPT */}
      {step === 3 && resultDoc && (
        <div className="space-y-6 text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 border border-green-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            📄
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">Proceso Registrado</h3>
            <p className="text-xs text-slate-400">Se ha generado el documento e ingresado los logs correspondientes en el sistema.</p>
          </div>

          {/* Printable Dispatch Document Mock */}
          <div className="bg-white text-slate-900 p-6 rounded-xl text-left font-mono text-xs max-w-md mx-auto shadow-2xl border-4 border-slate-300 space-y-4">
            <div className="text-center border-b-2 border-dashed border-slate-900 pb-3">
              <h4 className="text-sm font-black uppercase tracking-widest">AXON TIRES LOGISTICA</h4>
              <p className="text-[10px] text-slate-600">Guía de Despacho / Control</p>
            </div>
            
            <div className="space-y-1">
              <div>Documento N°: <span className="font-bold">{resultDoc.document_number}</span></div>
              <div>Fecha: <span>{new Date(resultDoc.created_at).toLocaleString()}</span></div>
              <div>Operación: <span className="font-bold">{resultDoc.action_type}</span></div>
              <div>Proveedor/Bodega: <span className="font-bold">
                {branches.find(b => b.id === (tab === 'envio' ? selectedBranch : resultDoc.branch_id))?.name || 'Bodega Central'}
              </span></div>
            </div>

            <div className="border-t-2 border-dashed border-slate-900 pt-2">
              <span className="font-black uppercase tracking-wider block mb-2 text-[10px]">Detalle de Neumáticos:</span>
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-900 font-bold">
                    <th>Marca Fuego</th>
                    <th className="text-right">RFID</th>
                    {tab === 'recepcion' && <th className="text-right">Estado</th>}
                  </tr>
                </thead>
                <tbody>
                  {tab === 'envio' 
                    ? scannedTires.map((t, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-1">{t.fire_mark_id}</td>
                          <td className="text-right py-1">{t.rfid_id}</td>
                        </tr>
                      ))
                    : scannedTires.map((t, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-1">{t.fire_mark_id}</td>
                          <td className="text-right py-1">{t.rfid_id}</td>
                          <td className="text-right py-1 font-bold">{t.status === 'OK' ? 'RECAUCHADO' : 'DESECHO'}</td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-dashed border-slate-900 pt-6 text-center text-[10px] text-slate-500 font-sans">
              <p>*** COMPROBANTE DE LOGISTICA ***</p>
              <button 
                onClick={() => window.print()}
                className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs uppercase tracking-wider transition-all print:hidden"
              >
                🖨️ Imprimir Guía
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-2 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
                setScannedTires([]);
                setSelectedBranch('');
                setResultDoc(null);
                loadData();
                setStep(1);
              }}
              className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 active:scale-95 transition-all text-sm tracking-widest uppercase"
            >
              Registrar Otra Operación
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
