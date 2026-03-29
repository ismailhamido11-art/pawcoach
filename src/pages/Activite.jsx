import { useState, useEffect, lazy, Suspense } from "react";
import { DailyLog } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { useDog } from "@/lib/DogContext";
import { useHomeCache } from "@/lib/HomeCacheContext";
import BottomNav from "@/components/BottomNav";
import ChatFAB from "@/components/ChatFAB";
import WellnessBanner from "@/components/WellnessBanner";
import Illustration from "@/components/illustrations/Illustration";
import StorysetIllustration from "@/components/ui/StorysetIllustration";
import WalkMode from "@/components/tracker/WalkMode";
import PullToRefresh from "@/components/PullToRefresh";
import TrackerHistory from "@/components/tracker/TrackerHistory";
const AITrainingProgram = lazy(() => import("@/components/activite/AITrainingProgram"));
import SkeletonPage from "@/components/ui/SkeletonPage";
import EmptyState from "@/components/ui/EmptyState";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Footprints, History, Dumbbell, Sparkles, ExternalLink, Lightbulb, Timer, Target, Bone, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { spring } from "@/lib/animations";
import { toast } from "sonner";
import useTabNavigation, { tabVariants } from "@/hooks/useTabNavigation";

const TABS = [
  { id: "balade",     label: "Balade",     icon: Footprints, bg: "from-emerald-500 to-emerald-700" },
  { id: "historique", label: "Historique", icon: History,    bg: "from-blue-500 to-indigo-600" },
  { id: "programme",  label: "Programme",  icon: Sparkles,   bg: "from-violet-500 to-purple-600" },
  { id: "dressage",   label: "Dressage",   icon: Dumbbell,   bg: "from-amber-500 to-amber-600" },
];

export default function Activite() {
  const { user, isLoadingAuth } = useAuth();
  const { dog, loadingDog } = useDog();
  const { invalidateHome } = useHomeCache();
  const prefersReducedMotion = useReducedMotion();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { activeTab, tabDir, changeTab } = useTabNavigation(TABS, "Activite");

  const load = async () => {
    if (!dog) { setLoading(false); return; }
    setLoading(true);
    try {
      const l = await DailyLog.filter({ dog_id: dog.id }, "-date", 30);
      setLogs(l || []);
    } catch (e) {
      console.error(e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoadingAuth || loadingDog) return;
    if (!user || !dog) { setLoading(false); return; }
    load();
  }, [isLoadingAuth, loadingDog, user, dog]);

  const refreshLogs = async () => {
    if (!dog || !user) return;
    try {
      const l = await DailyLog.filter({ dog_id: dog.id }, "-date", 30);
      setLogs(l || []);
      // UX-04: checkWalkBadges removed — already called by WalkMode/CombinedFAB after walk save
      // Invalidate Home cache so DailyProgress reflects the new walk immediately
      invalidateHome();
    } catch {
      toast.error("Impossible de rafraîchir les activités. Vérifie ta connexion.");
    }
  };

  if (loading) {
    return <SkeletonPage variant="stats" currentPage="Activite" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WellnessBanner />

      {/* Hero */}
      <motion.div
        className="gradient-primary px-5 safe-pt-14 pb-3 relative overflow-hidden mt-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="relative z-10 flex items-end gap-3 mb-3">
          <div className="flex-1 pb-1">
            <p className="text-white/80 text-[11px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
            <h1 className="text-white font-black text-2xl">Activité</h1>
            {dog && <p className="text-white/80 text-xs mt-0.5">Suivi des balades de {dog.name}</p>}
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
        <div className="relative">
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {TABS.map(({ id, label, icon: TabIcon, bg }) => {
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
                  <span className="relative text-xl leading-none"><TabIcon className="w-4 h-4" /></span>
                  <span className={`relative text-[11px] font-bold leading-tight ${active ? "text-white" : "text-white/75"}`}>{label}</span>
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
          {/* Gradient edge — scroll hint on small screens when last tab is not active */}
          {activeTab !== TABS[TABS.length - 1].id && (
            <div
              className="absolute top-0 right-0 h-full w-8 pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent, rgba(26,77,62,0.4))" }}
            />
          )}
        </div>

        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </motion.div>

      {/* Offline error banner */}
      {loadError && !loading && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-sm font-bold text-amber-700">Pas de connexion</p>
          <p className="text-xs text-amber-600 mt-1">Vérifie ta connexion internet</p>
          <button
            onClick={() => { setLoadError(false); load(); }}
            className="mt-3 text-xs font-bold text-primary"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Tab content */}
      <PullToRefresh onRefresh={async () => { await refreshLogs(); }}>
        <AnimatePresence mode="wait" custom={tabDir}>
          <motion.div
            key={activeTab}
            custom={tabDir}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="px-4 pt-4"
          >
            {activeTab === "balade" && (
              <div className="space-y-4">
                {!dog ? (
                  <EmptyState
                    mascot="walking"
                    title="Crée le profil de ton chien"
                    description="Pour démarrer une balade, ajoute d'abord ton chien"
                  />
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50/50 rounded-3xl p-4 border border-emerald-100/50 shadow-sm flex items-center gap-4">
                      <StorysetIllustration name="playing" className="w-24 h-24 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-foreground">Historique de balades</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Chaque sortie est enregistrée automatiquement</p>
                      </div>
                    </div>
                    <WalkMode
                      dog={dog}
                      user={user}
                      logs={logs}
                      onLogged={refreshLogs}
                      onViewHistory={() => changeTab("historique")}
                    />
                  </>
                )}
              </div>
            )}
            {activeTab === "historique" && (
              <TrackerHistory logs={logs} dog={dog} />
            )}
            {activeTab === "programme" && (
              <Suspense fallback={<SkeletonPage variant="list" />}>
                <AITrainingProgram dog={dog} logs={logs} />
              </Suspense>
            )}
            {activeTab === "dressage" && (
              <DressageContent dog={dog} />
            )}
          </motion.div>
        </AnimatePresence>
      </PullToRefresh>

      <ChatFAB />
      <BottomNav currentPage="Activite" />
    </div>
  );
}

function DressageContent({ dog }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="space-y-4 pb-4">
      {/* Illustrated info card */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50/50 rounded-3xl p-4 border border-indigo-100/50 shadow-sm flex items-center gap-4">
        <StorysetIllustration name="training" className="w-24 h-24 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-foreground">Conseils personnalisés</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Des astuces adaptées au profil de {dog?.name || "ton chien"}</p>
        </div>
      </div>

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
          <StorysetIllustration name="training" alt="Dressage" className="w-full h-full drop-shadow-lg" />
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
        <p className="font-bold text-sm text-foreground flex items-center gap-1"><Lightbulb className="w-4 h-4 text-amber-500" /> Conseils rapides</p>
        {[
          { Icon: Timer, color: "text-blue-500", text: "Sessions courtes (5-10 min) et régulières" },
          { Icon: Target, color: "text-emerald-600", text: "Terminer sur une réussite pour motiver" },
          { Icon: Bone, color: "text-amber-600", text: "Récompenses petites mais fréquentes" },
          { Icon: CalendarDays, color: "text-violet-600", text: "Pratiquer à la même heure chaque jour" },
        ].map(({ Icon: TI, color, text }, i) => (
          <motion.div
            key={text}
            className="flex items-center gap-3"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
          >
            <TI className={`w-5 h-5 ${color} flex-shrink-0`} />
            <p className="text-xs text-muted-foreground">{text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}