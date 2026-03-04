import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getActiveDog, createPageUrl } from "@/utils";
import BottomNav from "../components/BottomNav";
import ChatFAB from "../components/ChatFAB";
import WellnessBanner from "../components/WellnessBanner";
import Illustration from "../components/illustrations/Illustration";
import { motion, AnimatePresence } from "framer-motion";
import { isUserPremium } from "@/utils/premium";

// Sub-pages content (imported inline)
import NotebookContent from "@/components/sante/NotebookContent";
import HealthImportContent from "@/components/sante/HealthImportContent";
import FindVetContent from "@/components/sante/FindVetContent";
import DiagnosisContent from "@/components/sante/DiagnosisContent";

import { BookHeart, Camera, Stethoscope, MapPin, AlertTriangle } from "lucide-react";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const TABS = [
  { id: "carnet",    label: "Carnet",    icon: BookHeart,    color: "#2d9f82" },
  { id: "malade",    label: "Malade ?",  icon: AlertTriangle, color: "#ef4444" },
  { id: "import",    label: "Import IA", icon: Camera,       color: "#8b5cf6" },
  { id: "findvet",   label: "Vétérinaire", icon: MapPin,     color: "#3b82f6" },
];

export default function Sante() {
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("carnet");

  useEffect(() => {
    async function load() {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (dogs.length > 0) {
          const d = getActiveDog(dogs);
          setDog(d);
          const recs = await base44.entities.HealthRecord.filter({ dog_id: d.id });
          setRecords(recs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Support deep-link ?tab=xxx
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && TABS.find(tab => tab.id === t)) setActiveTab(t);
  }, []);

  const vaccineCount = records.filter(r => r.type === "vaccine").length;
  const vetCount = records.filter(r => r.type === "vet_visit").length;
  const weightRecords = records.filter(r => r.type === "weight");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WellnessBanner />

      {/* Hero */}
      <div className="gradient-primary px-5 pt-12 pb-3 relative overflow-hidden mt-8">
        <div className="relative z-10 flex items-end gap-3 mb-3">
          <div className="flex-1 pb-1">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
            <h1 className="text-white font-black text-2xl">Santé</h1>
            {dog && <p className="text-white/70 text-xs mt-0.5">Suivi complet de {dog.name}</p>}

            {/* Quick stats */}
            {!loading && records.length > 0 && (
              <div className="flex gap-2 mt-2">
                <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-white font-black text-base leading-none">{vaccineCount}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">Vaccins</p>
                </div>
                <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-white font-black text-base leading-none">{vetCount}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">Visites</p>
                </div>
                <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-white font-black text-base leading-none">{weightRecords.length}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">Pesées</p>
                </div>
              </div>
            )}
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 flex-shrink-0"
          >
            <Illustration name="goodDoggy" alt="Santé" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.96 }}
              transition={spring}
              onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === id ? "bg-white text-primary" : "bg-white/10 text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </motion.button>
          ))}
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
          >
            {activeTab === "carnet" && (
              <NotebookContent
                dog={dog}
                user={user}
                records={records}
                setRecords={setRecords}
                isPremium={isUserPremium(user)}
                loading={loading}
              />
            )}
            {activeTab === "malade" && (
              <DiagnosisContent dog={dog} />
            )}
            {activeTab === "import" && (
              <HealthImportContent dog={dog} onImported={(newRecs) => setRecords(prev => [...prev, ...newRecs])} />
            )}
            {activeTab === "findvet" && (
              <FindVetContent dog={dog} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ChatFAB />
      <BottomNav currentPage="Sante" />
    </div>
  );
}