import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getActiveDog } from "@/utils";
import BottomNav from "../components/BottomNav";
import WellnessBanner from "../components/WellnessBanner";
import HealthAssistantBar from "@/components/sante/HealthAssistantBar";
import HealthAssistantSheet from "@/components/sante/HealthAssistantSheet";
import { updateStreakSilently } from "@/components/streakHelper";
import Illustration from "../components/illustrations/Illustration";
import { motion, AnimatePresence } from "framer-motion";
import { isUserPremium } from "@/utils/premium";
import { toast } from "sonner";

// Sub-pages content (imported inline)
import NotebookContent from "@/components/sante/NotebookContent";
import HealthImportContent from "@/components/sante/HealthImportContent";
import FindVetContent from "@/components/sante/FindVetContent";
import DiagnosisContent from "@/components/sante/DiagnosisContent";
import GrowthTrackerContent from "@/components/sante/GrowthTrackerContent";

import { BookHeart, Camera, MapPin, AlertTriangle, TrendingUp } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import DownloadHealthPDF from "@/components/vet/DownloadHealthPDF";
import { spring } from "@/lib/animations";
const tabVariants = {
  enter: (d) => ({ opacity: 0, x: d * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d * -60 }),
};

const TABS = [
  { id: "carnet",  label: "Carnet",    emoji: "📋", icon: BookHeart,    color: "#2d9f82", bg: "from-emerald-500 to-emerald-700" },
  { id: "malade",  label: "Pré-consult.", emoji: "🩺", icon: AlertTriangle, color: "#2d9f82", bg: "from-emerald-500 to-emerald-700" },
  { id: "growth",  label: "Croissance", emoji: "📈", icon: TrendingUp,   color: "#f59e0b", bg: "from-amber-500 to-amber-600" },
  { id: "import",  label: "Importer",  emoji: "📷", icon: Camera,       color: "#8b5cf6", bg: "from-violet-500 to-purple-600" },
  { id: "findvet", label: "Véto",      emoji: "📍", icon: MapPin,       color: "#3b82f6", bg: "from-blue-500 to-indigo-600" },
];

