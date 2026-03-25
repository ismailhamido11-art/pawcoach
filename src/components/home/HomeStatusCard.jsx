import { Check, TrendingUp, Heart, Activity } from "lucide-react";

export default function HomeStatusCard({ dog, todayCheckin }) {
  const score = todayCheckin ? 95 : 75;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
      {/* Dynamic Wellness Radar (Hero Card) */}
      <div className="md:col-span-8 bg-gradient-to-br from-forest-green via-deep-forest to-black rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden text-white shadow-2xl">
        {/* Decorative depth patterns */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-premium-purple/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>
        
        <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="premium-shimmer px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm">Premium AI</span>
              </div>
              <h3 className="text-sm font-medium text-emerald-200/60 tracking-widest uppercase">Score de Santé Global</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-8xl font-extrabold tracking-tighter">{score}</span>
                <span className="text-3xl font-bold text-emerald-400">%</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-emerald-50/80">Nutrition 100% équilibrée</p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-emerald-50/80">Activité {todayCheckin ? "+15%" : "stable"} vs semaine dernière</p>
              </div>
            </div>
            
            <button className="w-full bg-white text-forest-green font-extrabold py-4 rounded-2xl hover:scale-[1.02] transition-transform active:scale-95 shadow-xl">
              Analyse Détaillée
            </button>
          </div>
          
          <div className="relative aspect-square flex items-center justify-center radar-glow mx-auto w-full max-w-[240px] md:max-w-none">
            {/* Multi-layered Radar SVG */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              <circle cx="50" cy="50" fill="none" r="35" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              <circle cx="50" cy="50" fill="none" r="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              
              <defs>
                <linearGradient id="poly-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#8BF6D5", stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: "#006b55", stopOpacity: 0.3 }} />
                </linearGradient>
              </defs>
              
              <polygon 
                className="animate-pulse" 
                fill="url(#poly-grad)" 
                points={todayCheckin ? "50,15 80,35 75,75 50,85 25,75 20,35" : "50,25 70,35 65,65 50,75 35,65 30,35"} 
                stroke="#8BF6D5" 
                strokeLinejoin="round" 
                strokeWidth="2.5" 
              />
              
              {todayCheckin ? (
                <>
                  <circle className="shadow-lg" cx="50" cy="15" fill="#8BF6D5" r="2.5" />
                  <circle cx="80" cy="35" fill="#8BF6D5" r="2.5" />
                  <circle cx="75" cy="75" fill="#8BF6D5" r="2.5" />
                  <circle cx="50" cy="85" fill="#8BF6D5" r="2.5" />
                  <circle cx="25" cy="75" fill="#8BF6D5" r="2.5" />
                  <circle cx="20" cy="35" fill="#8BF6D5" r="2.5" />
                </>
              ) : (
                <>
                  <circle cx="50" cy="25" fill="#8BF6D5" r="2.5" />
                  <circle cx="70" cy="35" fill="#8BF6D5" r="2.5" />
                  <circle cx="65" cy="65" fill="#8BF6D5" r="2.5" />
                  <circle cx="50" cy="75" fill="#8BF6D5" r="2.5" />
                  <circle cx="35" cy="65" fill="#8BF6D5" r="2.5" />
                  <circle cx="30" cy="35" fill="#8BF6D5" r="2.5" />
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-90">
              <Heart className="w-8 h-8 text-emerald-400 mb-1" fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80">Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vital Signals Card */}
      <div className="md:col-span-4 glass-card rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="flex justify-between items-start relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-forest-green/5 flex items-center justify-center text-forest-green">
            <Activity className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black text-red-600 uppercase">En Direct</span>
          </div>
        </div>
        
        <div className="mt-8 relative z-10">
          <p className="text-on-surface-variant font-bold text-sm tracking-tight mb-1">Rythme Cardiaque</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-6xl font-extrabold text-forest-green">72</h4>
            <span className="text-xl font-bold text-on-surface-variant">BPM</span>
          </div>
        </div>
        
        <div className="mt-10 flex items-end gap-1.5 h-20 relative z-10">
          <div className="flex-1 bg-forest-green/10 rounded-full h-[40%]" />
          <div className="flex-1 bg-forest-green/10 rounded-full h-[60%]" />
          <div className="flex-1 bg-forest-green/10 rounded-full h-[45%]" />
          <div className="flex-1 bg-forest-green/30 rounded-full h-[80%]" />
          <div className="flex-1 bg-forest-green/60 rounded-full h-[95%]" />
          <div className="flex-1 bg-forest-green/20 rounded-full h-[55%]" />
          <div className="flex-1 bg-forest-green/40 rounded-full h-[75%]" />
          <div className="flex-1 bg-forest-green rounded-full h-[100%] shadow-lg" />
        </div>
      </div>
    </div>
  );
}