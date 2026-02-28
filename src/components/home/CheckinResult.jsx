import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MOOD_OPTIONS, ENERGY_OPTIONS, APPETITE_OPTIONS } from "./CheckinCard";

export default function CheckinResult({ checkin, dog }) {
  const moodOpt = MOOD_OPTIONS.find(x => x.value === checkin.mood);
  const energyOpt = ENERGY_OPTIONS.find(x => x.value === checkin.energy);
  const appetiteOpt = APPETITE_OPTIONS.find(x => x.value === checkin.appetite);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, type: "spring", stiffness: 80 }}
      className="mx-5 -mt-6 relative z-10 bg-white rounded-3xl shadow-xl border border-border/30 overflow-hidden"
    >
      {/* Success bar */}
      <div className="h-1 bg-gradient-to-r from-primary to-accent" />

      <div className="p-5">
        {/* Check-in badges */}
        <div className="flex items-center gap-2 mb-4">
          {[moodOpt, energyOpt, appetiteOpt].filter(Boolean).map((opt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, type: "spring" }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={{
                background: `${opt.color}12`,
                borderColor: `${opt.color}30`,
              }}
            >
              <opt.icon style={{ color: opt.color, width: 13, height: 13 }} />
              <span className="text-xs font-semibold" style={{ color: opt.color }}>{opt.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Réponse IA */}
        {checkin.ai_response && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-4 border border-primary/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Analyse PawCoach</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{checkin.ai_response}</p>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-3">
          ✅ Check-in du jour enregistré
        </p>
      </div>
    </motion.div>
  );
}