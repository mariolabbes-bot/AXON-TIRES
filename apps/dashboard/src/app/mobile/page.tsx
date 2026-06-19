'use client';
import Link from 'next/link';

export default function MobileMenu() {
  const menuItems = [
    {
      title: "Control de Vehículo",
      description: "Check-in y Check-out con cuadraturas automáticas",
      path: "/mobile/checkpoint",
      icon: "🚚",
      color: "from-blue-500 to-vani-cyan"
    },
    {
      title: "Movimientos Masivos",
      description: "Baja o Recauchaje por lotes con lector RFID",
      path: "/mobile/bulk",
      icon: "📦",
      color: "from-orange-500 to-yellow-500"
    },
    {
      title: "Auditoría de Inventario",
      description: "Cruce de existencias físicas vs sistema en Bodega",
      path: "/mobile/inventory",
      icon: "📋",
      color: "from-green-500 to-emerald-400"
    }
  ];

  return (
    <div className="flex flex-col space-y-6 mt-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">Seleccione Operación</h2>
        <p className="text-sm text-slate-400">Terminal industrial RFID activa</p>
      </div>

      <div className="grid gap-4">
        {menuItems.map((item, idx) => (
          <Link href={item.path} key={idx} className="block">
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 hover:bg-slate-800 transition-colors relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.color}`}></div>
              <div className="flex items-center space-x-4">
                <div className="text-4xl bg-slate-900 w-16 h-16 rounded-xl flex items-center justify-center shadow-inner">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-vani-cyan transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-tight">{item.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
