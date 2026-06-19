'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AssetsModulePage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group flex justify-between items-center">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-light text-white tracking-wide mb-1">Activos <span className="text-slate-300 font-bold">Generales</span></h1>
          <p className="text-slate-400 font-light">Inventario de pérticas, extintores, cuñas y llantas metálicas.</p>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-end border border-white/5">
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-slate-500 uppercase tracking-widest">Estado</label>
          <select className="bg-black/50 border border-white/10 text-white p-2 rounded min-w-[150px] focus:outline-none focus:border-white">
            <option>Todos</option>
            <option>Bodega</option>
            <option>En Vehículo</option>
            <option>Desecho</option>
          </select>
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-slate-500 uppercase tracking-widest">Tipo</label>
          <select className="bg-black/50 border border-white/10 text-white p-2 rounded min-w-[150px] focus:outline-none focus:border-white">
            <option>Todos</option>
            <option>Pértica</option>
            <option>Extintor</option>
            <option>Llanta Metálica</option>
            <option>Cuña</option>
          </select>
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-slate-500 uppercase tracking-widest">Buscar</label>
          <input type="text" placeholder="N° Serie / RFID..." className="bg-black/50 border border-white/10 text-white p-2 rounded min-w-[200px] focus:outline-none focus:border-white" />
        </div>
        <button className="px-5 py-2 bg-white hover:bg-slate-200 text-black font-bold rounded shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all text-sm tracking-widest">
          FILTRAR
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-slate-500 text-xs uppercase tracking-widest border-b border-white/10">
                <th className="p-4 font-medium">Tipo / Icono</th>
                <th className="p-4 font-medium">N° Serie</th>
                <th className="p-4 font-medium">RFID</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">KM Acum.</th>
                <th className="p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-slate-300 divide-y divide-white/5">
              {assets.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay activos registrados.</td></tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id} className="hover:bg-white/5 transition-all group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{a.asset_type.includes('Extintor') ? '🧯' : a.asset_type.includes('Pértica') ? '🚩' : '⚙️'}</span>
                        <span className="text-white font-medium">{a.asset_type}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm tracking-widest">{a.serial_number || 'N/A'}</td>
                    <td className="p-4 text-xs font-mono text-slate-500">{a.rfid_id || 'SIN-RFID'}</td>
                    <td className="p-4">
                      {a.state.includes('Bodega') ? (
                        <span className="px-2 py-1 bg-white/10 text-white text-[10px] uppercase tracking-widest rounded border border-white/30">{a.state}</span>
                      ) : a.state === 'En Vehículo' ? (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-widest rounded border border-blue-500/30">{a.state}</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] uppercase tracking-widest rounded border border-red-500/30">{a.state}</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-sm">{a.accumulated_mileage?.toLocaleString() || 0} KM</td>
                    <td className="p-4">
                      <select className="bg-black/50 border border-white/10 text-xs text-slate-300 p-2 rounded focus:outline-none focus:border-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <option>Opciones...</option>
                        <option>Ver Historial</option>
                        <option>Mover a Bodega</option>
                        <option>Dar de Baja</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
