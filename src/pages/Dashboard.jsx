import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import {
  Syringe, Weight, Stethoscope, Dumbbell, Salad,
  AlertTriangle, CheckCircle, ChevronRight, Flame,
  TrendingUp, TrendingDown, Minus, ArrowLeft, Heart,
  Sparkles, Activity, Calendar, Star, Footprints
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BottomNav from "../components/BottomNav";
import WellnessBanner from "../components/WellnessBanner";
import IconBadge from "@/components/ui/IconBadge";

const spring = { type: "spring", stiffness: 300, damping: 25 };

const MOOD_LABELS = { 1: "😔", 2: "😐", 3: "😊", 4: "🤩" };
const ENERGY_LABELS = { 1: "💤", 2: "⚡", 3: "🔥" };

function StatCard({ icon: Icon, color, label, value, sub, trend }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/40 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon style={{ color, width: 20, height: 20 }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-foreground text-lg leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-400" : "text-muted-foreground"}`}>
          {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        </div>
      )}
    </div>
  );
}

function AlertCard({ type, title, desc, cta, to }) {
  const colors = {
    warning: { bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle, color: "#f59e0b" },
    ok:      { bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle, color: "#10b981" },
    info:    { bg: "bg-blue-50", border: "border-blue-200", icon: Sparkles, color: "#3b82f6" },
  };
  const cfg = colors[type] || colors.info;
  const Icon = cfg.icon;
  return (
    <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-4 flex items-center gap-3`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cfg.color}20` }}>
        <Icon style={{ color: cfg.color, width: 18, height: 18 }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      {cta && to && (
        <Link to={to} className="flex-shrink-0 text-xs font-bold text-primary hover:underline">
          {cta}
        </Link>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}{p.unit}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [streak, setStreak] = useState(null);
  const [progress, setProgress] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (!dogs.length) return;
        const d = dogs[0];
        setDog(d);

        const [recs, cks, stk, prog, logs] = await Promise.all([
          base44.entities.HealthRecord.filter({ dog_id: d.id }),
          base44.entities.DailyCheckin.filter({ dog_id: d.id }),
          base44.entities.Streak.filter({ dog_id: d.id }),
          base44.entities.UserProgress.filter({ dog_id: d.id }),
          base44.entities.DailyLog.filter({ dog_id: d.id }),
        ]);
        setRecords(recs);
        setCheckins(cks.sort((a, b) => a.date > b.date ? 1 : -1));
        setStreak(stk[0] || null);
        setProgress(prog);
        setDailyLogs(logs || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Computed data ---

  // Weight chart (merged HealthRecord + DailyLog, last 10)
  const allWeightPoints = [
    ...records.filter(r => r.type === "weight" && r.value).map(r => ({ date: r.date, value: r.value })),
    ...dailyLogs.filter(l => l.weight_kg).map(l => ({ date: l.date, value: l.weight_kg })),
  ];
  // dedupe by date: keep the most recent entry per date
  const weightByDate = {};
  allWeightPoints.forEach(p => { if (!weightByDate[p.date] || p.value) weightByDate[p.date] = p.value; });
  const weightData = Object.entries(weightByDate)
    .sort(([a], [b]) => a > b ? 1 : -1)
    .slice(-10)
    .map(([date, value]) => ({ date: date.slice(5), poids: value }));

  // Walk chart (DailyLog, last 14 days)
  const walkData = dailyLogs
    .filter(l => l.walk_minutes)
    .sort((a, b) => a.date > b.date ? 1 : -1)
    .slice(-14)
    .map(l => ({ date: l.date.slice(5), min: l.walk_minutes }));

  const weightTrend = weightData.length >= 2
    ? weightData[weightData.length - 1].poids - weightData[weightData.length - 2].poids
    : 0;

  // Mood/energy chart (last 14 checkins)
  const checkinChart = checkins.slice(-14).map(c => ({
    date: c.date ? c.date.slice(5) : "",
    humeur: c.mood,
    energie: c.energy,
  }));

  const avgMood = checkins.length
    ? (checkins.slice(-7).reduce((s, c) => s + (c.mood || 0), 0) / Math.min(7, checkins.length)).toFixed(1)
    : null;

  // Health alerts
  const today = new Date().toISOString().split("T")[0];
  const alerts = [];

  const vaccines = records.filter(r => r.type === "vaccine");
  const overdueVaccines = vaccines.filter(r => r.next_date && r.next_date < today);
  const upcomingVaccines = vaccines.filter(r => r.next_date && r.next_date >= today && r.next_date <= new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0]);

  if (overdueVaccines.length > 0) {
    alerts.push({ type: "warning", title: `${overdueVaccines.length} vaccin(s) à renouveler`, desc: overdueVaccines.map(v => v.title).join(", "), cta: "Voir", to: createPageUrl("Notebook") });
  } else if (vaccines.length > 0) {
    alerts.push({ type: "ok", title: "Vaccins à jour ✓", desc: `Dernier : ${vaccines.sort((a,b) => b.date > a.date ? 1 : -1)[0]?.title}`, cta: "Carnet", to: createPageUrl("Notebook") });
  } else {
    alerts.push({ type: "warning", title: "Aucun vaccin enregistré", desc: "Renseigne les vaccins dans le carnet de santé", cta: "Ajouter", to: createPageUrl("Notebook") });
  }

  if (upcomingVaccines.length > 0) {
    alerts.push({ type: "info", title: `Rappel vaccin dans 30j`, desc: upcomingVaccines.map(v => `${v.title} — ${v.next_date}`).join(", ") });
  }

  const vetVisits = records.filter(r => r.type === "vet_visit").sort((a, b) => b.date > a.date ? 1 : -1);
  const lastVet = vetVisits[0];
  if (!lastVet) {
    alerts.push({ type: "info", title: "Aucune visite vétérinaire", desc: "Planifie une visite de contrôle annuelle", cta: "Agenda", to: createPageUrl("Notebook") });
  } else if (lastVet.next_date && lastVet.next_date < today) {
    alerts.push({ type: "warning", title: "Visite vétérinaire à planifier", desc: `RDV prévu le ${lastVet.next_date}`, cta: "Agenda", to: createPageUrl("Notebook") });
  }

  // Health score (0-100)
  let score = 40;
  if (vaccines.length > 0 && overdueVaccines.length === 0) score += 20;
  if (checkins.length >= 3) score += 15;
  if (weightData.length >= 2) score += 10;
  if (streak?.current_streak >= 3) score += 10;
  if (progress.length >= 2) score += 5;
  score = Math.min(100, score);

  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 80 ? "Excellent" : score >= 60 ? "Bon" : "À améliorer";

  // Next steps
  const nextSteps = [];
  if (checkins.filter(c => c.date >= new Date(Date.now() - 7 * 864e5).toISOString().split("T")[0]).length < 5) {
    nextSteps.push({ icon: Heart, color: "#ec4899", label: "Check-in quotidien", desc: "Suis l'humeur et l'énergie de " + (dog?.name || "ton chien"), to: createPageUrl("Home") });
  }
  if (progress.length < 3) {
    nextSteps.push({ icon: Dumbbell, color: "#8b5cf6", label: "Commencer le dressage", desc: "Des exercices adaptés à " + (dog?.name || "ton chien"), to: createPageUrl("Training") });
  }
  nextSteps.push({ icon: Salad, color: "#10b981", label: "Plan nutrition IA", desc: "Génère un plan repas personnalisé", to: createPageUrl("Nutrition") });
  if (alerts.some(a => a.type === "warning")) {
    nextSteps.unshift({ icon: Stethoscope, color: "#3b82f6", label: "Mettre à jour le carnet", desc: "Des informations de santé manquent", to: createPageUrl("Notebook") });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      {/* Header */}
      <div className="gradient-primary pt-10 pb-8 px-5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-bold text-xl">Tableau de bord</h1>
              <p className="text-white/70 text-sm">{dog ? `Bilan de santé de ${dog.name}` : "Aperçu général"}</p>
            </div>
            {dog?.photo && (
              <img src={dog.photo} alt={dog.name} className="w-14 h-14 rounded-full border-2 border-white/40 object-cover shadow-lg" />
            )}
          </div>

          {/* Health Score */}
          {dog && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 56 56" className="w-16 h-16 -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke="white" strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 22 * score / 100} ${2 * Math.PI * 22 * (1 - score / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">{score}</span>
              </div>
              <div>
                <p className="text-white font-bold text-lg">{scoreLabel}</p>
                <p className="text-white/70 text-xs">Score de santé global de {dog.name}</p>
                {streak?.current_streak > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-white/90 text-xs font-semibold">{streak.current_streak} jours de streak</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      <div className="px-5 pt-5 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Weight} color="#2d9f82"
            label="Dernier poids"
            value={weightData.length ? `${weightData[weightData.length - 1].poids} kg` : "—"}
            sub={dog?.weight ? `Référence : ${dog.weight} kg` : undefined}
            trend={weightTrend}
          />
          <StatCard
            icon={Activity} color="#8b5cf6"
            label="Check-ins (7j)"
            value={checkins.filter(c => c.date >= new Date(Date.now() - 7 * 864e5).toISOString().split("T")[0]).length}
            sub="jours enregistrés"
          />
          <StatCard
            icon={Star} color="#f59e0b"
            label="Humeur moy. (7j)"
            value={avgMood ? `${avgMood}/4` : "—"}
            sub="basé sur les check-ins"
          />
          <StatCard
            icon={Dumbbell} color="#ec4899"
            label="Exercices faits"
            value={progress.length}
            sub="tours maîtrisés"
          />
        </div>

        {/* Weight chart */}
        {weightData.length >= 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-foreground text-sm">Évolution du poids</p>
                <p className="text-xs text-muted-foreground">{weightData.length} mesures</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                weightTrend > 0.5 ? "bg-amber-50 text-amber-600" : weightTrend < -0.5 ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
              }`}>
                {weightTrend > 0 ? <TrendingUp className="w-3 h-3" /> : weightTrend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {weightTrend > 0 ? "+" : ""}{weightTrend.toFixed(1)} kg
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={weightData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d9f82" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2d9f82" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="poids" name="Poids" stroke="#2d9f82" strokeWidth={2.5} fill="url(#weightGrad)" unit=" kg" dot={{ r: 3, fill: "#2d9f82" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Walk chart */}
        {walkData.length >= 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/40">
            <div className="flex items-center gap-2 mb-4">
              <Footprints className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="font-bold text-foreground text-sm">Balades quotidiennes</p>
                <p className="text-xs text-muted-foreground">{walkData.length} jours enregistrés</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={walkData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="min" name="Minutes" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} unit=" min" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mood/energy chart */}
        {checkinChart.length >= 3 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-foreground text-sm">Humeur & Énergie</p>
                <p className="text-xs text-muted-foreground">14 derniers jours</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Humeur</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Énergie</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={checkinChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, 4]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="humeur" name="Humeur" fill="#2d9f82" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="energie" name="Énergie" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Alerts */}
        <div>
          <p className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertes de santé
          </p>
          <div className="space-y-2.5">
            {alerts.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <AlertCard {...a} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next steps */}
        <div>
          <p className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Prochaines étapes recommandées
          </p>
          <div className="space-y-2.5">
            {nextSteps.slice(0, 4).map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link to={step.to}>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/40 flex items-center gap-3 hover:border-primary/30 hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${step.color}15` }}>
                        <Icon style={{ color: step.color, width: 18, height: 18 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{step.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dog info summary card */}
        {dog && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/40">
            <p className="font-bold text-foreground text-sm mb-3">Fiche de {dog.name}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Race", value: dog.breed || "—" },
                { label: "Sexe", value: dog.sex === "male" ? "Mâle" : dog.sex === "female" ? "Femelle" : "—" },
                { label: "Âge", value: dog.birth_date ? `${Math.floor((Date.now() - new Date(dog.birth_date)) / (365.25 * 864e5))} ans` : "—" },
                { label: "Poids réf.", value: dog.weight ? `${dog.weight} kg` : "—" },
                { label: "Vétérinaire", value: dog.vet_name || "—" },
                { label: "Stérilisé", value: dog.neutered ? "Oui" : "Non" },
              ].map((item, i) => (
                <div key={i} className="bg-muted/30 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <BottomNav currentPage="Dashboard" />
    </div>
  );
}