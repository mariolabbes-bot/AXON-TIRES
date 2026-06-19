import React from 'react';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex justify-center font-sans">
      <div className="w-full max-w-md bg-slate-900 min-h-screen relative shadow-2xl flex flex-col">
        <header className="bg-vani-dark border-b border-vani-cyan/20 p-4 sticky top-0 z-50 flex items-center justify-between">
          <div>
            <img src="/logo.png" alt="AXON TIRE Logo" className="h-8 object-contain mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Scanner RFID</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-vani-cyan/20 flex items-center justify-center border border-vani-cyan">
            <span className="text-xs">ON</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
