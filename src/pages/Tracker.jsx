import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import BottomNav from "../components/BottomNav";
import WalkMode from "../components/tracker/WalkMode.jsx";
import TrackerHistory from "../components/tracker/TrackerHistory.jsx";
import { ArrowLeft, Footprints, History } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TABS = [
  { id: "walk", label: "Balade", icon: Footprints },
  { id: "history", label: "Historique", icon: History },
];

export default function Tracker() {
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [activeTab, setActiveTab] = useState("walk");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs?.length > 0) {
        setDog(dogs[0]);
        const l = await base44.entities.DailyLog.filter({ dog_id: dogs[0].id }, "-date", 30);
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

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl("Home")} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div>
            <h1 className="text-white font-black text-xl">Mode Balade 🐾</h1>
            <p className="text-white/70 text-xs">Lance le chrono et profite du moment</p>
          </div>
        </div>

        {dog && (
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-lg">🐕</span>
            <div>
              <p className="text-white font-bold text-sm">{dog.name}</p>
              <p className="text-white/60 text-xs">{logs.length} balades ce mois</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-1 sticky top-0 z-20 bg-background pt-3 pb-2">
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
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 mt-3"
      >
        {activeTab === "walk" && <WalkMode dog={dog} user={user} onLogged={() => { refreshLogs(); setActiveTab("history"); }} />}
        {activeTab === "history" && <TrackerHistory logs={logs} dog={dog} />}
      </motion.div>

      <BottomNav currentPage="Tracker" />
    </div>
  );
}