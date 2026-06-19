'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function MobileBulkAction() {
  const [step, setStep] = useState(1);
  const [action, setAction] = useState('RECAUCHAJE');
  const [scannedTags, setScannedTags] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [resultDoc, setResultDoc] = useState<any>(null);

  const startScan = () => {
    setIsScanning(true);
    // Simulate reading 3 tags
    setTimeout(() => {
      setScannedTags(prev => [...new Set([...prev, `RFID-BULK-${Math.floor(Math.random()*1000)}`, `RFID-BULK-${Math.floor(Math.random()*1000)}`])]);
      setIsScanning(false);
    }, 1500);
  };

  const executeAction = async () => {
    try {
      const res = await api.patch('/tires/mass-update', {
        action_type: action,
        new_state: action, // Assuming state matches action
        rfids: scannedTags
      });
      setResultDoc(res.document);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert('Error ejecutando acción masiva');
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-2">
        <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          ←
        </button>
        <h2 className="text-lg font-bold">Gestión Masiva</h2>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">¿Qué desea hacer con el lote?</p>
          
          <button onClick={() => {setAction('RECAUCHAJE'); setStep(2);}} className="w-full bg-slate-800 p-5 rounded-2xl flex justify-between items-center hover:border hover:border-vani-cyan">
             <div>
                <h3 className="font-bold text-xl text-yellow-400">Enviar a Recauchaje</h3>
                <p className="text-xs text-slate-400 mt-1">Cambia estado y genera documento</p>
             </div>
             <span className="text-3xl">♻️</span>
          </button>
          
          <button onClick={() => {setAction('BAJA'); setStep(2);}} className="w-full bg-slate-800 p-5 rounded-2xl flex justify-between items-center hover:border hover:border-vani-cyan">
             <div>
                <h3 className="font-bold text-xl text-red-400">Dar de Baja (Basura)</h3>
                <p className="text-xs text-slate-400 mt-1">Saca de circulación</p>
             </div>
             <span className="text-3xl">🗑️</span>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 flex flex-col items-center">
           <h3 className="text-xl font-bold uppercase text-vani-cyan">{action}</h3>
           <div className="text-6xl font-black bg-slate-800 w-32 h-32 rounded-full flex items-center justify-center border-4 border-vani-cyan shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              {scannedTags.length}
           </div>
           <p className="text-slate-400 text-sm">Tags Leídos</p>

           <div className="w-full h-48 bg-black border border-white/10 rounded-xl p-2 overflow-y-auto space-y-1 font-mono text-xs">
              {scannedTags.map(tag => (
                 <div key={tag} className="bg-slate-900 p-2 text-green-400">✓ {tag}</div>
              ))}
              {scannedTags.length === 0 && <div className="text-slate-600 text-center mt-16">Sin lecturas...</div>}
           </div>

           <button onClick={startScan} disabled={isScanning} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg relative overflow-hidden">
              {isScanning ? 'LEYENDO...' : 'MANTENER PRESIONADO PARA LEER'}
           </button>

           {scannedTags.length > 0 && (
             <button onClick={executeAction} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg mt-4">
                Confirmar y Generar Guía
             </button>
           )}
        </div>
      )}

      {step === 3 && resultDoc && (
         <div className="text-center mt-10 space-y-6">
            <div className="text-6xl">📄</div>
            <h2 className="text-2xl font-bold text-green-400">Documento Generado</h2>
            <div className="bg-slate-800 p-6 rounded-xl font-mono text-left">
               <p className="text-slate-400">N° Doc: <span className="text-white">{resultDoc.document_number}</span></p>
               <p className="text-slate-400">Acción: <span className="text-white">{resultDoc.action_type}</span></p>
               <p className="text-slate-400">Total: <span className="text-white">{resultDoc.affected_tires?.length || 0} uds.</span></p>
            </div>
            
            <button onClick={() => window.history.back()} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl">
               Volver al Menú
            </button>
         </div>
      )}
    </div>
  );
}
