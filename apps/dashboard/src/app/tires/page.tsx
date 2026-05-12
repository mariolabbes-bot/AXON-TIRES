import Link from "next/link";

export default function TiresModulePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Módulo de Neumáticos e Inventario</h1>
        <div className="space-x-3">
          <button className="px-4 py-2 bg-axon-panel border border-axon-border text-white rounded hover:bg-slate-700 transition">
            + Ingresar Compra
          </button>
          <button className="px-4 py-2 bg-axon-accent text-axon-bg font-medium rounded hover:bg-yellow-400 transition">
            Asignar RFID (Escanear)
          </button>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-axon-panel border border-axon-border p-4 rounded-lg flex flex-wrap gap-4 items-end">
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-axon-muted uppercase">Estado</label>
          <select className="bg-axon-bg border border-axon-border text-white p-2 rounded min-w-[150px]">
            <option>Todos</option>
            <option>Bodega (Nuevos/Listos)</option>
            <option>En Operación</option>
            <option>Planta Recauchaje</option>
            <option>Reparación</option>
            <option>Desecho</option>
          </select>
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-axon-muted uppercase">Medida</label>
          <select className="bg-axon-bg border border-axon-border text-white p-2 rounded min-w-[150px]">
            <option>Todas</option>
            <option>295/80R22.5</option>
            <option>12R22.5</option>
          </select>
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-axon-muted uppercase">Buscar Marca Fuego</label>
          <input type="text" placeholder="Ej. AX-..." className="bg-axon-bg border border-axon-border text-white p-2 rounded min-w-[200px]" />
        </div>
        <button className="px-4 py-2 bg-axon-border text-white rounded hover:bg-slate-600 transition">
          Filtrar
        </button>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-axon-panel border border-axon-border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-axon-bg/50 text-axon-muted text-sm border-b border-axon-border">
              <th className="p-4 font-medium">Marca Fuego</th>
              <th className="p-4 font-medium">RFID</th>
              <th className="p-4 font-medium">Medida / Marca</th>
              <th className="p-4 font-medium">Estado</th>
              <th className="p-4 font-medium">KM Acum.</th>
              <th className="p-4 font-medium">Acciones (Workflows)</th>
            </tr>
          </thead>
          <tbody className="text-white divide-y divide-axon-border">
            {/* Fila Ejemplo 1 (Bodega) */}
            <tr className="hover:bg-axon-border/30 transition">
              <td className="p-4 font-bold text-axon-accent">AX-9012</td>
              <td className="p-4 text-sm text-axon-muted">E200...4B</td>
              <td className="p-4">
                <div>295/80R22.5</div>
                <div className="text-xs text-axon-muted">Michelin X Multi Z</div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded border border-green-800">Bodega</span>
              </td>
              <td className="p-4">0 KM</td>
              <td className="p-4">
                <select className="bg-axon-bg border border-axon-border text-sm text-white p-1 rounded">
                  <option>Acción rápida...</option>
                  <option>Instalar en Vehículo</option>
                  <option>Enviar a Reparación</option>
                </select>
              </td>
            </tr>

            {/* Fila Ejemplo 2 (Recauchaje) */}
            <tr className="hover:bg-axon-border/30 transition">
              <td className="p-4 font-bold text-axon-accent">AX-1024</td>
              <td className="p-4 text-sm text-axon-muted">E200...8C</td>
              <td className="p-4">
                <div>12R22.5</div>
                <div className="text-xs text-axon-muted">Bridgestone M840</div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded border border-yellow-800">Recauchaje</span>
              </td>
              <td className="p-4">120,450 KM</td>
              <td className="p-4">
                <select className="bg-axon-bg border border-axon-border text-sm text-white p-1 rounded">
                  <option>Acción rápida...</option>
                  <option>Recibir de Planta</option>
                  <option>Dar de Baja (Desecho)</option>
                </select>
              </td>
            </tr>

            {/* Fila Ejemplo 3 (Operativo) */}
            <tr className="hover:bg-axon-border/30 transition">
              <td className="p-4 font-bold text-axon-accent">AX-3341</td>
              <td className="p-4 text-sm text-axon-muted">E200...1A</td>
              <td className="p-4">
                <div>295/80R22.5</div>
                <div className="text-xs text-axon-muted">Michelin XDE 2+</div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs rounded border border-blue-800">Operativo</span>
                <div className="text-xs text-axon-muted mt-1">En Vehículo: AB-CD-12</div>
              </td>
              <td className="p-4">45,100 KM</td>
              <td className="p-4">
                <select className="bg-axon-bg border border-axon-border text-sm text-white p-1 rounded">
                  <option>Acción rápida...</option>
                  <option>Retirar (Hot-Swap)</option>
                  <option>Rotar Posición</option>
                  <option>Ver Gemelo Digital</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
