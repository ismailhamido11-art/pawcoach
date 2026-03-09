/**
 * SmartAlerts — Alertes intelligentes basées sur les tendances historiques
 * Analyse : baisse de vitalité, prédiction vaccins, poids, activité, streak
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertTriangle, TrendingDown, Syringe, Scale,
  Zap, CheckCircle, ChevronRight, Brain, Flame,
  Footprints, Activity
} from "lucide-react";
import { computeVaccineMap, getVaccineDisplayName } from "@/utils/healthStatus";

const SEVERITY = {
  critical: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-700", label: "Urgent" },
  warning:  { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", label: "Attention" },
  info:     { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400", text: "text-blue-700", label: "Info" },
  ok:       { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "Bon signe" },
};

/**
 * Génère toutes les alertes intelligentes à partir des données brutes
 */
export function computeAlerts({ dog, checkins = [], records = [], streak, dailyLogs = [], scans = [] }) {
  const alerts = [];
  const today = new Date().toISOString().split("T")[0];

  // ── 1. TENDANCE VITALITÉ (mood + énergie sur 7 vs 7j précédents) ──
  const sorted = [...checkins].sort((a, b) => a.date > b.date ? 1 : -1);
  const last7  = sorted.slice(-7);
  const prev7  = sorted.slice(-14, -7);

  if (last7.length >= 3 && prev7.length >= 3) {
    const avgMoodLast  = last7.reduce((s, c) => s + (c.mood || 2), 0) / last7.length;
    const avgMoodPrev  = prev7.reduce((s, c) => s + (c.mood || 2), 0) / prev7.length;
    const avgEnergyLast = last7.reduce((s, c) => s + (c.energy || 2), 0) / last7.length;
    const avgEnergyPrev = prev7.reduce((s, c) => s + (c.energy || 2), 0) / prev7.length;
    const moodDrop   = avgMoodPrev - avgMoodLast;
    const energyDrop = avgEnergyPrev - avgEnergyLast;

    if (moodDrop >= 1.2 || energyDrop >= 0.8) {
      alerts.push({
        id: "vitality_drop_critical",
        severity: "critical",
        icon: TrendingDown,
        iconColor: "#ef4444",
        title: "Baisse de vitalité détectée",
        desc: `Humeur en baisse de ${Math.round(moodDrop * 10) / 10} pts et énergie de ${Math.round(energyDrop * 10) / 10} pts vs la semaine passée. Consultez un vétérinaire si ça persiste.`,
        cta: "Faire un check-in",
        to: createPageUrl("Home"),
      });
    } else if (moodDrop >= 0.6 || energyDrop >= 0.5) {
      alerts.push({
        id: "vitality_drop_warning",
        severity: "warning",
        icon: Activity,
        iconColor: "#d97706",
        title: "Légère baisse d'énergie",
        desc: `L'humeur et l'énergie de ${dog?.name || "ton chien"} ont baissé cette semaine. À surveiller.`,
        cta: "Check-in",
        to: createPageUrl("Home"),
      });
    } else if (avgMoodLast >= 3.2 && avgEnergyLast >= 2.5) {
      alerts.push({
        id: "vitality_great",
        severity: "ok",
        icon: Zap,
        iconColor: "#10b981",
        title: `${dog?.name || "Ton chien"} est en pleine forme !`,
        desc: `Humeur et énergie excellentes sur les 7 derniers jours. Continue comme ça !`,
        cta: null,
        to: null,
      });
    }
  } else if (checkins.length === 0) {
    alerts.push({
      id: "no_checkin",
      severity: "warning",
      icon: Activity,
      iconColor: "#d97706",
      title: "Aucun check-in encore",
      desc: "Commence à suivre l'humeur et l'énergie quotidiennement pour activer les alertes intelligentes.",
      cta: "Premier check-in",
      to: createPageUrl("Home"),
    });
  }

  // ── 2. PRÉDICTION VACCINS (smart: unique vaccines, not raw records) ──
  const vaccineMap = computeVaccineMap(records);
  const vaccineEntries = Object.entries(vaccineMap);
  const overdueVax = vaccineEntries.filter(([, v]) => v.status === "overdue");
  const dueSoonVax = vaccineEntries.filter(([, v]) => v.status === "due_soon");

  if (overdueVax.length > 0) {
    alerts.push({
      id: "vaccine_overdue",
      severity: "critical",
      icon: Syringe,
      iconColor: "#ef4444",
      title: `${overdueVax.length} vaccin${overdueVax.length > 1 ? "s" : ""} en retard !`,
      desc: overdueVax.map(([, v]) => v.ref.name).join(", ") + " — rappel dépassé.",
      cta: "Voir le carnet",
      to: createPageUrl("Sante"),
    });
  } else if (dueSoonVax.length > 0) {
    const closest = dueSoonVax.sort((a, b) => a[1].daysUntilDue - b[1].daysUntilDue)[0];
    alerts.push({
      id: "vaccine_soon",
      severity: "warning",
      icon: Syringe,
      iconColor: "#d97706",
      title: `Rappel vaccin dans ${closest[1].daysUntilDue} jours`,
      desc: dueSoonVax.map(([, v]) => v.ref.name).join(", ") + " — prends rendez-vous bientôt.",
      cta: "Planifier",
      to: createPageUrl("Sante"),
    });
  } else if (vaccineEntries.every(([, v]) => v.status === "never") || vaccineEntries.length === 0) {
    alerts.push({
      id: "vaccine_none",
      severity: "info",
      icon: Syringe,
      iconColor: "#3b82f6",
      title: "Aucun vaccin renseigné",
      desc: "Ajoute les vaccins dans le carnet pour activer les rappels automatiques.",
      cta: "Ajouter",
      to: createPageUrl("Sante"),
    });
  }

  // ── 3. POIDS (dérive significative) ──
  const allWeights = [
    ...records.filter(r => r.type === "weight" && r.value).map(r => ({ date: r.date, v: r.value })),
    ...dailyLogs.filter(l => l.weight_kg).map(l => ({ date: l.date, v: l.weight_kg })),
  ].sort((a, b) => a.date > b.date ? 1 : -1);

  if (allWeights.length >= 2 && dog?.weight) {
    const latest = allWeights[allWeights.length - 1].v;
    const drift = latest - dog.weight;
    const pct = Math.abs(drift / dog.weight) * 100;
    if (pct >= 10) {
      alerts.push({
        id: "weight_drift",
        severity: drift > 0 ? "warning" : "warning",
        icon: Scale,
        iconColor: "#d97706",
        title: `Variation de poids : ${drift > 0 ? "+" : ""}${drift.toFixed(1)} kg`,
        desc: `${pct.toFixed(0)}% d'écart par rapport au poids de référence (${dog.weight} kg). Consulte ton vétérinaire.`,
        cta: "Voir l'évolution",
        to: createPageUrl("Dashboard"),
      });
    }
  }

  // ── 4. STREAK / RÉGULARITÉ ──
  if (streak?.current_streak === 0 && streak?.longest_streak >= 5) {
    alerts.push({
      id: "streak_broken",
      severity: "warning",
      icon: Flame,
      iconColor: "#d97706",
      title: "Streak interrompu",
      desc: `Tu avais atteint ${streak.longest_streak} jours de suite. Reprends dès aujourd'hui !`,
      cta: "Check-in maintenant",
      to: createPageUrl("Home"),
    });
  }

  // ── 5. INACTIVITÉ (pas de balade depuis 5j) ──
  const recentLogs = dailyLogs.filter(l => l.walk_minutes && l.date >= new Date(Date.now() - 5 * 864e5).toISOString().split("T")[0]);
  if (dailyLogs.length > 0 && recentLogs.length === 0) {
    alerts.push({
      id: "walk_inactive",
      severity: "info",
      icon: Footprints,
      iconColor: "#6366f1",
      title: "Pas de balade enregistrée",
      desc: "Aucune activité physique notée depuis 5 jours. Pense à renseigner les sorties.",
      cta: "Journaliser",
      to: createPageUrl("Home"),
    });
  }

  return alerts;
}

