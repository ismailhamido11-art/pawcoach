import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import IconBadge from "@/components/ui/IconBadge";
import {
  Frown, Meh, Smile, Laugh,
  BatteryLow, BatteryMedium, BatteryFull,
  Ban, Utensils, UtensilsCrossed,
} from "lucide-react";

const MOOD_OPTIONS = [
  { value: 1, icon: Frown, color: "#ef4444", label: "Triste" },
  { value: 2, icon: Meh, color: "#f59e0b", label: "Bof" },
  { value: 3, icon: Smile, color: "#10b981", label: "Bien" },
  { value: 4, icon: Laugh, color: "#ec4899", label: "Super !" },
];
const ENERGY_OPTIONS = [
  { value: 1, icon: BatteryLow, color: "#ef4444", label: "Faible" },
  { value: 2, icon: BatteryMedium, color: "#f59e0b", label: "Moyen" },
  { value: 3, icon: BatteryFull, color: "#10b981", label: "A fond" },
];
const APPETITE_OPTIONS = [
  { value: 1, icon: Ban, color: "#ef4444", label: "Rien" },
  { value: 2, icon: Utensils, color: "#10b981", label: "Normal" },
  { value: 3, icon: UtensilsCrossed, color: "#f59e0b", label: "Glouton" },
];

export { MOOD_OPTIONS, ENERGY_OPTIONS, APPETITE_OPTIONS };

function OptionRow({ options, selected, onSelect, label }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
      <div className="flex gap-2.5">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelect(opt.value)}
              className={`flex-1 flex flex-col items-center gap-2 py-3.5 rounded-2xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-transparent shadow-lg scale-105"
                  : "border-border/50 bg-white/60 hover:border-border hover:bg-white"
              }`}
              style={isSelected ? {
                background: `linear-gradient(135deg, ${opt.color}18, ${opt.color}08)`,
                borderColor: opt.color + "60",
                boxShadow: `0 4px 20px ${opt.color}22`,
              } : {}}
            >
              <motion.div
                animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <opt.icon
                  style={{ color: isSelected ? opt.color : "#9ca3af", width: 26, height: 26 }}
                  strokeWidth={isSelected ? 2.5 : 1.75}
                />
              </motion.div>
              <span className={`text-[11px] font-semibold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                {opt.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default function CheckinCard({ dog, mood, setMood, energy, setEnergy, appetite, setAppetite, onSubmit, submitting }) {
  const canSubmit = mood && energy && appetite && !submitting;
  const progress = [mood, energy, appetite].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, type: "spring", stiffness: 80 }}
      className="mx-5 -mt-6 relative z-10 bg-white rounded-3xl shadow-xl border border-border/30 overflow-hidden"
    >
      {/* Progress bar top */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          animate={{ width: `${(progress / 3) * 100}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>

      <div className="p-5 pt-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-foreground">Check-in du jour</h2>
            <p className="text-xs text-muted-foreground">Comment se sent {dog?.name} ?</p>
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {progress}/3
          </div>
        </div>

        <OptionRow options={MOOD_OPTIONS} selected={mood} onSelect={setMood} label="Humeur" />
        <OptionRow options={ENERGY_OPTIONS} selected={energy} onSelect={setEnergy} label="Énergie" />
        <OptionRow options={APPETITE_OPTIONS} selected={appetite} onSelect={setAppetite} label="Appétit" />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
            canSubmit
              ? "text-white shadow-lg shadow-primary/30"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
          style={canSubmit ? {
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gradient-end)))",
          } : {}}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyse IA en cours...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              ✨ Valider le check-in
            </span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}