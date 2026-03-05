import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getActiveDog } from "@/utils";
import { Bell, X, Syringe, Stethoscope, Pill, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const TYPE_CONFIG = {
  vaccine:   { icon: Syringe,      color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  label: "Vaccin" },
  vet_visit: { icon: Stethoscope,  color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", label: "Véto" },
  medication: { icon: Pill,        color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Traitement" },
};

function getDaysLeft(nextDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

// Key to avoid showing same alert twice per session
const SESSION_KEY = "reminders_shown_at";

export default function ReminderAlert() {
  const [alerts, setAlerts] = useState([]);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show once per session
    const lastShown = sessionStorage.getItem(SESSION_KEY);
    if (lastShown) return;

    async function load() {
      try {
        const u = await base44.auth.me();
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (!dogs.length) return;
        const dog = getActiveDog(dogs);

        // Also check next_vet_appointment on dog profile
        const dogAlerts = [];
        if (dog.next_vet_appointment) {
          const days = getDaysLeft(dog.next_vet_appointment);
          if (days >= 0 && days <= 14) {
            dogAlerts.push({
              id: "dog-vet-appt",
              type: "vet_visit",
              title: `RDV vétérinaire de ${dog.name}`,
              daysLeft: days,
              next_date: dog.next_vet_appointment,
            });
          }
        }

        const records = await base44.entities.HealthRecord.filter({ dog_id: dog.id });
        const recordAlerts = records
          .filter(r => r.next_date && ["vaccine", "vet_visit", "medication"].includes(r.type))
          .map(r => ({ ...r, daysLeft: getDaysLeft(r.next_date) }))
          .filter(r => r.daysLeft >= 0 && r.daysLeft <= 14)
          .sort((a, b) => a.daysLeft - b.daysLeft);

        const all = [...dogAlerts, ...recordAlerts].slice(0, 3);
        if (all.length > 0) {
          setAlerts(all);
          setVisible(true);
          sessionStorage.setItem(SESSION_KEY, Date.now().toString());
        }
      } catch (e) {
        // silent
      }
    }
    load();
  }, []);

  if (!visible || alerts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[60] px-4 pt-safe"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 8px)" }}
      >
        <div className="bg-white border border-border rounded-2xl shadow-xl overflow-hidden mt-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-700">
                {alerts.length} rappel{alerts.length > 1 ? "s" : ""} à venir
              </span>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-100 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>

          {/* Alerts list */}
          <div className="divide-y divide-border">
            {alerts.map((alert) => {
              const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.vet_visit;
              const Icon = cfg.icon;
              return (
                <div key={alert.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.border} border`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{alert.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(alert.next_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    alert.daysLeft === 0 ? "bg-red-100 text-red-600" :
                    alert.daysLeft <= 3 ? "bg-amber-100 text-amber-600" :
                    alert.daysLeft <= 7 ? "bg-amber-100 text-amber-600" :
                    "bg-green-100 text-green-600"
                  }`}>
                    {alert.daysLeft === 0 ? "Auj. !" : `${alert.daysLeft}j`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <button
            onClick={() => { setVisible(false); navigate(createPageUrl("Sante") + "?tab=carnet"); }}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-semibold text-primary"
          >
            Voir le carnet santé
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}