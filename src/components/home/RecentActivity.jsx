import { Footprints, Droplet, PawPrint } from "lucide-react";

export default function RecentActivity() {
  return (
    <div className="mt-8">
      <div className="flex items-end justify-between mb-6">
        <h3 className="text-xl font-bold text-[#1c1c16]">Activités récentes</h3>
        <button className="text-[#00382b] text-sm font-bold">Tout voir</button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Walk Card */}
        <div className="col-span-2 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Footprints className="w-6 h-6" fill="currentColor" />
            </div>
            <span className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">HIER</span>
          </div>
          <h4 className="font-bold text-lg text-[#1c1c16]">Balade en forêt</h4>
          <p className="text-sm text-on-surface-variant mb-4">45 min • 3.2 km</p>
          <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-[#00382b] w-[80%] rounded-full" />
          </div>
        </div>

        {/* Hydration Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
              <Droplet className="w-6 h-6" fill="currentColor" />
            </div>
          </div>
          <h4 className="font-bold text-lg text-[#1c1c16] leading-tight">Hydratation</h4>
          <p className="text-sm text-on-surface-variant mt-1">800ml / 1200ml</p>
          <div className="mt-4 flex gap-1.5">
            <div className="h-1.5 flex-1 bg-[#00382b] rounded-full" />
            <div className="h-1.5 flex-1 bg-[#00382b] rounded-full" />
            <div className="h-1.5 flex-1 bg-surface-container-low rounded-full" />
          </div>
        </div>

        {/* Reminder Card */}
        <div className="bg-[#00382b] text-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10">
            <PawPrint className="w-32 h-32" fill="currentColor" />
          </div>
          <div className="relative z-10">
            <h4 className="font-bold text-lg mb-1 leading-tight">Rappel Soin</h4>
            <p className="text-xs text-white/70 mb-4">Demain à 10:00</p>
            <p className="text-sm font-medium leading-snug">Brossage des dents et griffes</p>
          </div>
        </div>
      </div>
    </div>
  );
}