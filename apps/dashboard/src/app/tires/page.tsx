'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function TiresModulePage() {
  const [tires, setTires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTires = async () => {
    try {
      setLoading(true);
      const data = await api.getTires();
      setTires(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTires();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group flex justify-between items-center">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-vani-cyan/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-light text-white tracking-wide mb-1">Neumáticos <span className="text-vani-cyan glow-text font-bold">(TPMS)</span></h1>
          <p className="text-slate-400 font-light">Inventario global de neumáticos, recauchajes y sensores activos.</p>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-end border border-white/5">
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-slate-500 uppercase tracking-widest">Estado</label>
          <select className="bg-black/50 border border-white/10 text-white p-2 rounded min-w-[150px] focus:outline-none focus:border-vani-cyan">
            <option>Todos</option>
            <option>Bodega (Nuevos/Listos)</option>
            <option>Operativo</option>
            <option>Recauchaje</option>
            <option>Desecho</option>
          </select>
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-slate-500 uppercase tracking-widest">Buscar</label>
          <input type="text" placeholder="Ej. Marca Fuego..." className="bg-black/50 border border-white/10 text-white p-2 rounded min-w-[200px] focus:outline-none focus:border-vani-cyan" />
        </div>
        <button className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded transition-all text-sm tracking-widest">
          FILTRAR
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-vani-cyan border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-slate-500 text-xs uppercase tracking-widest border-b border-white/10">
                <th className="p-4 font-medium">Marca Fuego</th>
                <th className="p-4 font-medium">Medida / Marca</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">RFID</th>
                <th className="p-4 font-medium">KM Acum.</th>
                <th className="p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-slate-300 divide-y divide-white/5">
              {tires.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay neumáticos registrados.</td></tr>
              ) : (
                tires.map((t) => (
                  <tr key={t.fire_mark_id} className="hover:bg-white/5 transition-all group">
                    <td className="p-4 font-bold text-vani-cyan tracking-wider">{t.fire_mark_id}</td>
                    <td className="p-4">
                      <div className="text-white">{t.size || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t.brand} {t.model}</div>
                    </td>
                    <td className="p-4">
                      {t.state.includes('Bodega') ? (
                        <span className="px-2 py-1 bg-vani-cyan/10 text-vani-cyan text-[10px] uppercase tracking-widest rounded border border-vani-cyan/30">{t.state}</span>
                      ) : t.state === 'Operativo' ? (
                        <span className="px-2 py-1 bg-white/10 text-white text-[10px] uppercase tracking-widest rounded border border-white/20">{t.state}</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] uppercase tracking-widest rounded border border-yellow-500/30">{t.state}</span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-500">{t.rfid_id || 'SIN-RFID'}</td>
                    <td className="p-4 font-mono text-sm">{t.accumulated_mileage?.toLocaleString() || 0} KM</td>
                    <td className="p-4">
                      <select className="bg-black/50 border border-white/10 text-xs text-slate-300 p-2 rounded focus:outline-none focus:border-vani-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                        <option>Opciones...</option>
                        <option>Ver Detalles</option>
                        <option>Enviar a Recauchaje</option>
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
