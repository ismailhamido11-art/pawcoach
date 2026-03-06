import {
  Syringe, Dumbbell, ScanLine, MessageCircle,
  Footprints, Scale
} from "lucide-react";

export function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.getFullYear() + "-" + String(mon.getMonth() + 1).padStart(2, "0") + "-" + String(mon.getDate()).padStart(2, "0");
}

export function buildRecommendations({ records, exercises, scans, checkins, dailyLogs, todayCheckin, streak }) {
  const today = getTodayString();
  const weekStart = getWeekStart();
  const recs = [];

  // 1. Health alert — overdue vaccine
  const vaccines = records.filter(r => r.type === "vaccine" && r.next_date);
  const overdueVaccine = vaccines.find(v => v.next_date < today);
  if (overdueVaccine) {
    recs.push({
      id: "vaccine_overdue",
      priority: 1,
      icon: Syringe,
      iconBg: "bg-red-50",
      iconColor: "#ef4444",
      label: "Rappel vaccin en retard",
      sub: `${overdueVaccine.title} — depuis le ${overdueVaccine.next_date}`,
      page: "Notebook",
      cta: "Mettre a jour",
      accent: "border-l-red-400",
    });
  }

  // 2. Vaccine coming soon (within 30 days)
  if (!overdueVaccine) {
    const soonVaccine = vaccines.find(v => v.next_date >= today && v.next_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    if (soonVaccine) {
      recs.push({
        id: "vaccine_soon",
        priority: 2,
        icon: Syringe,
        iconBg: "bg-primary/10",
        iconColor: "#2d9f82",
        label: "Vaccin a prevoir bientot",
        sub: `${soonVaccine.title} — le ${soonVaccine.next_date}`,
        page: "Notebook",
        cta: "Voir le carnet",
        accent: "border-l-primary",
      });
    }
  }

  // 3. No check-in this week
  const checkinsThisWeek = checkins.filter(c => c.date >= weekStart);
  if (checkinsThisWeek.length === 0 && !todayCheckin) {
    recs.push({
      id: "no_checkin",
      priority: 2,
      icon: MessageCircle,
      iconBg: "bg-violet-50",
      iconColor: "#8b5cf6",
      label: "Pas encore de check-in",
      sub: "Comment se sent ton chien aujourd'hui ?",
      page: "Home",
      cta: "Faire le check-in",
      accent: "border-l-violet-400",
    });
  }

  // 4. No training this week
  const completedThisWeek = exercises.filter(e => e.completed_date && e.completed_date >= weekStart);
  if (completedThisWeek.length < 2) {
    recs.push({
      id: "training",
      priority: 3,
      icon: Dumbbell,
      iconBg: "bg-emerald-50",
      iconColor: "#10b981",
      label: completedThisWeek.length === 0 ? "Aucun exercice cette semaine" : "Continue l'entrainement",
      sub: completedThisWeek.length === 0
        ? "Lance ta premiere seance ensemble"
        : `${completedThisWeek.length} exercice${completedThisWeek.length > 1 ? "s" : ""} fait${completedThisWeek.length > 1 ? "s" : ""} — bravo !`,
      page: "Training",
      cta: "Voir les exercices",
      accent: "border-l-emerald-400",
    });
  }

  // 5. No food scan ever
  if (scans.length === 0) {
    recs.push({
      id: "scan",
      priority: 4,
      icon: ScanLine,
      iconBg: "bg-blue-50",
      iconColor: "#3b82f6",
      label: "Essaie le scanner alimentaire",
      sub: "Verifie si un aliment est safe pour ton chien",
      page: "Scan",
      cta: "Scanner un aliment",
      accent: "border-l-blue-400",
    });
  }

  // 6. No daily log today
  const todayLog = dailyLogs.find(l => l.date === today);
  if (!todayLog) {
    recs.push({
      id: "daily_log",
      priority: 4,
      icon: Footprints,
      iconBg: "bg-emerald-50",
      iconColor: "#10b981",
      label: "Log de la journee manquant",
      sub: "Poids, balade, hydratation — 30 sec",
      page: "Home",
      cta: "Logger maintenant",
      accent: "border-l-emerald-400",
      fab: true,
    });
  }

  // 7. No weight record in 30 days
  const allWeights = [
    ...records.filter(r => r.type === "weight").map(r => r.date),
    ...dailyLogs.filter(l => l.weight_kg).map(l => l.date),
  ];
  const lastWeight = allWeights.sort((a, b) => b.localeCompare(a))[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  if (!lastWeight || lastWeight < thirtyDaysAgo) {
    recs.push({
      id: "weight",
      priority: 5,
      icon: Scale,
      iconBg: "bg-pink-50",
      iconColor: "#ec4899",
      label: "Peser ton chien",
      sub: lastWeight ? `Dernier releve il y a +30 jours` : "Aucun poids enregistre",
      page: "Notebook",
      cta: "Ajouter un poids",
      accent: "border-l-pink-400",
    });
  }

  // Sort by priority, return top 3
  return recs.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
