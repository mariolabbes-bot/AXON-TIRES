'use client';
import Link from 'next/link';

export default function MovementsMainMenu() {
  const activities = [
    {
      title: "Asignación de Neumáticos",
      description: "Montaje de neumáticos a posiciones del chasis con reemplazo automático",
      path: "/mobile/movements/tire-assign",
      icon: "⚙️",
      color: "from-blue-500 to-cyan-400"
    },
    {
      title: "Asignación de Activos",
      description: "Montaje de extintores, pérticas y equipamiento de seguridad",
      path: "/mobile/movements/asset-assign",
      icon: "🧯",
      color: "from-purple-500 to-indigo-400"
    },
    {
      title: "Recauchajes y Reparaciones",
      description: "Control de envíos a plantas externas, recepción basada en guías y pendientes",
      path: "/mobile/movements/retread",
      icon: "♻️",
      color: "from-amber-500 to-orange-400"
    },
    {
      title: "Disposición Final (Desecho)",
      description: "Baja masiva de bodega definitiva mediante lectura RFID",
      path: "/mobile/movements/dispose",
      icon: "🗑️",
      color: "from-red-500 to-rose-400"
    }
  ];

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-2">
        <Link href="/mobile" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
          ←
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Menú de Movimientos</h2>
          <p className="text-xs text-slate-400">Terminal industrial RFID activa</p>
        </div>
      </div>

      <div className="grid gap-4">
        {activities.map((act, idx) => (
          <Link href={act.path} key={idx} className="block">
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 hover:bg-slate-800 transition-colors relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${act.color}`}></div>
              <div className="flex items-center space-x-4">
                <div className="text-3xl bg-slate-900 w-14 h-14 rounded-xl flex items-center justify-center shadow-inner">
                  {act.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-vani-cyan transition-colors">{act.title}</h3>
                  <p className="text-xs text-slate-400 leading-normal">{act.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
