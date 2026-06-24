'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function VehiclesModulePage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableTires, setAvailableTires] = useState<any[]>([]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  
  // Modals & Selected
  const [showAddNode, setShowAddNode] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  
  // Assignment Simulation
  const [assigningPosition, setAssigningPosition] = useState<string | null>(null);

  // Checkpoints log inside vehicle inspector
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [inspectorTab, setInspectorTab] = useState<'diagram' | 'log'>('diagram');

  // Form
  const [newNodeForm, setNewNodeForm] = useState({ 
    plate: '', vehicle_type: 'Tractocamión', axle_config: '6x4', current_odometer: 0,
    brand: '', model: '', year: new Date().getFullYear() 
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [vData, tData, aData] = await Promise.all([
        api.getVehicles(),
        api.getTires(),
        api.getAssets()
      ]);
      setVehicles(vData);
      setAvailableTires(tData.filter((t: any) => t.state.includes('Bodega')));
      setAvailableAssets(aData.filter((a: any) => a.state.includes('Bodega')));
      
      if (selectedVehicle) {
        const updated = vData.find((v:any) => v.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      api.getVehicleCheckpoints(selectedVehicle.id)
        .then(res => setCheckpoints(res))
        .catch(console.error);
    } else {
      setCheckpoints([]);
      setInspectorTab('diagram');
    }
  }, [selectedVehicle]);

  const filteredVehicles = vehicles.filter(v => v.plate.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVehicle({ ...newNodeForm, branch_id: null });
      setShowAddNode(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateRfidAssign = async (position: string) => {
    if (availableTires.length === 0) {
      alert("No hay neumáticos en bodega disponibles para asignar.");
      return;
    }
    const randomTire = availableTires[0]; // Tomamos el primero
    try {
      await api.assignTire({ 
        tire_fire_mark: randomTire.fire_mark_id,
        axle_position: position,
        start_odometer: selectedVehicle.current_odometer,
        vehicle_id: selectedVehicle.id 
      });
      setAssigningPosition(null);
      loadData(); // Refresca en segundo plano para actualizar el SelectedVehicle
    } catch (err) {
      console.error(err);
      alert("Error asignando neumático.");
    }
  };

  // Helper para dibujar diagrama según config
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
    // Default fallback
    return [{ name: 'Eje 1', positions: ['1I', '1D'] }];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header Fijo */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex-shrink-0 group flex flex-col md:flex-row justify-between items-start md:items-center z-0 gap-4">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-vani-cyan/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-light text-white tracking-wide mb-1">Nodos de <span className="text-vani-cyan glow-text font-bold">Flota</span></h1>
          <p className="text-slate-400 font-light text-sm">Gestión central de vehículos en vista de tabla de alto rendimiento.</p>
        </div>
        <div className="flex w-full md:w-auto space-x-4">
          <input 
            type="text" 
            placeholder="Buscar por Patente..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg px-4 py-2 focus:border-vani-cyan focus:outline-none"
          />
          <button onClick={() => setShowAddNode(true)} className="whitespace-nowrap px-5 py-2.5 bg-vani-cyan/20 hover:bg-vani-cyan/40 border border-vani-cyan/30 text-vani-cyan font-bold rounded-lg transition-all tracking-widest text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            + AÑADIR NODO
          </button>
        </div>
      </div>

      {/* Tabla Maestra (Scrollable) */}
      <div className="flex-1 glass-panel rounded-2xl overflow-auto border border-white/10">
        {loading && !selectedVehicle ? (
           <div className="flex items-center justify-center h-full">
             <div className="w-8 h-8 border-4 border-vani-cyan border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[#0f172a] z-10 shadow-md border-b border-white/10">
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                <th className="p-4 font-medium w-12"></th>
                <th className="p-4 font-medium">Patente</th>
                <th className="p-4 font-medium">Marca / Modelo</th>
                <th className="p-4 font-medium">Año</th>
                <th className="p-4 font-medium">Tipo y Config</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-right">Odómetro</th>
                <th className="p-4 font-medium text-center">Neumáticos</th>
              </tr>
            </thead>
            <tbody className="text-slate-300 divide-y divide-white/5">
              {filteredVehicles.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No se encontraron vehículos.</td></tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr 
                    key={v.id} 
                    onClick={() => setSelectedVehicle(v)}
                    className="hover:bg-vani-cyan/5 cursor-pointer transition-all group"
                  >
                    <td className="p-4 text-center">
                      <div className="w-2 h-2 rounded-full bg-vani-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)] opacity-50 group-hover:opacity-100"></div>
                    </td>
                    <td className="p-4 font-bold text-white text-lg tracking-wider">{v.plate}</td>
                    <td className="p-4 text-sm">{v.brand || '-'} {v.model || '-'}</td>
                    <td className="p-4 text-sm text-slate-400">{v.year || '-'}</td>
                    <td className="p-4">
                      <span className="block text-sm text-white">{v.vehicle_type}</span>
                      <span className="text-[10px] uppercase text-vani-cyan border border-vani-cyan/30 rounded px-1">{v.axle_config}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${v.status === 'EN_RUTA' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-vani-cyan/20 text-vani-cyan border border-vani-cyan/30'}`}>
                        {v.status || 'EN_BASE'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-sm">{v.current_odometer?.toLocaleString()} KM</td>
                    <td className="p-4 text-center">
                      <span className="bg-white/10 px-2 py-1 rounded text-xs">{(v.tires?.length) || 0} instalados</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- INSPECTOR DE VEHÍCULO (Modal Full/Lateral) --- */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-40 p-4">
          <div className="bg-[#0f172a] border border-vani-cyan/40 w-full max-w-5xl h-[85vh] rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Panel Izquierdo: Info y Activos Generales */}
            <div className="w-full md:w-1/3 bg-black/40 border-r border-white/10 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-4xl font-bold text-white tracking-widest mb-1">{selectedVehicle.plate}</h2>
                  <p className="text-vani-cyan uppercase tracking-widest text-xs font-bold">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})</p>
                </div>
                <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Odómetro Actual</p>
                  <p className="text-2xl font-mono text-white">{selectedVehicle.current_odometer?.toLocaleString()} KM</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Configuración</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-bold text-white">{selectedVehicle.vehicle_type} - {selectedVehicle.axle_config}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${selectedVehicle.status === 'EN_RUTA' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-vani-cyan/20 text-vani-cyan border border-vani-cyan/30'}`}>
                        {selectedVehicle.status || 'EN_BASE'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <h3 className="text-xs text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Activos Generales Instalados</h3>
                {selectedVehicle.general_assets?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No hay activos (ej. Extintores) asignados.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedVehicle.general_assets?.map((a:any) => (
                      <div key={a.id} className="p-3 bg-white/5 border border-white/10 rounded flex justify-between items-center">
                        <div>
                          <p className="text-sm text-white font-bold">{a.asset_type}</p>
                          <p className="text-[10px] font-mono text-slate-400">{a.serial_number}</p>
                        </div>
                        <span className="text-lg">{a.asset_type.includes('Extintor') ? '🧯' : '🚩'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button className="mt-4 w-full py-2 border border-white/20 text-slate-300 rounded hover:bg-white/10 transition-all text-xs tracking-widest">+ ASIGNAR ACTIVO (Próximamente)</button>
              </div>
            </div>

            {/* Panel Derecho: Diagrama de Neumáticos interactivo */}
            <div className="w-full md:w-2/3 p-6 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/80 to-[#0f172a]/95 pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div className="flex space-x-6">
                  <button 
                    onClick={() => setInspectorTab('diagram')}
                    className={`text-lg tracking-wide transition-all ${inspectorTab === 'diagram' ? 'text-white font-bold border-b-2 border-vani-cyan pb-1' : 'text-slate-400 hover:text-white'}`}
                  >
                    Diagrama de Neumáticos
                  </button>
                  <button 
                    onClick={() => setInspectorTab('log')}
                    className={`text-lg tracking-wide transition-all ${inspectorTab === 'log' ? 'text-white font-bold border-b-2 border-vani-cyan pb-1' : 'text-slate-400 hover:text-white'}`}
                  >
                    Bitácora y Controles
                  </button>
                </div>
                {inspectorTab === 'diagram' && (
                  <div className="flex space-x-4 text-xs">
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded bg-vani-cyan shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div><span className="text-slate-300">Instalado</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded bg-slate-700 border border-white/10"></div><span className="text-slate-300">Vacío</span></div>
                  </div>
                )}
              </div>

              {/* Contenedor del Chasis (Diagrama) */}
              {inspectorTab === 'diagram' && (
                <div className="relative z-10 flex-1 flex items-center justify-center overflow-auto">
                  <div className="bg-black/40 border border-white/10 p-8 rounded-[3rem] w-full max-w-md mx-auto relative shadow-2xl flex flex-col space-y-12 py-16">
                    {/* Cabina Ilustrativa */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-white/5 border border-white/10 rounded-t-3xl -mt-4 border-b-0"></div>

                    {getAxleLayout(selectedVehicle.axle_config).map((axle, i) => (
                       <div key={i} className="relative flex justify-center items-center w-full">
                         {/* Eje Metálico (Línea horizontal) */}
                         <div className="absolute w-[80%] h-2 bg-slate-800 rounded-full shadow-inner z-0"></div>
                         
                         <div className="flex justify-between w-[95%] z-10">
                           {/* Lado Izquierdo */}
                           <div className="flex space-x-2">
                             {axle.positions.filter(p => p.endsWith('I')).reverse().map(pos => {
                               const installedTire = selectedVehicle.tires?.find((t:any) => t.axle_position === pos);
                               return (
                                 <div key={pos} 
                                      onClick={() => !installedTire && setAssigningPosition(pos)}
                                      className={`relative w-12 h-24 rounded flex items-center justify-center font-bold text-[10px] transition-all
                                        ${installedTire 
                                          ? 'bg-gradient-to-b from-vani-cyan to-blue-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-default' 
                                          : 'bg-slate-800 border-2 border-dashed border-white/20 text-slate-500 hover:border-vani-cyan hover:text-vani-cyan cursor-pointer hover:bg-vani-cyan/10'
                                        }`}>
                                   {installedTire ? (
                                     <div className="-rotate-90 whitespace-nowrap">{installedTire.fire_mark_id}</div>
                                   ) : (
                                     <div className="flex flex-col items-center"><span>{pos}</span><span className="text-[8px] font-normal mt-1">+ Instalar</span></div>
                                   )}
                                 </div>
                               );
                             })}
                           </div>

                           {/* Diferencial/Centro */}
                           <div className="w-12 h-12 bg-slate-900 border border-white/10 rounded-full z-10 flex items-center justify-center shadow-lg">
                             <span className="text-[8px] text-slate-500 uppercase">{axle.name}</span>
                           </div>

                           {/* Lado Derecho */}
                           <div className="flex space-x-2">
                             {axle.positions.filter(p => p.endsWith('D')).map(pos => {
                               const installedTire = selectedVehicle.tires?.find((t:any) => t.axle_position === pos);
                               return (
                                 <div key={pos} 
                                      onClick={() => !installedTire && setAssigningPosition(pos)}
                                      className={`relative w-12 h-24 rounded flex items-center justify-center font-bold text-[10px] transition-all
                                        ${installedTire 
                                          ? 'bg-gradient-to-b from-vani-cyan to-blue-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-default' 
                                          : 'bg-slate-800 border-2 border-dashed border-white/20 text-slate-500 hover:border-vani-cyan hover:text-vani-cyan cursor-pointer hover:bg-vani-cyan/10'
                                        }`}>
                                   {installedTire ? (
                                     <div className="-rotate-90 whitespace-nowrap">{installedTire.fire_mark_id}</div>
                                   ) : (
                                     <div className="flex flex-col items-center"><span>{pos}</span><span className="text-[8px] font-normal mt-1">+ Instalar</span></div>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                         </div>
                       </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bitácora de Controles */}
              {inspectorTab === 'log' && (
                <div className="relative z-10 flex-1 overflow-y-auto space-y-4 pr-2">
                  {checkpoints.length === 0 ? (
                    <p className="text-slate-500 italic text-center py-20 text-sm">No se registran eventos de control para este vehículo.</p>
                  ) : (
                    <div className="space-y-4">
                      {checkpoints.map((cp: any) => (
                        <div key={cp.id} className={`p-5 rounded-2xl border bg-black/40 transition-all ${cp.status === 'DIVERGENTE' ? 'border-red-500/30 hover:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-white/5 hover:border-white/10'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-3">
                              <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest ${cp.event_type === 'SALIDA_A_RUTA' ? 'bg-vani-cyan/10 text-vani-cyan border border-vani-cyan/25' : 'bg-orange-500/10 text-orange-400 border border-orange-500/25'}`}>
                                {cp.event_type === 'SALIDA_A_RUTA' ? 'Salida a Ruta' : 'Llegada a Base'}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">{new Date(cp.event_timestamp).toLocaleString()}</span>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${cp.status === 'OK' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                              {cp.status === 'OK' ? 'Cuadratura OK' : 'Divergencia'}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 space-y-2 mt-4 font-sans">
                            <p className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-500 font-sans">Base/Sucursal:</span> <span className="text-white font-medium">{cp.branch_name || 'Ruta'}</span></p>
                            {cp.notes && <p className="italic text-slate-500 bg-black/20 p-2.5 rounded border border-white/5">"{cp.notes}"</p>}
                            
                            {/* Missing RFIDs */}
                            {cp.missing_rfids && cp.missing_rfids.length > 0 && (
                              <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg mt-3">
                                <span className="text-[10px] text-red-400 font-bold uppercase block mb-2 tracking-wide font-sans">❌ FALTANTES EN VEHÍCULO (NO DETECTADOS):</span>
                                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                                  {cp.missing_rfids.map((r: string) => (
                                    <div key={r} className="text-red-400/90 bg-red-500/5 px-2 py-1 rounded border border-red-500/10">⚠️ {r}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Unknown RFIDs */}
                            {cp.unknown_rfids && cp.unknown_rfids.length > 0 && (
                              <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-lg mt-3">
                                <span className="text-[10px] text-yellow-500 font-bold uppercase block mb-2 tracking-wide font-sans">❓ LEÍDOS NO REGISTRADOS EN FICHA:</span>
                                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                                  {cp.unknown_rfids.map((r: string) => (
                                    <div key={r} className="text-yellow-400/90 bg-yellow-500/5 px-2 py-1 rounded border border-yellow-500/10">🔍 {r}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-modal de asignación RFID rápida */}
              {assigningPosition && (
                <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                  <div className="bg-[#0f172a] border border-vani-cyan shadow-[0_0_30px_rgba(6,182,212,0.3)] p-6 rounded-2xl text-center max-w-sm w-full">
                    <div className="w-16 h-16 bg-vani-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-vani-cyan/50">
                      <span className="text-2xl animate-pulse">📡</span>
                    </div>
                    <h4 className="text-white text-lg font-bold mb-2">Instalación en Posición {assigningPosition}</h4>
                    <p className="text-slate-400 text-sm mb-6">Apunta el lector RFID de mano al neumático físico que deseas instalar para continuar.</p>
                    <div className="flex flex-col space-y-3">
                      <button onClick={() => handleSimulateRfidAssign(assigningPosition)} className="w-full py-3 bg-vani-cyan text-black font-bold uppercase tracking-widest text-sm rounded shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-white transition-all">
                        SIMULAR LECTURA RFID
                      </button>
                      <button onClick={() => setAssigningPosition(null)} className="w-full py-2 text-slate-500 hover:text-white uppercase tracking-widest text-xs">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Node (Create) */}
      {showAddNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f172a] border border-vani-cyan/30 p-6 rounded-2xl w-full max-w-md shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <h2 className="text-xl text-white font-light mb-6 tracking-wide">Añadir Nuevo Nodo</h2>
            <form onSubmit={handleAddNode} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Patente</label>
                <input type="text" required value={newNodeForm.plate} onChange={e => setNewNodeForm({...newNodeForm, plate: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Marca</label>
                  <input type="text" value={newNodeForm.brand} onChange={e => setNewNodeForm({...newNodeForm, brand: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Modelo</label>
                  <input type="text" value={newNodeForm.model} onChange={e => setNewNodeForm({...newNodeForm, model: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Año</label>
                  <input type="number" value={newNodeForm.year} onChange={e => setNewNodeForm({...newNodeForm, year: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Odómetro</label>
                  <input type="number" required value={newNodeForm.current_odometer} onChange={e => setNewNodeForm({...newNodeForm, current_odometer: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Tipo</label>
                  <select value={newNodeForm.vehicle_type} onChange={e => setNewNodeForm({...newNodeForm, vehicle_type: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan">
                    <option>Tractocamión</option>
                    <option>Semirremolque</option>
                    <option>Camioneta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Ejes</label>
                  <select value={newNodeForm.axle_config} onChange={e => setNewNodeForm({...newNodeForm, axle_config: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan">
                    <option>6x4</option>
                    <option>6x2</option>
                    <option>4x2</option>
                    <option>2 Ejes</option>
                    <option>3 Ejes</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowAddNode(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-all text-sm tracking-wide">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-vani-cyan hover:bg-cyan-400 text-black font-bold rounded shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all text-sm tracking-wide">Guardar Vehículo</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
