'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function BranchesModulePage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Base Interna', address: '' });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await api.getBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBranch(form);
      setShowAddBranch(false);
      setForm({ name: '', type: 'Base Interna', address: '' });
      loadBranches();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group flex justify-between items-center z-0">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-vani-cyan/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-light text-white tracking-wide mb-1">Red de <span className="text-vani-cyan glow-text font-bold">Sucursales</span></h1>
          <p className="text-slate-400 font-light">Gestión de bases internas, plantas de recauchaje y bodegas externas.</p>
        </div>
        <button onClick={() => setShowAddBranch(true)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all tracking-widest text-sm font-light hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          + NUEVA SUCURSAL
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-vani-cyan border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-0">
          {branches.map((b) => (
            <div key={b.id} className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-white/10 hover:border-vani-cyan/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{b.name}</h3>
                  <span className={`px-2 py-1 text-[10px] uppercase tracking-widest rounded border ${
                    b.type === 'Base Interna' ? 'bg-vani-cyan/10 text-vani-cyan border-vani-cyan/30' :
                    b.type === 'Planta Recauchaje' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}>
                    {b.type}
                  </span>
                </div>
                <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-xl">
                  {b.type === 'Base Interna' ? '🏢' : b.type === 'Planta Recauchaje' ? '🏭' : '📦'}
                </div>
              </div>
              <div className="text-sm text-slate-400 mt-4 border-t border-white/5 pt-4">
                <span className="text-[10px] uppercase tracking-widest block text-slate-500 mb-1">Ubicación</span>
                {b.address || 'Sin dirección registrada'}
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <div className="col-span-full h-32 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500">
              No hay sucursales registradas.
            </div>
          )}
        </div>
      )}

      {/* Modal Add Branch */}
      {showAddBranch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f172a] border border-vani-cyan/30 p-6 rounded-2xl w-full max-w-md shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <h2 className="text-xl text-white font-light mb-6 tracking-wide">Añadir Sucursal</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Nombre</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan transition-all" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Tipo de Sucursal</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan">
                  <option value="Base Interna">Base Interna</option>
                  <option value="Planta Recauchaje">Planta Recauchaje</option>
                  <option value="Bodega Externa">Bodega Externa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Dirección Física (Opcional)</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan transition-all" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowAddBranch(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-all text-sm tracking-wide">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-vani-cyan hover:bg-cyan-400 text-black font-bold rounded shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all text-sm tracking-wide">Crear Sucursal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
