import { Sparkles } from "lucide-react";

export default function BriefingCard({ dog, todayCheckin }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-1 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden border border-emerald-50 my-6">
      <div className="flex flex-col md:flex-row items-center gap-6 p-8 md:p-10">
        <div className="relative shrink-0">
          <div className="w-20 h-20 organic-mask bg-premium-purple flex items-center justify-center text-white shadow-2xl relative z-10">
            <Sparkles className="w-8 h-8" fill="currentColor" />
          </div>
          <div className="absolute inset-0 bg-premium-purple/20 blur-2xl rounded-full scale-110"></div>
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h4 className="font-extrabold text-forest-green text-2xl tracking-tight">Conseil IA personnalisé</h4>
            <span className="premium-shimmer px-3 py-1 rounded-lg text-[9px] font-black uppercase text-white tracking-widest shadow-lg">Premium Expert</span>
          </div>
          
          <p className="text-on-surface-variant text-base leading-relaxed font-medium">
            {todayCheckin
              ? `"${dog?.name || "Ton chien"} est en pleine forme aujourd'hui ! Continue sur cette belle dynamique, l'activité est parfaite."`
              : `"${dog?.name || "Ton chien"} n'a pas encore fait son check-in. Prends un instant pour noter son niveau d'énergie."`}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
            {!todayCheckin && (
              <button className="bg-forest-green text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg hover:shadow-forest-green/20 transition-all active:scale-95">
                Faire le check-in
              </button>
            )}
            <button className="text-forest-green/60 text-xs font-black uppercase tracking-widest hover:text-forest-green transition-colors px-4 py-4 active:scale-95">
              Explorer les données
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}