import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getActiveDog, createPageUrl } from "@/utils";
import BottomNav from "../components/BottomNav";
import ChatFAB from "../components/ChatFAB";
import WalkMode from "../components/tracker/WalkMode.jsx";
import TrackerHistory from "../components/tracker/TrackerHistory.jsx";
import { Footprints, History, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WellnessBanner from "../components/WellnessBanner";

const TABS = [
  { id: "balade",   label: "Balade",    icon: Footprints },
  { id: "historique", label: "Historique", icon: History },
  { id: "dressage", label: "Dressage",  icon: Dumbbell },
];

export default function Activite() {
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("balade");

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs?.length > 0) {
        const d = getActiveDog(dogs);
        setDog(d);
        const l = await base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 30);
        setLogs(l || []);
      }
    }
    load();
  }, []);

  const refreshLogs = async () => {
    if (!dog) return;
    const l = await base44.entities.DailyLog.filter({ dog_id: dog.id }, "-date", 30);
    setLogs(l || []);
  };

  // Dressage tab renders the Training page component directly (no BottomNav wrapper needed)
  if (activeTab === "dressage") {
    return (
      <div className="min-h-screen bg-background">
        {/* Tab switcher — fixed at top so user can go back */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
          <div className="flex gap-1 px-4 py-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* Training page — redirect user there directly */}
        <div className="pt-14 flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
          <p className="text-foreground font-bold text-lg">Dressage</p>
          <p className="text-sm text-muted-foreground">Lance un parcours d'entraînement pour {dog?.name || "ton chien"}</p>
          <a href={createPageUrl("Training")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-lg">
            <Dumbbell className="w-4 h-4" />
            Voir les parcours
          </a>
        </div>
        <ChatFAB />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <WellnessBanner />

      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-4 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
          <h1 className="text-white font-black text-2xl">Activité</h1>
          {dog && (
            <div className="mt-3 bg-white/15 rounded-2xl px-4 py-2.5 flex items-center gap-2 w-fit">
              <span className="text-lg">🐕</span>
              <div>
                <p className="text-white font-bold text-sm">{dog.name}</p>
                <p className="text-white/60 text-xs">{logs.length} balades ce mois</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-2">
        <div className="flex gap-1.5 bg-muted/60 p-1 rounded-2xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all text-[10px] font-bold ${
                activeTab === id
                  ? "bg-white shadow-sm text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="px-4 mt-3"
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
        </motion.div>
      </AnimatePresence>

      <ChatFAB />
      <BottomNav currentPage="Activite" />
    </div>
  );
}