export default function Sante() {
   const _navigate = useNavigate();
   const [dog, setDog] = useState(null);
   const [user, setUser] = useState(null);
   const [records, setRecords] = useState([]);
   const [dailyLogs, setDailyLogs] = useState([]);
   const [growthEntries, setGrowthEntries] = useState([]);
   const [loading, setLoading] = useState(true);
   const [isAssistantOpen, setIsAssistantOpen] = useState(false);

   // URL-based tab navigation (enables back button between sub-tabs)
   const [searchParams, setSearchParams] = useSearchParams();
   const urlTab = searchParams.get("tab");

   // Deep link sub-tabs (within Carnet): ?tab=vaccine, ?tab=weight, etc.
   const validSubTabs = ["all", "vaccine", "vet_visit", "weight", "medication", "note"];
   const isDeepLink = urlTab && (validSubTabs.includes(urlTab) || urlTab === "vet" || urlTab === "qr");

   // Priority: deep link > URL param > sessionStorage > default
   const activeTab = isDeepLink ? "carnet"
     : (urlTab && TABS.some(t => t.id === urlTab)) ? urlTab
     : (() => { const s = sessionStorage.getItem("tab_Sante"); return (s && TABS.some(t => t.id === s)) ? s : "carnet"; })();

   // On mount without URL param, sync URL with preserved tab (replace, not push)
   const initRef = useRef(false);
   useEffect(() => {
     if (!initRef.current) { initRef.current = true; if (!isDeepLink && !urlTab && activeTab !== "carnet") setSearchParams({ tab: activeTab }, { replace: true }); }
   }, []);
   useEffect(() => { sessionStorage.setItem("tab_Sante", activeTab); }, [activeTab]);
   const changeTab = (tabId) => { sessionStorage.setItem("tab_Sante", tabId); setSearchParams({ tab: tabId }); };

   // Track direction for native-like horizontal slide
   const tabIndex = TABS.findIndex(t => t.id === activeTab);
   const prevTabIdx = useRef(tabIndex);
   const tabDir = tabIndex >= prevTabIdx.current ? 1 : -1;
   useEffect(() => { prevTabIdx.current = tabIndex; }, [tabIndex]);

   const [initialSubTab] = useState(isDeepLink && validSubTabs.includes(urlTab) ? urlTab : null);
   const vaccineKeyParam = searchParams.get("vaccineKey") || null;
   const [showShareModal, setShowShareModal] = useState(urlTab === "vet");

   // Keep showShareModal in sync when urlTab changes (e.g. navigating to/from ?tab=vet)
   useEffect(() => { setShowShareModal(urlTab === "vet"); }, [urlTab]);

   const loadData = async () => {
     try {
       const u = await base44.auth.me();
       setUser(u);
       const dogs = await base44.entities.Dog.filter({ owner: u.email });
       if (dogs?.length > 0) {
         const d = getActiveDog(dogs);
         setDog(d);
         const [recs, logs, growths] = await Promise.all([
           base44.entities.HealthRecord.filter({ dog_id: d.id }),
           base44.entities.DailyLog.filter({ dog_id: d.id }),
           base44.entities.GrowthEntry.filter({ dog_id: d.id }),
         ]);
         setRecords(recs || []);
         setDailyLogs(logs || []);
         setGrowthEntries(growths || []);
       }
     } catch (e) {
       console.error(e);
       toast.error("Impossible de charger les données de santé. Vérifie ta connexion.");
     } finally {
       setLoading(false);
     }
   };

   useEffect(() => { loadData(); }, []);

   const handleAddFromSheet = async (record) => {
     setRecords(prev => [...prev, record]);
     if (navigator.vibrate) navigator.vibrate(30);
     if (dog && user) await updateStreakSilently(dog.id, user.email);
   };

  const vaccineCount = records.filter(r => r.type === "vaccine").length;
  const vetCount = records.filter(r => r.type === "vet_visit").length;
  const weightRecords = records.filter(r => r.type === "weight");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <WellnessBanner />
        <div className="gradient-primary px-5 safe-pt-14 pb-3 relative overflow-hidden mt-8">
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1 pb-1">
              <div className="h-3 w-16 bg-white/20 rounded animate-pulse mb-2" />
              <div className="h-7 w-28 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
          </div>
          <div className="grid grid-cols-5 gap-1.5 mt-1">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 px-4 pt-4 space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-border/40 h-32 animate-pulse" />
          ))}
        </div>
        <BottomNav currentPage="Sante" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WellnessBanner />

      {/* Hero */}
      <div className="gradient-primary px-5 safe-pt-14 pb-3 relative overflow-hidden mt-8">
        <div className="relative z-10 flex items-end gap-3 mb-3">
          <div className="flex-1 pb-1">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
            <h1 className="text-white font-black text-2xl">Santé</h1>
            {dog && <p className="text-white/70 text-xs mt-0.5">Suivi complet de {dog.name}</p>}

            {/* Quick stats */}
            {!loading && records.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
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

        {/* Tabs — pill cards */}
        <div className="grid grid-cols-5 gap-1.5 mt-1">
          {TABS.map(({ id, label, emoji, bg }) => {
            const active = activeTab === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.93 }}
                transition={spring}
                onClick={() => changeTab(id)}
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
                    layoutId="santeTabIndicator"
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
      <PullToRefresh onRefresh={loadData}>
        <AnimatePresence mode="wait" custom={tabDir}>
          <motion.div
            key={activeTab}
            custom={tabDir}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          >
            {activeTab === "carnet" && (
              <NotebookContent
                dog={dog}
                user={user}
                records={records}
                setRecords={setRecords}
                dailyLogs={dailyLogs}
                growthEntries={growthEntries}
                isPremium={isUserPremium(user)}
                loading={loading}
                initialSubTab={initialSubTab}
                initialVaccineKey={vaccineKeyParam}
                showShareModalInit={showShareModal}
                scrollToQR={urlTab === "qr"}
                onOpenAssistant={() => setIsAssistantOpen(true)}
                onChangeMainTab={changeTab}
              />
            )}
            {activeTab === "malade" && (
              <DiagnosisContent dog={dog} />
            )}
            {activeTab === "import" && (
              <HealthImportContent dog={dog} onImported={(newRecs) => setRecords(prev => [...prev, ...newRecs])} />
            )}
            {activeTab === "growth" && (
              <GrowthTrackerContent
                dog={dog}
                user={user}
                healthRecords={records}
                dailyLogs={dailyLogs}
                onGrowthAdded={(entry) => setGrowthEntries(prev => [...prev, entry])}
              />
            )}
            {activeTab === "findvet" && (
              <FindVetContent dog={dog} user={user} />
            )}
          </motion.div>
        </AnimatePresence>
      </PullToRefresh>
      {/* PDF export — visible uniquement sur l'onglet carnet */}
      {activeTab === "carnet" && dog && !loading && (
        <div className="px-4 pb-4">
          <DownloadHealthPDF dogId={dog.id} dogName={dog.name} />
        </div>
      )}
      <HealthAssistantBar onClick={() => setIsAssistantOpen(true)} />
      <HealthAssistantSheet
        visible={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        dogId={dog?.id}
        dog={dog}
        onRecordAdded={handleAddFromSheet}
      />
      <BottomNav currentPage="Sante" />
    </div>
  );
}