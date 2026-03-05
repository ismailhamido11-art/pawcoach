import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Syringe, Stethoscope, Pill, ChevronRight, CheckCheck } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const TYPE_CONFIG = {
  vaccine:    { icon: Syringe,     color: "text-green-600",   bg: "bg-green-50",   label: "Vaccin" },
  vet_visit:  { icon: Stethoscope, color: "text-purple-600",  bg: "bg-purple-50",  label: "Véto" },
  medication: { icon: Pill,        color: "text-emerald-600", bg: "bg-emerald-50", label: "Traitement" },
};

function getDaysLeft(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function urgencyBadge(days) {
  if (days < 0)  return { label: "Dépassé", cls: "bg-red-100 text-red-600" };
  if (days === 0) return { label: "Auj. !", cls: "bg-red-100 text-red-600" };
  if (days <= 3)  return { label: `${days}j`, cls: "bg-orange-100 text-orange-600" };
  if (days <= 7)  return { label: `${days}j`, cls: "bg-amber-100 text-amber-600" };
  return { label: `${days}j`, cls: "bg-green-100 text-green-600" };
}

// Shared state across instances
let _notifications = [];
let _listeners = [];
function subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; }
function notify() { _listeners.forEach(fn => fn([..._notifications])); }

export async function loadNotifications() {
  try {
    const u = await base44.auth.me();
    if (!u) return;
    const dogs = await base44.entities.Dog.filter({ owner: u.email });
    if (!dogs.length) return;

    const items = [];

    for (const dog of dogs) {
      // next_vet_appointment on dog profile
      if (dog.next_vet_appointment) {
        const days = getDaysLeft(dog.next_vet_appointment);
        if (days >= -3 && days <= 30) {
          items.push({ id: `dog-${dog.id}-vet`, type: "vet_visit", title: `RDV véto · ${dog.name}`, daysLeft: days, next_date: dog.next_vet_appointment, dogName: dog.name });
        }
      }
      // Health records with next_date
      const records = await base44.entities.HealthRecord.filter({ dog_id: dog.id });
      for (const r of records) {
        if (!r.next_date || !["vaccine", "vet_visit", "medication"].includes(r.type)) continue;
        const days = getDaysLeft(r.next_date);
        if (days >= -3 && days <= 30) {
          items.push({ id: r.id, type: r.type, title: r.title, daysLeft: days, next_date: r.next_date, dogName: dog.name });
        }
      }
    }

    items.sort((a, b) => a.daysLeft - b.daysLeft);
    _notifications = items;
    notify();
  } catch (e) { /* silent */ }
}

export function useNotifications() {
  const [items, setItems] = useState(_notifications);
  useEffect(() => {
    const unsub = subscribe(setItems);
    if (_notifications.length === 0) loadNotifications();
    return unsub;
  }, []);
  return items;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const notifications = useNotifications();
  const navigate = useNavigate();

  const urgent = notifications.filter(n => n.daysLeft <= 7);
  const count = urgent.length;

  return (
    <>
      {/* Bell button — Premium style */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        className={`relative p-3 rounded-full transition-all ${
          count > 0
            ? "bg-gradient-to-br from-primary via-primary to-accent shadow-xl"
            : "bg-gradient-to-br from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 shadow-md"
        }`}
      >
        <motion.div
          animate={count > 0 ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="relative"
        >
          <Bell className={`w-6 h-6 ${count > 0 ? "text-white drop-shadow-lg" : "text-primary"}`} strokeWidth={count > 0 ? 2 : 1.5} />
        </motion.div>
        {count > 0 && (
          <>
            {/* Glow ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-white/30"
            />
            {/* Badge */}
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="absolute -top-1.5 -right-1.5 min-w-[24px] h-6 px-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xl ring-2 ring-white"
            >
              {count > 9 ? "9+" : count}
            </motion.span>
          </>
        )}
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70]"
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white z-[80] flex flex-col shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white sticky top-0"
                style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 16px)" }}>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="font-black text-foreground text-base">Notifications</h2>
                  {count > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">{count}</span>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-colors">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCheck className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="font-bold text-foreground">Tout est à jour !</p>
                    <p className="text-sm text-muted-foreground mt-1">Aucun rappel dans les 30 prochains jours</p>
                  </div>
                ) : (
                  <div>
                    {/* Urgent */}
                    {urgent.length > 0 && (
                      <div>
                        <p className="px-5 pt-4 pb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Urgent · cette semaine</p>
                        <div className="divide-y divide-border">
                          {urgent.map(n => <NotifRow key={n.id} n={n} onNavigate={() => { setOpen(false); navigate(createPageUrl("Sante") + "?tab=carnet"); }} />)}
                        </div>
                      </div>
                    )}
                    {/* Upcoming */}
                    {notifications.filter(n => n.daysLeft > 7).length > 0 && (
                      <div>
                        <p className="px-5 pt-4 pb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">À venir · 30 jours</p>
                        <div className="divide-y divide-border">
                          {notifications.filter(n => n.daysLeft > 7).map(n => <NotifRow key={n.id} n={n} onNavigate={() => { setOpen(false); navigate(createPageUrl("Sante") + "?tab=carnet"); }} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => { setOpen(false); navigate(createPageUrl("Sante") + "?tab=carnet"); }}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  Gérer le carnet santé <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NotifRow({ n, onNavigate }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.vet_visit;
  const Icon = cfg.icon;
  const badge = urgencyBadge(n.daysLeft);

  return (
    <button onClick={onNavigate} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/30 transition-colors text-left">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{n.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {n.dogName && <span className="font-medium">{n.dogName} · </span>}
          {new Date(n.next_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
        </p>
      </div>
      <span className={`text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
    </button>
  );
}