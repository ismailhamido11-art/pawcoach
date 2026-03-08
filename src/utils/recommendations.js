import {
  Syringe, Dumbbell, ScanLine, MessageCircle,
  Footprints, Scale, Stethoscope, Utensils, AlertTriangle as AlertTriangleIcon
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

export function buildRecommendations({ records = [], exercises = [], scans = [], checkins = [], dailyLogs = [], todayCheckin, streak, diagnosisReports = [], nutritionPlans = [] }) {
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
      page: "Sante",
      tab: "vaccine",
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
        page: "Sante",
        tab: "vaccine",
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
      label: completedThisWeek.length === 0 ? "Aucun exercice cette semaine" : "Continue l'entraînement",
      sub: completedThisWeek.length === 0
        ? "Lance ta première séance ensemble"
        : `${completedThisWeek.length} exercice${completedThisWeek.length > 1 ? "s" : ""} fait${completedThisWeek.length > 1 ? "s" : ""} — bravo !`,
      page: "Activite",
      tab: "dressage",
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
      page: "Sante",
      tab: "weight",
      cta: "Ajouter un poids",
      accent: "border-l-pink-400",
    });
  }

  // 8. Recent diagnosis — remind to book vet
  if (diagnosisReports.length > 0) {
    const latest = diagnosisReports[0]; // sorted by -report_date
    const reportDate = latest.report_date;
    const daysSince = reportDate ? Math.floor((Date.now() - new Date(reportDate).getTime()) / 86400000) : null;
    if (daysSince != null && daysSince <= 14) {
      const isUrgent = latest.urgency_level === "high" || latest.urgency_level === "urgent";
      recs.push({
        id: "diagnosis_followup",
        priority: isUrgent ? 1 : 2,
        icon: Stethoscope,
        iconBg: isUrgent ? "bg-red-50" : "bg-blue-50",
        iconColor: isUrgent ? "#ef4444" : "#3b82f6",
        label: isUrgent ? "Bilan veto urgent" : "Bilan veto recent",
        sub: daysSince === 0 ? "Genere aujourd'hui — pense a prendre RDV" : `Il y a ${daysSince}j — as-tu pris RDV ?`,
        page: "FindVet",
        cta: "Trouver un veto",
        accent: isUrgent ? "border-l-red-400" : "border-l-blue-400",
      });
    }
  }

  // 9. Active nutrition plan
  if (nutritionPlans.length > 0) {
    const latest = nutritionPlans[0];
    const planDate = latest.created_date;
    const daysSince = planDate ? Math.floor((Date.now() - new Date(planDate).getTime()) / 86400000) : 0;
    if (daysSince <= 7) {
      recs.push({
        id: "nutrition_plan",
        priority: 3,
        icon: Utensils,
        iconBg: "bg-emerald-50",
        iconColor: "#10b981",
        label: "Plan repas actif",
        sub: "Consulte ton plan nutrition personnalise",
        page: "Nutri",
        tab: "mealplan",
        cta: "Voir le plan",
        accent: "border-l-emerald-400",
      });
    }
  }

  // 10. Caution/toxic food scan alert
  const recentCaution = scans.find(s => (s.verdict === "caution" || s.verdict === "toxic") && s.timestamp);
  if (recentCaution) {
    const daysSince = Math.floor((Date.now() - new Date(recentCaution.timestamp).getTime()) / 86400000);
    if (daysSince <= 7) {
      recs.push({
        id: "food_alert",
        priority: recentCaution.verdict === "toxic" ? 1 : 3,
        icon: AlertTriangleIcon,
        iconBg: recentCaution.verdict === "toxic" ? "bg-red-50" : "bg-amber-50",
        iconColor: recentCaution.verdict === "toxic" ? "#ef4444" : "#f59e0b",
        label: recentCaution.verdict === "toxic" ? "Aliment toxique détecté" : "Aliment à surveiller",
        sub: `${recentCaution.food_name} — score ${recentCaution.score}/10`,
        page: "Scan",
        cta: "Voir les détails",
        accent: recentCaution.verdict === "toxic" ? "border-l-red-400" : "border-l-amber-400",
      });
    }
  }

  // Sort by priority, return top 3
  return recs.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
