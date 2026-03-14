import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Camera, MapPin, CheckCircle2, Star } from "lucide-react";
import { createPageUrl } from "@/utils";
import confetti from "canvas-confetti";

const STEPS = [
  {
    id: "checkin",
    icon: Heart,
    color: "#2D9F82",
    bg: "rgba(45,159,130,0.08)",
    border: "#2D9F82",
    title: (name) => `Fais le check-in de ${name}`,
    desc: (name) => `Dis-nous comment va ${name} aujourd'hui`,
    cta: "Faire le check-in",
    action: "scroll", // scrolls to TodayCard
  },
  {
    id: "scan",
    icon: Camera,
    color: "#1A4D3E",
    bg: "rgba(26,77,62,0.07)",
    border: "#1A4D3E",
    title: (name) => `Scanne la croquette de ${name}`,
    desc: (name) => `Vérifie si l'alimentation de ${name} est adaptée`,
    cta: "Scanner une croquette",
    action: "navigate",
    page: "Scan",
  },
  {
    id: "walk",
    icon: MapPin,
    color: "#2D9F82",
    bg: "rgba(45,159,130,0.08)",
    border: "#2D9F82",
    title: (name) => `Lance une balade avec ${name}`,
    desc: (name) => `Enregistre ta première sortie avec ${name}`,
    cta: "Démarrer une balade",
    action: "navigate",
    page: "Activite",
    tab: "walk",
  },
];

function getStorageKey(dogId) {
  return `pawcoach_j0_completed_${dogId}`;
}

function loadCompleted(dogId) {
  try {
    const raw = localStorage.getItem(getStorageKey(dogId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompleted(dogId, completed) {
  try {
    localStorage.setItem(getStorageKey(dogId), JSON.stringify(completed));
  } catch {}
}

export default function FirstDayGuide({ dog, todayCheckin, scans, dailyLogs, onScrollToCheckin }) {
  const navigate = useNavigate();
  const dogId = dog?.id;
  const dogName = dog?.name || "ton chien";

  // Detect which actions are actually done (from real data)
  const dataCompleted = {
    checkin: !!todayCheckin,
    scan: Array.isArray(scans) && scans.length > 0,
    walk: Array.isArray(dailyLogs) && dailyLogs.some((l) => (l.walk_minutes || 0) > 0),
  };

  const [completed, setCompleted] = useState({});
  const [celebrating, setCelebrating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Load persisted state
  useEffect(() => {
    if (!dogId) return;
    const stored = loadCompleted(dogId);
    // Merge: stored OR real data
    setCompleted({ ...stored, ...dataCompleted });
  }, [dogId, todayCheckin, scans?.length, dailyLogs?.length]);

  // Sync data-based completions into localStorage
  useEffect(() => {
    if (!dogId) return;
    const stored = loadCompleted(dogId);
    const merged = { ...stored, ...dataCompleted };
    // Only update if something changed
    const changed = Object.keys(dataCompleted).some((k) => dataCompleted[k] && !stored[k]);
    if (changed) {
      saveCompleted(dogId, merged);
      setCompleted(merged);
    }
  }, [dogId, dataCompleted.checkin, dataCompleted.scan, dataCompleted.walk]);

  const allDone = STEPS.every((s) => completed[s.id]);

  // Fire celebration when all done
  useEffect(() => {
    if (allDone && !celebrating && !dismissed) {
      setCelebrating(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.5, y: 0.6 },
        colors: ["#2d9f82", "#1A4D3E", "#10b981", "#f0fdf4"],
      });
      const timer = setTimeout(() => setDismissed(true), 2800);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  const markDone = useCallback(
    (stepId) => {
      if (!dogId) return;
      const stored = loadCompleted(dogId);
      const next = { ...stored, [stepId]: true };
      saveCompleted(dogId, next);
      setCompleted((prev) => ({ ...prev, [stepId]: true }));
    },
    [dogId]
  );

  const handleCta = (step) => {
    if (completed[step.id]) return;
    if (step.action === "scroll") {
      onScrollToCheckin?.();
    } else {
      navigate(createPageUrl(step.page) + (step.tab ? `?tab=${step.tab}` : ""));
    }
  };

  // Visible steps = not yet completed (filter as individual cards disappear)
  const visibleSteps = STEPS.filter((s) => !completed[s.id]);

  // If already all done on mount (stored), never show
  if (dismissed || (allDone && !celebrating)) return null;
  if (!dog) return null;

  return (
    <div className="px-4 mt-3">
      {/* Header */}
      <AnimatePresence>
        {!allDone && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center gap-2 mb-3"
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(45,159,130,0.12)" }}
            >
              <Star className="w-3.5 h-3.5" style={{ color: "#2D9F82" }} />
            </div>
            <p className="text-sm font-bold" style={{ color: "#1A4D3E" }}>
              Par où commencer avec {dogName} ?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step cards */}
      <div className="flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {visibleSteps.map((step, i) => {
            const Icon = step.icon;
            const isDone = completed[step.id];
            return (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, x: -16, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.22 } }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: i * 0.07,
                }}
                whileTap={{ scale: 0.98 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "hsl(37,33%,97%)",
                  borderLeft: `3.5px solid ${step.border}`,
                  boxShadow: "0 1px 8px rgba(26,77,62,0.06), 0 0 0 1px rgba(26,77,62,0.06)",
                }}
              >
                <div className="flex items-center gap-3 p-3.5">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: step.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: "#1A4D3E" }}
                    >
                      {step.title(dogName)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {step.desc(dogName)}
                    </p>
                  </div>

                  {/* CTA */}
                  {!isDone && (
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handleCta(step)}
                      className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl text-white"
                      style={{ background: step.color }}
                    >
                      {step.cta}
                    </motion.button>
                  )}

                  {isDone && (
                    <CheckCircle2
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: "#2D9F82" }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* All-done celebration card */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-2xl p-4 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(45,159,130,0.1) 0%, rgba(26,77,62,0.08) 100%)",
              border: "1.5px solid rgba(45,159,130,0.25)",
            }}
          >
            <p className="text-lg font-black" style={{ color: "#1A4D3E" }}>
              Bravo, {dogName} est entre de bonnes mains !
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tu as complété les 3 premières actions. Continue comme ca !
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
