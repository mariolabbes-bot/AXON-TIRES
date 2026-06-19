'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function PurchasesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    branch_id: '',
    document_number: '',
    supplier: '',
    document_date: new Date().toISOString().split('T')[0],
  });

  // Items to add
  const [tires, setTires] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Temp form for item
  const [itemType, setItemType] = useState('Neumático');
  const [tireForm, setTireForm] = useState({ fire_mark_id: '', rfid_id: '', brand: '', model: '', size: '', initial_depth: 20.0 });
  const [assetForm, setAssetForm] = useState({ rfid_id: '', asset_type: 'Extintor', serial_number: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, pData] = await Promise.all([
        api.getBranches(),
        api.getPurchases()
      ]);
      setBranches(bData);
      setPurchases(pData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addTireItem = () => {
    if (!tireForm.fire_mark_id || !tireForm.brand) return;
    setTires([...tires, { ...tireForm }]);
    setTireForm({ fire_mark_id: '', rfid_id: '', brand: '', model: '', size: '', initial_depth: 20.0 });
  };

  const addAssetItem = () => {
    if (!assetForm.serial_number) return;
    setAssets([...assets, { ...assetForm }]);
    setAssetForm({ rfid_id: '', asset_type: 'Extintor', serial_number: '' });
  };

  const removeItem = (type: string, index: number) => {
    if (type === 'tire') {
      setTires(tires.filter((_, i) => i !== index));
    } else {
      setAssets(assets.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.branch_id || !purchaseForm.document_number) return alert('Faltan datos del documento');
    if (tires.length === 0 && assets.length === 0) return alert('Debe agregar al menos un ítem a la compra');

    try {
      const payload = {
        ...purchaseForm,
        tires,
        assets
      };
      await api.createPurchase(payload);
      setShowAddPurchase(false);
      setPurchaseForm({ branch_id: '', document_number: '', supplier: '', document_date: new Date().toISOString().split('T')[0] });
      setTires([]);
      setAssets([]);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Error guardando la compra');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group flex justify-between items-center z-0">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-vani-cyan/10 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-light text-white tracking-wide mb-1">Ingresos de <span className="text-vani-cyan glow-text font-bold">Bodega</span></h1>
          <p className="text-slate-400 font-light">Registro de documentos de compra y recepción de inventario (Neumáticos y Activos).</p>
        </div>
        {!showAddPurchase && (
          <button onClick={() => setShowAddPurchase(true)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all tracking-widest text-sm font-light hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            + NUEVO INGRESO
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-vani-cyan border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        </div>
      ) : showAddPurchase ? (
        <div className="glass-panel p-6 rounded-2xl border border-vani-cyan/30">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Registrar Nuevo Documento de Compra</h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Bodega de Destino</label>
                <select required value={purchaseForm.branch_id} onChange={e => setPurchaseForm({...purchaseForm, branch_id: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan">
                  <option value="">-- Seleccionar Bodega --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">N° Documento (Factura)</label>
                <input type="text" required value={purchaseForm.document_number} onChange={e => setPurchaseForm({...purchaseForm, document_number: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Proveedor</label>
                <input type="text" required value={purchaseForm.supplier} onChange={e => setPurchaseForm({...purchaseForm, supplier: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Fecha</label>
                <input type="date" required value={purchaseForm.document_date} onChange={e => setPurchaseForm({...purchaseForm, document_date: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-3 focus:outline-none focus:border-vani-cyan" />
              </div>
            </div>

            <div className="border border-white/5 rounded-xl p-6 bg-black/20">
              <h3 className="text-lg font-light text-vani-cyan mb-4">Cargar Ítems al Inventario</h3>
              <div className="flex space-x-4 mb-4">
                <button type="button" onClick={() => setItemType('Neumático')} className={`px-4 py-2 rounded text-sm tracking-widest uppercase transition-all ${itemType === 'Neumático' ? 'bg-vani-cyan text-black font-bold' : 'bg-white/5 text-slate-400 border border-white/10'}`}>Neumático</button>
                <button type="button" onClick={() => setItemType('Activo General')} className={`px-4 py-2 rounded text-sm tracking-widest uppercase transition-all ${itemType === 'Activo General' ? 'bg-white text-black font-bold' : 'bg-white/5 text-slate-400 border border-white/10'}`}>Activo General</button>
              </div>

              {itemType === 'Neumático' && (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Marca Fuego (Obligatorio)</label>
                    <input type="text" value={tireForm.fire_mark_id} onChange={e => setTireForm({...tireForm, fire_mark_id: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-2 focus:border-vani-cyan outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Marca</label>
                    <input type="text" value={tireForm.brand} onChange={e => setTireForm({...tireForm, brand: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-2 focus:border-vani-cyan outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Medida</label>
                    <input type="text" value={tireForm.size} onChange={e => setTireForm({...tireForm, size: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-2 focus:border-vani-cyan outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">RFID (Opcional)</label>
                    <input type="text" value={tireForm.rfid_id} onChange={e => setTireForm({...tireForm, rfid_id: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-2 focus:border-vani-cyan outline-none" />
                  </div>
                  <button type="button" onClick={addTireItem} className="bg-vani-cyan/20 hover:bg-vani-cyan/40 text-vani-cyan border border-vani-cyan/30 rounded p-2 w-full transition-all">+ Añadir</button>
                </div>
              )}

              {itemType === 'Activo General' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tipo de Activo</label>
                    <select value={assetForm.asset_type} onChange={e => setAssetForm({...assetForm, asset_type: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-2 focus:border-white outline-none">
                      <option>Extintor</option>
                      <option>Pértica</option>
                      <option>Llanta Metálica</option>
                      <option>Cuña</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">N° de Serie (Interno/Fab)</label>
                    <input type="text" value={assetForm.serial_number} onChange={e => setAssetForm({...assetForm, serial_number: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-2 focus:border-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">RFID (Opcional)</label>
                    <input type="text" value={assetForm.rfid_id} onChange={e => setAssetForm({...assetForm, rfid_id: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded p-2 focus:border-white outline-none" />
                  </div>
                  <button type="button" onClick={addAssetItem} className="bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded p-2 w-full transition-all">+ Añadir</button>
                </div>
              )}

              {/* Lista Temporal de Items a Cargar */}
              <div className="mt-6">
                {(tires.length > 0 || assets.length > 0) && (
                  <h4 className="text-sm text-slate-300 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Resumen de Carga ({tires.length + assets.length} ítems)</h4>
                )}
                <div className="space-y-2">
                  {tires.map((t, i) => (
                    <div key={`t-${i}`} className="flex justify-between items-center bg-vani-cyan/5 border border-vani-cyan/20 p-2 rounded">
                      <div className="text-sm text-white"><span className="text-vani-cyan font-bold mr-2">NEUMÁTICO</span> {t.fire_mark_id} - {t.brand} {t.size}</div>
                      <button type="button" onClick={() => removeItem('tire', i)} className="text-red-400 hover:text-red-300 text-xs px-2">Quitar</button>
                    </div>
                  ))}
                  {assets.map((a, i) => (
                    <div key={`a-${i}`} className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded">
                      <div className="text-sm text-white"><span className="text-slate-400 font-bold mr-2">ACTIVO</span> {a.asset_type} - {a.serial_number}</div>
                      <button type="button" onClick={() => removeItem('asset', i)} className="text-red-400 hover:text-red-300 text-xs px-2">Quitar</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setShowAddPurchase(false)} className="px-6 py-3 text-slate-400 hover:text-white transition-all tracking-wide">Cancelar</button>
              <button type="submit" className="px-8 py-3 bg-vani-cyan hover:bg-cyan-400 text-black font-bold rounded shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all tracking-widest uppercase">Guardar Documento y Cargar Inventario</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-slate-500 text-xs uppercase tracking-widest border-b border-white/10">
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Documento</th>
                <th className="p-4 font-medium">Proveedor</th>
                <th className="p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-slate-300 divide-y divide-white/5">
              {purchases.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No hay compras registradas.</td></tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-all">
                    <td className="p-4 font-mono text-sm">{new Date(p.document_date).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-vani-cyan">{p.document_number}</td>
                    <td className="p-4 text-sm">{p.supplier || 'N/A'}</td>
                    <td className="p-4">
                      <button className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10">Ver Ítems</button>
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
