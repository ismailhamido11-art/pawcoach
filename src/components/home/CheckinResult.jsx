import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, TrendingUp } from "lucide-react";
import { MOOD_OPTIONS, ENERGY_OPTIONS, APPETITE_OPTIONS } from "./CheckinCard";

const MOOD_EMOJI = { 1: "😔", 2: "😐", 3: "😊", 4: "🤩" };
const ENERGY_EMOJI = { 1: "😴", 2: "🚶", 3: "🏃" };
const APPETITE_EMOJI = { 1: "🙁", 2: "😌", 3: "😋" };

export default function CheckinResult({ checkin, dog }) {
  const moodOpt = MOOD_OPTIONS.find(x => x.value === checkin.mood);
  const energyOpt = ENERGY_OPTIONS.find(x => x.value === checkin.energy);
  const appetiteOpt = APPETITE_OPTIONS.find(x => x.value === checkin.appetite);

  const dominantColor = moodOpt?.color || "#10b981";

  const stats = [
    { label: "Humeur", value: checkin.mood, max: 4, color: moodOpt?.color, emoji: MOOD_EMOJI[checkin.mood], text: moodOpt?.label },
    { label: "Énergie", value: checkin.energy, max: 3, color: energyOpt?.color, emoji: ENERGY_EMOJI[checkin.energy], text: energyOpt?.label },
    { label: "Appétit", value: checkin.appetite, max: 3, color: appetiteOpt?.color, emoji: APPETITE_EMOJI[checkin.appetite], text: appetiteOpt?.label },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
      className="mx-4 -mt-8 relative z-10 rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Top gradient band */}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${dominantColor}, ${dominantColor}88)` }} />

      {/* Dark premium card */}
      <div style={{ background: "linear-gradient(160deg, #0f2027, #1a3a4a, #0d2f2a)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${dominantColor}30` }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: dominantColor }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Check-in validé</p>
              <p className="text-white/40 text-[10px]">Aujourd'hui · {dog?.name || "votre chien"}</p>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl"
          >
            {MOOD_EMOJI[checkin.mood]}
          </motion.div>
        </div>

        {/* Stat bars */}
        <div className="px-5 space-y-3 pb-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/50 text-[11px] font-medium">{s.label}</span>
                <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.emoji} {s.text}</span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.value / s.max) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Response */}
        {checkin.ai_response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mx-4 mb-5 rounded-2xl p-4 border"
            style={{
              background: `${dominantColor}12`,
              borderColor: `${dominantColor}25`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3" style={{ color: dominantColor }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dominantColor }}>
                Analyse PawCoach IA
              </span>
            </div>
            <p className="text-white/80 text-[13px] leading-relaxed">{checkin.ai_response}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}