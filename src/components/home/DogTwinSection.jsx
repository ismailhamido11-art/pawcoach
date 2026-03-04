/**
 * DogTwinSection — Section "Jumeau Digital" intégrée dans l'accueil
 * Avatar SVG + 4 layers accessibles directement dans la Home
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Brain, Clock, MessageCircle } from "lucide-react";
import DogAvatar from "../dogtwin/DogAvatar";
import { useDogAvatarState } from "../dogtwin/useDogAvatarState";
import TwinIA from "../dogtwin/TwinIA";
import TwinMemoire from "../dogtwin/TwinMemoire";
import TwinVoix from "../dogtwin/TwinVoix";

const LAYERS = [
  { id: 0, label: "Corps",    emoji: "🐾" },
  { id: 1, label: "Cerveau",  emoji: "🧠" },
  { id: 2, label: "Mémoire",  emoji: "📖" },
  { id: 3, label: "Voix",     emoji: "💬" },
];

const ZONES = [
  { id: "heart",    label: "Vitalité",  color: "#ff6b8a", score: 87, detail: "Rythme cardiaque stable · Énergie excellente", emoji: "❤️" },
  { id: "food",     label: "Nutrition", color: "#f59e0b", score: 74, detail: "Appétit légèrement réduit depuis 2 jours", emoji: "🍗" },
  { id: "brain",    label: "Mental",    color: "#a78bfa", score: 92, detail: "Très stimulé · Comportement équilibré", emoji: "🧠" },
  { id: "activity", label: "Activité",  color: "#34d399", score: 81, detail: "3 balades cette semaine · Objectif presque atteint", emoji: "🏃" },
];

const scoreColor = s => s >= 85 ? "#34d399" : s >= 65 ? "#f59e0b" : "#ff6b8a";

export default function DogTwinSection({ dog, checkins = [], streak = null, records = [], scans = [] }) {
  const { healthScore, mood } = useDogAvatarState({ checkins, streak, records, scans });
  const [activeLayer, setActiveLayer] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  if (!dog) return null;

  return (
    <div className="px-4">
      <div className="rounded-3xl overflow-hidden" style={{ background: "linear-gradient(165deg, #0a1a14 0%, #0d2218 60%, #112a1f 100%)", border: "1px solid rgba(45,159,130,0.2)", boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)" }}>

        {/* Header section */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-[11px] font-black uppercase tracking-widest">Jumeau Digital</span>
          </div>

          {/* Avatar + infos côte à côte */}
          <div className="flex items-center gap-5">
            <DogAvatar
              healthScore={healthScore}
              mood={mood}
              size="lg"
              streak={streak?.current_streak || 0}
              interactive
            />

            <div className="flex-1">
              <p className="text-white font-black text-xl leading-tight">{dog.name}</p>
              <p className="text-white/40 text-xs mt-0.5">{dog.breed}{dog.weight ? ` · ${dog.weight} kg` : ""}</p>

              {/* Score global */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: scoreColor(healthScore), boxShadow: `0 0 6px ${scoreColor(healthScore)}` }}
                  />
                </div>
                <span className="text-xs font-black" style={{ color: scoreColor(healthScore) }}>{healthScore}/100</span>
              </div>

              {/* État */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: scoreColor(healthScore) }} />
                <span className="text-[11px] font-semibold" style={{ color: scoreColor(healthScore) }}>
                  {healthScore >= 85 ? "En pleine forme" : healthScore >= 65 ? "Bien, à surveiller" : "Attention requise"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Layer tabs */}
        <div className="flex gap-1.5 px-4 pb-3">
          {LAYERS.map(tab => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => { setActiveLayer(tab.id); setExpanded(true); }}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all"
              style={{
                background: activeLayer === tab.id && expanded ? "rgba(45,159,130,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${activeLayer === tab.id && expanded ? "rgba(45,159,130,0.5)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <span className="text-sm">{tab.emoji}</span>
              <span className="text-[9px] font-bold" style={{ color: activeLayer === tab.id && expanded ? "#2d9f82" : "rgba(255,255,255,0.35)" }}>
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Expandable content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden border-t border-white/8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeLayer}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeLayer === 0 && (
                    <div className="px-4 pt-4 pb-5 space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        {ZONES.map((z) => {
                          const active = selectedZone?.id === z.id;
                          return (
                            <motion.button
                              key={z.id}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setSelectedZone(active ? null : z)}
                              className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border transition-all"
                              style={{
                                background: active ? z.color + "22" : "rgba(255,255,255,0.05)",
                                borderColor: active ? z.color + "66" : "rgba(255,255,255,0.08)",
                                boxShadow: active ? `0 0 12px ${z.color}33` : "none",
                              }}
                            >
                              <span className="text-lg">{z.emoji}</span>
                              <span className="text-[9px] text-white/50 font-semibold">{z.label}</span>
                              <span className="text-xs font-black" style={{ color: scoreColor(z.score) }}>{z.score}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                      <AnimatePresence mode="wait">
                        {selectedZone ? (
                          <motion.div
                            key={selectedZone.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-2xl p-4 flex items-center gap-4"
                            style={{ background: selectedZone.color + "18", border: `1px solid ${selectedZone.color}33` }}
                          >
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: selectedZone.color + "25" }}>
                              {selectedZone.emoji}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-bold text-sm">{selectedZone.label}</p>
                              <p className="text-white/55 text-xs mt-0.5">{selectedZone.detail}</p>
                            </div>
                            <p className="text-2xl font-black" style={{ color: scoreColor(selectedZone.score) }}>{selectedZone.score}</p>
                          </motion.div>
                        ) : (
                          <p className="text-center text-white/20 text-xs py-1">Appuie sur une zone</p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {activeLayer === 1 && <TwinIA />}
                  {activeLayer === 2 && <TwinMemoire />}
                  {activeLayer === 3 && <TwinVoix />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle expand */}
        <button
          onClick={() => setExpanded(o => !o)}
          className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-white/8"
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="w-4 h-4 text-white/30" />
          </motion.div>
          <span className="text-[10px] text-white/30 font-semibold">
            {expanded ? "Réduire" : "Explorer le jumeau"}
          </span>
        </button>
      </div>
    </div>
  );
}