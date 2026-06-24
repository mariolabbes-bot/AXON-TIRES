'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function MobileRetread() {
  const [tab, setTab] = useState<'envio' | 'recepcion' | 'pendientes'>('envio');
  const [branches, setBranches] = useState<any[]>([]);
  const [allTires, setAllTires] = useState<any[]>([]);
  const [pendingGuides, setPendingGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FLOW STATES ---
  const [step, setStep] = useState(1);
  const [scannedTires, setScannedTires] = useState<any[]>([]); // For envio/recepcion
  const [selectedBranch, setSelectedBranch] = useState<string>(''); // Supplier for Envio, Base Interna for Recepcion
  const [operationType, setOperationType] = useState<'RECAUCHAJE_ENVIO' | 'REPARACION_ENVIO'>('RECAUCHAJE_ENVIO');
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null); // For recepcion
  const [resultDoc, setResultDoc] = useState<any>(null);
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>(null); // For pending tab

  // Keyboard wedge RFID scanner input reference
  const [rfidInput, setRfidInput] = useState('');
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, tData, gData] = await Promise.all([
        api.getBranches(),
        api.getTires(),
        api.getPendingGuides()
      ]);
      setBranches(bData);
      setAllTires(tData);
      setPendingGuides(gData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: 'envio' | 'recepcion' | 'pendientes') => {
    setTab(newTab);
    setStep(1);
    setScannedTires([]);
    setSelectedBranch('');
    setSelectedGuide(null);
    setResultDoc(null);
    setExpandedGuideId(null);
    loadData();
  };

  // Keyboard wedge RFID scanner form submission
  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;

    if (tab === 'envio') {
      const matchedTire = allTires.find(t => t.rfid_id === rfidInput || t.fire_mark_id === rfidInput);
      if (!matchedTire) {
        alert(`RFID o Marca de Fuego "${rfidInput}" no registrada.`);
        setRfidInput('');
        return;
      }
      if (!matchedTire.state.includes('Bodega')) {
        alert(`El neumático está en estado "${matchedTire.state}". Debe estar en Bodega para enviarlo.`);
        setRfidInput('');
        return;
      }
      if (scannedTires.some(t => t.fire_mark_id === matchedTire.fire_mark_id)) {
        alert("Este neumático ya fue escaneado.");
        setRfidInput('');
        return;
      }
      setScannedTires(prev => [...prev, matchedTire]);
    } 
    
    else if (tab === 'recepcion' && selectedGuide) {
      // Recepcion mode: Matched tire must exist in selectedGuide tires_details list
      const matchedTire = selectedGuide.tires_details.find(
        (t: any) => t.rfid_id === rfidInput || t.fire_mark_id === rfidInput
      );
      if (!matchedTire) {
        alert(`El RFID o Marca de Fuego "${rfidInput}" no pertenece a la Guía seleccionada.`);
        setRfidInput('');
        return;
      }
      
      // Also verify if it's already scanned in this session
      if (scannedTires.some(t => t.fire_mark_id === matchedTire.fire_mark_id)) {
        alert("Este neumático ya fue escaneado.");
        setRfidInput('');
        return;
      }

      // Add to scanned list with status = 'OK' by default
      setScannedTires(prev => [...prev, { ...matchedTire, status: 'OK' }]);
    }

    setRfidInput('');
  };

  // Simulate scanning tires
  const handleSimulatedScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      if (tab === 'envio') {
        const available = allTires.filter(
          t => t.state.includes('Bodega') && !scannedTires.some(st => st.fire_mark_id === t.fire_mark_id)
        );
        const toAdd = available.slice(0, 3);
        if (toAdd.length === 0) {
          alert("No hay más neumáticos disponibles en Bodega.");
        } else {
          setScannedTires(prev => [...prev, ...toAdd]);
        }
      } 
      else if (tab === 'recepcion' && selectedGuide) {
        // Find expected tires in this guide that are not yet scanned
        const expected = selectedGuide.tires_details.filter(
          (t: any) => !scannedTires.some(st => st.fire_mark_id === t.fire_mark_id)
        );
        const toAdd = expected.slice(0, 3).map((t: any) => ({ ...t, status: 'OK' }));
        if (toAdd.length === 0) {
          alert("Todos los neumáticos de esta guía ya fueron escaneados en simulación.");
        } else {
          setScannedTires(prev => [...prev, ...toAdd]);
        }
      }
      setIsScanning(false);
    }, 1000);
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
      alert("Seleccione la planta proveedora externa.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.sendRetread({
        action_type: operationType,
        supplier_branch_id: selectedBranch,
        rfids: scannedTires.map(t => t.fire_mark_id)
      });
      setResultDoc(res.document);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Error registrando despacho.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReceive = async () => {
    if (!selectedBranch) {
      alert("Seleccione la bodega interna receptora.");
      return;
    }
    if (scannedTires.length === 0) {
      alert("Debe escanear al menos un neumático para recepcionar.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.receiveRetread({
        related_document_id: selectedGuide.id,
        branch_id: selectedBranch,
        tires: scannedTires.map(t => ({ rfid: t.fire_mark_id, status: t.status }))
      });
      setResultDoc(res.document);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Error registrando recepción.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuide = (guide: any) => {
    setSelectedGuide(guide);
    setScannedTires([]);
    setStep(2);
  };

  const retreadPlants = branches.filter(b => b.type === 'Planta Recauchaje');
  const internalWarehouses = branches.filter(b => b.type === 'Base Interna');

  return (
    <div className="flex flex-col space-y-4">
      {/* Tab Navigation */}
      {step === 1 && (
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/5 text-[10px]">
          <button 
            onClick={() => handleTabChange('envio')}
            className={`flex-1 py-2.5 font-bold uppercase tracking-wider rounded-lg transition-all
              ${tab === 'envio' ? 'bg-vani-cyan text-black' : 'text-slate-400 hover:text-white'}`}
          >
            🚚 Despacho (Envío)
          </button>
          <button 
            onClick={() => handleTabChange('recepcion')}
            className={`flex-1 py-2.5 font-bold uppercase tracking-wider rounded-lg transition-all
              ${tab === 'recepcion' ? 'bg-vani-cyan text-black' : 'text-slate-400 hover:text-white'}`}
          >
            📥 Recepción
          </button>
          <button 
            onClick={() => handleTabChange('pendientes')}
            className={`flex-1 py-2.5 font-bold uppercase tracking-wider rounded-lg transition-all
              ${tab === 'pendientes' ? 'bg-vani-cyan text-black' : 'text-slate-400 hover:text-white'}`}
          >
            📋 Pendientes
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <button onClick={() => step > 1 ? setStep(step - 1) : window.history.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            ←
          </button>
          <h2 className="text-base font-bold text-white">
            {tab === 'envio' ? 'Despacho a Planta' : tab === 'recepcion' ? 'Recepción de Planta' : 'Guías en Tránsito'}
          </h2>
        </div>
        <span className="text-[10px] font-mono text-vani-cyan bg-vani-cyan/10 px-2 py-0.5 rounded border border-vani-cyan/20">
          {tab === 'pendientes' ? 'CONSULTA' : `PASO ${step}/${tab === 'envio' ? 3 : 3}`}
        </span>
      </div>

      {loading && step !== 2 && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-vani-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ENVIO A PLANTA (DESPACHO)                                          */}
      {/* ========================================================================= */}
      {tab === 'envio' && !loading && (
        <>
          {/* STEP 1: SCAN NEUMATICOS */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Type Switcher */}
              <div className="bg-slate-900 p-1 rounded-lg border border-white/5 flex text-xs">
                <button 
                  onClick={() => setOperationType('RECAUCHAJE_ENVIO')}
                  className={`flex-1 py-2 rounded font-bold transition-all ${operationType === 'RECAUCHAJE_ENVIO' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
                >
                  Para Recauchaje
                </button>
                <button 
                  onClick={() => setOperationType('REPARACION_ENVIO')}
                  className={`flex-1 py-2 rounded font-bold transition-all ${operationType === 'REPARACION_ENVIO' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  Para Reparación
                </button>
              </div>

              <form onSubmit={handleRfidSubmit} className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Escaneo RFID / Marca Fuego</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    ref={rfidInputRef}
                    placeholder="Dispare o escriba tag..." 
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
                className="w-full py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold rounded-lg text-xs uppercase tracking-widest"
              >
                {isScanning ? 'LEYENDO...' : 'Simular Lectura RFID (3 Uds. de Bodega)'}
              </button>

              {/* Scanned List */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                  <span>Lote a Despachar</span>
                  <span className="text-white font-mono">{scannedTires.length} uds.</span>
                </div>
                
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
                onClick={() => setStep(2)}
                disabled={scannedTires.length === 0}
                className={`w-full py-4 rounded-xl text-lg font-bold tracking-widest uppercase transition-all shadow-lg
                  ${scannedTires.length > 0 ? 'bg-vani-cyan text-black' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'}`}
              >
                Continuar a Proveedor →
              </button>
            </div>
          )}

          {/* STEP 2: SELECT PROVIDER */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl space-y-2 text-xs">
                <span className="text-slate-500 uppercase tracking-widest font-bold">Resumen de Envío</span>
                <p className="text-white">Operación: <strong className={operationType === 'RECAUCHAJE_ENVIO' ? 'text-amber-500' : 'text-purple-400'}>
                  {operationType === 'RECAUCHAJE_ENVIO' ? 'RECAUCHAJE' : 'REPARACIÓN'}
                </strong></p>
                <p className="text-white">Neumáticos a enviar: <strong>{scannedTires.length} unidades</strong></p>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Seleccionar Planta Proveedora Destino</label>
                <select 
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-vani-cyan"
                >
                  <option value="">Seleccione Planta/Proveedor...</option>
                  {retreadPlants.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <button 
                onClick={handleExecuteSend}
                disabled={!selectedBranch}
                className={`w-full py-4 rounded-xl text-lg font-bold tracking-widest uppercase transition-all shadow-lg
                  ${selectedBranch ? 'bg-vani-cyan text-black' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'}`}
              >
                Generar Guía de Envío
              </button>
            </div>
          )}

          {/* STEP 3: DISPATCH GUIDE DISPLAY */}
          {step === 3 && resultDoc && (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 border border-green-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                📄
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Despachado con Éxito</h3>
                <p className="text-xs text-slate-400">Los neumáticos ahora están bajo custodia del proveedor externo. Imprima este comprobante.</p>
              </div>

              {/* Thermal Printer Layout */}
              <div className="bg-white text-slate-900 p-5 rounded-xl text-left font-mono text-[10px] max-w-sm mx-auto shadow-2xl border-4 border-slate-300 space-y-4">
                <div className="text-center border-b border-dashed border-slate-900 pb-2">
                  <h4 className="font-black text-xs uppercase tracking-wider">GUÍA DE DESPACHO EXTERNO</h4>
                  <p className="text-slate-500">AXON TIRES LOGISTICS</p>
                </div>
                
                <div className="space-y-0.5">
                  <div>Guía N°: <span className="font-bold">{resultDoc.document_number}</span></div>
                  <div>Fecha: <span>{new Date(resultDoc.created_at).toLocaleString()}</span></div>
                  <div>Operación: <span className="font-bold">{resultDoc.action_type === 'RECAUCHAJE_ENVIO' ? 'ENVÍO RECAUCHAJE' : 'ENVÍO REPARACIÓN'}</span></div>
                  <div>Proveedor: <span className="font-bold">{branches.find(b => b.id === selectedBranch)?.name}</span></div>
                </div>

                <div className="border-t border-dashed border-slate-900 pt-2">
                  <span className="font-bold uppercase block mb-1 text-[9px]">Detalle de Cascos:</span>
                  <table className="w-full text-left text-[9px]">
                    <thead>
                      <tr className="border-b border-slate-900 font-bold">
                        <th>Marca Fuego</th>
                        <th className="text-right">RFID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scannedTires.map((t, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-1">{t.fire_mark_id}</td>
                          <td className="text-right py-1">{t.rfid_id || 'SIN-RFID'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-dashed border-slate-900 pt-4 text-center text-[9px] text-slate-500 font-sans">
                  <p>COMPROBANTE DE OPERACIONES EXTERNAS</p>
                  <button onClick={() => window.print()} className="mt-2.5 px-4 py-2 bg-slate-900 text-white font-bold rounded text-[9px] uppercase tracking-wider print:hidden">
                    🖨️ Imprimir
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
                  className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 text-xs tracking-widest uppercase"
                >
                  Registrar Otro Envío
                </button>
                <Link href="/mobile/movements" className="w-full text-slate-400 hover:text-white py-2 text-xs tracking-wider uppercase">
                  Volver a Movimientos
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RECEPCION DE PLANTA (RETORNO BASADO EN GUIA)                       */}
      {/* ========================================================================= */}
      {tab === 'recepcion' && !loading && (
        <>
          {/* STEP 1: SELECT PENDING DISPATCH GUIDE */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Seleccione la Guía de Despacho de origen para recepcionar:</p>
              
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {pendingGuides.map(guide => (
                  <button 
                    key={guide.id}
                    onClick={() => handleSelectGuide(guide)}
                    className="w-full bg-slate-800/40 p-4 rounded-xl flex justify-between items-center border border-white/5 hover:border-vani-cyan active:scale-[0.98] transition-all text-left"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white tracking-wider">{guide.document_number}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${guide.status === 'PARCIAL' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                          {guide.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Proveedor: {guide.supplier_name}</span>
                      <span className="text-[9px] text-slate-500 block">Enviado: {new Date(guide.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-vani-cyan block">
                        {guide.action_type === 'RECAUCHAJE_ENVIO' ? 'Recauchaje' : 'Reparación'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{guide.tires_details?.length || 0} Neum.</span>
                    </div>
                  </button>
                ))}
                {pendingGuides.length === 0 && (
                  <p className="text-center text-slate-500 text-xs py-10 italic">No hay guías de despacho pendientes de recepción en el sistema.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SCAN & VERIFY TIRES FROM GUIDE */}
          {step === 2 && selectedGuide && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-white/5 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Guía Origen: <strong className="text-white">{selectedGuide.document_number}</strong></span>
                  <span className="text-vani-cyan font-bold">{selectedGuide.action_type === 'RECAUCHAJE_ENVIO' ? 'RECAUCHAJE' : 'REPARACIÓN'}</span>
                </div>
                <p className="text-slate-400">Proveedor: <span className="text-white font-medium">{selectedGuide.supplier_name}</span></p>
                <p className="text-slate-400">Esperados en Guía: <span className="text-white font-mono font-bold">{selectedGuide.tires_details?.length} neumáticos</span></p>
              </div>

              {/* Scanning inputs */}
              <form onSubmit={handleRfidSubmit} className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Escanear RFID del Neumático Retornado</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    ref={rfidInputRef}
                    placeholder="Dispare o escriba tag..." 
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
                className="w-full py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold rounded-lg text-xs uppercase tracking-widest"
              >
                {isScanning ? 'LEYENDO...' : 'Simular Lectura RFID de la Guía'}
              </button>

              {/* Verification List */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                  <span>Neumáticos Escaneados</span>
                  <span className="text-white font-mono">{scannedTires.length} / {selectedGuide.tires_details.length}</span>
                </div>
                
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {scannedTires.map((t, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">{t.fire_mark_id}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{t.rfid_id}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => toggleTireStatus(idx)}
                          className={`px-3 py-1 rounded font-bold uppercase tracking-wider text-[9px] transition-all
                            ${t.status === 'OK' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                            }`}
                        >
                          {t.status === 'OK' ? 'Resultado OK ✓' : 'Rechazado (Casco) ✗'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {scannedTires.length === 0 && (
                    <p className="text-slate-600 italic text-center py-8 text-xs">Sin lecturas de validación...</p>
                  )}
                </div>
              </div>

              {/* Warehouse selector & Submit */}
              {scannedTires.length > 0 && (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-2">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Bodega de Recepción Destino</label>
                  <select 
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-vani-cyan text-xs"
                  >
                    <option value="">Seleccione Bodega...</option>
                    {internalWarehouses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}

              <button 
                onClick={handleExecuteReceive}
                disabled={!selectedBranch || scannedTires.length === 0}
                className={`w-full py-4 rounded-xl text-lg font-bold tracking-widest uppercase transition-all shadow-lg
                  ${selectedBranch && scannedTires.length > 0 ? 'bg-vani-cyan text-black' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'}`}
              >
                Cerrar Recepción ({scannedTires.length})
              </button>
            </div>
          )}

          {/* STEP 3: SUCCESS SUMMARY */}
          {step === 3 && resultDoc && (
            <div className="text-center py-10 space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 border border-green-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">Recepción Registrada</h3>
                <p className="text-xs text-slate-400">Se ingresaron los neumáticos a la bodega seleccionada. La guía original se actualizó a estado <strong>{resultDoc.status || 'RECIBIDO'}</strong>.</p>
              </div>

              <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl text-left space-y-2.5 font-mono text-xs max-w-sm mx-auto">
                <div className="text-slate-400 font-sans">Guía de Retorno: <span className="text-white font-bold">{resultDoc.document_number}</span></div>
                <div className="text-slate-400 font-sans">Bodega Receptora: <span className="text-white">{branches.find(b => b.id === selectedBranch)?.name}</span></div>
                <div className="border-t border-white/10 my-2"></div>
                <div className="text-[10px] text-vani-cyan uppercase tracking-wider font-sans font-bold">Detalle de Ingreso:</div>
                {scannedTires.map(t => (
                  <div key={t.fire_mark_id} className="flex justify-between items-center text-slate-300">
                    <span>{t.fire_mark_id}:</span>
                    <span className={t.status === 'OK' ? 'text-green-400' : 'text-red-400 font-bold'}>
                      {t.status === 'OK' ? 'Exitoso (Bodega Usado)' : 'RECHAZADO (Casco)'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col space-y-2 max-w-sm mx-auto pt-4">
                <button 
                  onClick={() => {
                    setScannedTires([]);
                    setSelectedBranch('');
                    setSelectedGuide(null);
                    setResultDoc(null);
                    loadData();
                    setStep(1);
                  }}
                  className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 text-xs tracking-widest uppercase"
                >
                  Recepcionar Otra Guía
                </button>
                <Link href="/mobile/movements" className="w-full text-slate-400 hover:text-white py-2 text-xs tracking-wider uppercase">
                  Volver a Movimientos
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GUIAS PENDIENTES (CONSULTA)                                         */}
      {/* ========================================================================= */}
      {tab === 'pendientes' && !loading && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Lista de despachos de recauchaje/reparación actualmente en tránsito con proveedores externos:</p>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {pendingGuides.map(guide => {
              const isExpanded = expandedGuideId === guide.id;
              const dateSent = new Date(guide.created_at);
              const daysDiff = Math.floor((Date.now() - dateSent.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div 
                  key={guide.id}
                  className={`bg-slate-800/40 rounded-xl border transition-all overflow-hidden
                    ${isExpanded ? 'border-vani-cyan bg-slate-800/60 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-white/5 hover:border-white/10'}`}
                >
                  {/* Guide Header */}
                  <div 
                    onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                    className="p-4 flex justify-between items-center cursor-pointer select-none"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white tracking-wider">{guide.document_number}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${guide.status === 'PARCIAL' ? 'bg-orange-500/10 text-orange-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {guide.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Proveedor: {guide.supplier_name}</span>
                      <span className="text-[9px] text-slate-500 block">Despachado: {dateSent.toLocaleDateString()} ({daysDiff} días fuera)</span>
                    </div>

                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-vani-cyan block">
                          {guide.action_type === 'RECAUCHAJE_ENVIO' ? 'Recauchaje' : 'Reparación'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{guide.tires_details?.length || 0} Neum.</span>
                      </div>
                      <span className="text-slate-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="bg-black/30 px-4 pb-4 pt-2 border-t border-white/5 space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 border-b border-white/5 pb-1">Detalle de Neumáticos en Tránsito:</span>
                      <div className="space-y-1.5 text-[10px] font-mono">
                        {guide.tires_details.map((t: any) => (
                          <div key={t.fire_mark_id} className="flex justify-between items-center bg-slate-900/60 p-2 rounded">
                            <div>
                              <span className="text-white font-bold block">{t.fire_mark_id}</span>
                              <span className="text-slate-500 text-[8px]">{t.brand} {t.model} | {t.size}</span>
                            </div>
                            <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-bold ${t.state === 'En Recauchaje' ? 'bg-amber-500/15 text-amber-500' : 'bg-purple-600/15 text-purple-400'}`}>
                              {t.state}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {pendingGuides.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-10 italic">No hay guías de despacho pendientes de recepción en el sistema.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
