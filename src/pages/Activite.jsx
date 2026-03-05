import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getActiveDog, createPageUrl } from "@/utils";
import BottomNav from "@/components/BottomNav";
import ChatFAB from "@/components/ChatFAB";
import WellnessBanner from "@/components/WellnessBanner";
import Illustration from "@/components/illustrations/Illustration";
import WalkMode from "@/components/tracker/WalkMode";
import PullToRefresh from "@/components/PullToRefresh";
import TrackerHistory from "@/components/tracker/TrackerHistory";
import AITrainingProgram from "@/components/activite/AITrainingProgram";
import { checkWalkBadges } from "@/components/achievements/badgeUtils";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, History, Dumbbell, Sparkles, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const TABS = [
  { id: "balade",     label: "Balade",     emoji: "🐾", icon: Footprints, bg: "from-emerald-500 to-teal-600" },
  { id: "historique", label: "Historique", emoji: "📊", icon: History,    bg: "from-blue-500 to-indigo-600" },
  { id: "programme",  label: "Programme",  emoji: "✨", icon: Sparkles,   bg: "from-violet-500 to-purple-600" },
  { id: "dressage",   label: "Dressage",   emoji: "🎯", icon: Dumbbell,   bg: "from-orange-500 to-amber-600" },
];

export default function Activite() {
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("balade");

  useEffect(() => {
    async function load() {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (dogs?.length > 0) {
          const d = getActiveDog(dogs);
          setDog(d);
          const l = await base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 30);
          setLogs(l || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && TABS.find(tab => tab.id === t)) setActiveTab(t);
  }, []);

  const refreshLogs = async () => {
    if (!dog || !user) return;
    const l = await base44.entities.DailyLog.filter({ dog_id: dog.id }, "-date", 30);
    setLogs(l || []);
    // Check walk badges after refresh
    checkWalkBadges(dog.id, user.email, l || []);
  };

  const totalWalkMinutes = logs.reduce((acc, l) => acc + (l.walk_minutes || 0), 0);
  const walkDays = logs.filter(l => l.walk_minutes > 0).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WellnessBanner />

      {/* Hero */}
      <div className="gradient-primary px-5 pt-12 pb-3 relative overflow-hidden mt-8">
        <div className="relative z-10 flex items-end gap-3 mb-3">
          <div className="flex-1 pb-1">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
            <h1 className="text-white font-black text-2xl">Activité</h1>
            {dog && <p className="text-white/70 text-xs mt-0.5">Suivi des balades de {dog.name}</p>}

            {/* Quick stats */}
            {!loading && logs.length > 0 && (
              <div className="flex gap-2 mt-2">
                <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-white font-black text-base leading-none">{walkDays}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">Sorties</p>
                </div>
                <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-white font-black text-base leading-none">{Math.round(totalWalkMinutes / 60)}h</p>
                  <p className="text-white/70 text-[10px] mt-0.5">Total</p>
                </div>
                <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-white font-black text-base leading-none">{walkDays > 0 ? Math.round(totalWalkMinutes / walkDays) : 0}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">Moy. min</p>
                </div>
              </div>
            )}
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 flex-shrink-0"
          >
            <Illustration name="dogWalking" alt="Activité" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>

        {/* Tabs — pill cards */}
        <div className="grid grid-cols-4 gap-1.5 mt-1">
          {TABS.map(({ id, label, emoji, bg }) => {
            const active = activeTab === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.93 }}
                transition={spring}
                onClick={() => setActiveTab(id)}
                className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl text-center overflow-hidden transition-all ${
                  active ? "shadow-lg" : "bg-white/10"
                }`}
              >
                {active && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-100`} />
                )}
                <span className="relative text-xl leading-none">{emoji}</span>
                <span className={`relative text-[10px] font-bold leading-tight ${active ? "text-white" : "text-white/75"}`}>{label}</span>
                {active && (
                  <motion.div
                    layoutId="activiteTabIndicator"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-white/60"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="px-4 pt-4"
          >
            {activeTab === "balade" && (
              <WalkMode
                dog={dog}
                user={user}
                onLogged={() => { refreshLogs(); setActiveTab("historique"); }}
              />
            )}
            {activeTab === "historique" && (
              <TrackerHistory logs={logs} dog={dog} />
            )}
            {activeTab === "programme" && (
              <AITrainingProgram dog={dog} logs={logs} />
            )}
            {activeTab === "dressage" && (
              <DressageContent dog={dog} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ChatFAB />
      <BottomNav currentPage="Activite" />
    </div>
  );
}

function DressageContent({ dog }) {
  return (
    <div className="space-y-4 pb-4">
      {/* Hero card */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-7 h-7 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground text-sm leading-tight">Parcours de dressage</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Entraîne {dog?.name || "ton chien"} avec des exercices adaptés à son niveau et sa race.
          </p>
        </div>
      </div>

      {/* Illustration */}
      <div className="flex justify-center">
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-36 h-36"
        >
          <Illustration name="dogHighFive" alt="Dressage" className="w-full h-full drop-shadow-lg" />
        </motion.div>
      </div>

      {/* CTA */}
      <Link
        to={createPageUrl("Training")}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl gradient-primary text-white font-bold text-sm shadow-lg"
      >
        <Dumbbell className="w-4 h-4" />
        Voir les parcours d'entraînement
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </Link>

      {/* Tips */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="font-bold text-sm text-foreground">💡 Conseils rapides</p>
        {[
          { emoji: "⏱️", text: "Sessions courtes (5-10 min) et régulières" },
          { emoji: "🎯", text: "Terminer sur une réussite pour motiver" },
          { emoji: "🍖", text: "Récompenses petites mais fréquentes" },
          { emoji: "📅", text: "Pratiquer à la même heure chaque jour" },
        ].map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-3">
            <span className="text-lg">{emoji}</span>
            <p className="text-xs text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}