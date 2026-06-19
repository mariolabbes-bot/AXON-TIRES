import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AXON TIRE | Neural Dashboard",
  description: "Control de Neumáticos y Telemetría por Vani Digital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="flex h-screen overflow-hidden bg-vani-bg-dark bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        
        {/* SIDEBAR (Glassmorphism) */}
        <aside className="w-64 glass-panel flex flex-col z-20 m-4 rounded-2xl overflow-hidden shadow-2xl">
          <div className="h-20 flex items-center justify-center border-b border-white/5 bg-white/5">
            <img src="/logo.png" alt="AXON TIRE Logo" className="h-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
          </div>
          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            <Link href="/" className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 glow-border transition-all duration-300">
              <span className="flex items-center space-x-3">
                <span>⎈</span> <span>Tablero Principal</span>
              </span>
            </Link>
            <div className="pt-4 pb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-4">Operación</span>
            </div>
            <Link href="/vehicles" className="block px-4 py-3 rounded-lg text-vani-cyan bg-vani-cyan/5 border border-vani-cyan/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:bg-vani-cyan/10 transition-all duration-300">
              <span className="flex items-center space-x-3">
                <span>⛟</span> <span className="font-bold tracking-wide">Flota y Vehículos</span>
              </span>
            </Link>
            <Link href="/tires" className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 glow-border transition-all duration-300">
              <span className="flex items-center space-x-3">
                <span>◎</span> <span>Neumáticos (TPMS)</span>
              </span>
            </Link>
            <Link href="/assets" className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 glow-border transition-all duration-300">
              <span className="flex items-center space-x-3">
                <span>◱</span> <span>Activos Generales</span>
              </span>
            </Link>
            <div className="pt-4 pb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-4">Administración</span>
            </div>
            <Link href="/branches" className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 glow-border transition-all duration-300">
              <span className="flex items-center space-x-3">
                <span>⌂</span> <span>Bodegas / Bases</span>
              </span>
            </Link>
            <Link href="/purchases" className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 glow-border transition-all duration-300">
              <span className="flex items-center space-x-3">
                <span>⇲</span> <span>Ingresos de Compra</span>
              </span>
            </Link>
            
            <div className="pt-4 pb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-4">Terminales</span>
            </div>
            <Link href="/mobile" target="_blank" className="block px-4 py-3 rounded-lg text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.1)] transition-all duration-300">
              <span className="flex items-center space-x-3">
                <span>📱</span> <span>App Móvil (Simulador)</span>
              </span>
            </Link>
          </nav>
          <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
            <div className="text-xs text-center text-slate-500 uppercase tracking-widest">
              Vani Digital OS
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Header Superior Flotante */}
          <header className="h-20 m-4 mb-0 glass-panel rounded-2xl flex items-center px-8 justify-between z-10">
            <h2 className="text-xl font-light tracking-wide text-slate-200">Terminal de <strong className="font-bold text-white">Operaciones</strong></h2>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-black/30 px-3 py-1.5 rounded-full border border-vani-cyan/30">
                <div className="w-2 h-2 rounded-full bg-vani-cyan animate-pulse"></div>
                <span className="text-xs text-vani-cyan font-mono tracking-wider">SYSTEM ONLINE</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-vani-accent to-orange-500 p-[2px] cursor-pointer hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] transition-shadow">
                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4 pt-6 pb-8 custom-scrollbar">
            {children}
          </div>
        </main>

      </body>
    </html>
  );
}