function AlertRow({ alert, index }) {
  const cfg = SEVERITY[alert.severity];
  const Icon = alert.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`${cfg.bg} ${cfg.border} border rounded-2xl p-4 flex items-start gap-3`}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: alert.iconColor + "18" }}>
        <Icon className="w-4.5 h-4.5" style={{ color: alert.iconColor, width: 18, height: 18 }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-black uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
        </div>
        <p className="text-sm font-semibold text-foreground leading-snug">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.desc}</p>
      </div>
      {alert.cta && alert.to && (
        <Link
          to={alert.to}
          className="flex-shrink-0 flex items-center gap-0.5 text-xs font-bold text-primary mt-1 whitespace-nowrap"
        >
          {alert.cta}
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </motion.div>
  );
}

export default function SmartAlerts({ dog, checkins = [], records = [], streak, dailyLogs = [], scans = [] }) {
  const [expanded, setExpanded] = useState(false);
  const alerts = computeAlerts({ dog, checkins, records, streak, dailyLogs, scans });

  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount  = alerts.filter(a => a.severity === "warning").length;
  const visibleAlerts = expanded ? alerts : alerts.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground text-sm">Alertes intelligentes</span>
          {criticalCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{criticalCount}</span>
          )}
          {criticalCount === 0 && warningCount > 0 && (
            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{warningCount}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">Basé sur l'historique</span>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence>
          {visibleAlerts.map((alert, i) => (
            <AlertRow key={alert.id} alert={alert} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {alerts.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 w-full text-xs font-semibold text-primary text-center py-2"
        >
          {expanded ? "Voir moins" : `Voir ${alerts.length - 3} alerte(s) de plus`}
        </button>
      )}
    </div>
  );
}