import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Heart, TrendingUp, Info, X, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// ─── Score calculation ────────────────────────────────────────────────────────
// Each pillar has a max weight that sums to 100
// Sources: DailyCheckin, Streak, HealthRecord (vaccine/weight/vet), UserProgress, FoodScan, dog profile completeness

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function daysBetween(dateStr) {
  if (!dateStr) return 9999;
  const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

function calcScore(data) {
  const pillars = [];

  // 1. ROUTINE (25pts) — check-ins cette semaine
  const weekStart = getMonday();
  const thisWeekCheckins = (data.checkins || []).filter(c => c.date >= weekStart);
  const checkinDays = Math.min(thisWeekCheckins.length, 7);
  const routineScore = Math.round((checkinDays / 7) * 25);
  pillars.push({
    key: "routine",
    label: "Routine quotidienne",
    score: routineScore,
    max: 25,
    detail: `${checkinDays}/7 jours cette semaine`,
    status: routineScore >= 20 ? "great" : routineScore >= 10 ? "ok" : "low",
    tip: checkinDays < 7 ? "Faites un check-in aujourd'hui !" : null,
  });

  // 2. STREAK (15pts) — régularité long terme
  const streak = data.streak?.current_streak || 0;
  const streakScore = Math.min(Math.round((streak / 30) * 15), 15);
  pillars.push({
    key: "streak",
    label: "Régularité",
    score: streakScore,
    max: 15,
    detail: `${streak} jours consécutifs`,
    status: streak >= 14 ? "great" : streak >= 3 ? "ok" : "low",
    tip: streak === 0 ? "Commencez votre streak aujourd'hui" : null,
  });

  // 3. SANTÉ CARNET (20pts) — vaccins à jour, poids suivi, visite véto
  const records = data.records || [];
  const vaccines = records.filter(r => r.type === "vaccine");
  const weights = records.filter(r => r.type === "weight");
  const vetVisits = records.filter(r => r.type === "vet_visit");

  // Merge weight sources: HealthRecord (type=weight) + DailyLog (weight_kg)
  const dailyLogWeights = (data.dailyLogs || [])
    .filter(l => l.weight_kg && l.date)
    .map(l => ({ date: l.date }));
  const allWeightEntries = [
    ...weights.map(r => ({ date: r.date })),
    ...dailyLogWeights,
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastWeight = allWeightEntries[0];
  const daysSinceWeight = lastWeight ? daysBetween(lastWeight.date) : 9999;
  const lastVaccine = vaccines.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const lastVet = vetVisits.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  let carnetScore = 0;
  if (vaccines.length > 0) carnetScore += 8;   // vaccins enregistrés
  if (daysSinceWeight <= 30) carnetScore += 6;  // poids récent
  else if (daysSinceWeight <= 90) carnetScore += 3;
  if (vetVisits.length > 0) carnetScore += 6;   // visite véto
  carnetScore = Math.min(carnetScore, 20);

  pillars.push({
    key: "sante",
    label: "Suivi médical",
    score: carnetScore,
    max: 20,
    detail: `${vaccines.length} vaccin${vaccines.length > 1 ? "s" : ""} · ${allWeightEntries.length} pesée${allWeightEntries.length > 1 ? "s" : ""} · ${vetVisits.length} visite${vetVisits.length > 1 ? "s" : ""}`,
    status: carnetScore >= 16 ? "great" : carnetScore >= 8 ? "ok" : "low",
    tip: vaccines.length === 0 ? "Ajoutez les vaccins dans le Carnet" : daysSinceWeight > 30 ? "Mettez le poids à jour" : null,
  });

  // 4. DRESSAGE (15pts) — exercices complétés
  const exercises = data.exercises || [];
  const completedThisWeek = exercises.filter(e => e.completed && e.completed_date >= weekStart);
  const exerciseScore = Math.min(Math.round((completedThisWeek.length / 3) * 15), 15);
  pillars.push({
    key: "dressage",
    label: "Dressage",
    score: exerciseScore,
    max: 15,
    detail: `${completedThisWeek.length} exercice${completedThisWeek.length > 1 ? "s" : ""} cette semaine`,
    status: exerciseScore >= 12 ? "great" : exerciseScore >= 6 ? "ok" : "low",
    tip: completedThisWeek.length === 0 ? "Faites un exercice de dressage" : null,
  });

  // 5. NUTRITION / SCAN (15pts) — scans alimentaires
  const scans = data.scans || [];
  const scansThisWeek = scans.filter(s => s.timestamp && s.timestamp.slice(0, 10) >= weekStart);
  const safeScans = scansThisWeek.filter(s => s.verdict === "safe").length;
  const totalScans = scansThisWeek.length;
  const scanScore = totalScans === 0 ? 0 : Math.min(Math.round((safeScans / Math.max(totalScans, 1)) * 10) + Math.min(totalScans * 2, 5), 15);
  pillars.push({
    key: "nutrition",
    label: "Nutrition & Scan",
    score: scanScore,
    max: 15,
    detail: totalScans === 0 ? "Aucun scan cette semaine" : `${totalScans} scan${totalScans > 1 ? "s" : ""} · ${safeScans} sûr${safeScans > 1 ? "s" : ""}`,
    status: scanScore >= 12 ? "great" : scanScore >= 5 ? "ok" : "low",
    tip: totalScans === 0 ? "Scannez un aliment de votre chien" : null,
  });

  // 6. PROFIL COMPLET (10pts) — données de base
  const dog = data.dog || {};
  let profileScore = 0;
  if (dog.photo) profileScore += 2;
  if (dog.breed) profileScore += 2;
  if (dog.birth_date) profileScore += 2;
  if (dog.weight) profileScore += 2;
  if (dog.vet_name) profileScore += 2;
  pillars.push({
    key: "profil",
    label: "Profil complété",
    score: profileScore,
    max: 10,
    detail: `${profileScore * 10}% complété`,
    status: profileScore >= 8 ? "great" : profileScore >= 4 ? "ok" : "low",
    tip: profileScore < 10 ? "Complétez le profil pour un suivi optimal" : null,
  });

  const total = pillars.reduce((acc, p) => acc + p.score, 0);
  return { total, pillars };
}

// ─── Ring SVG ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 88 }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const color =
    score >= 80 ? "#22c55e" :
    score >= 55 ? "#f59e0b" :
    "#ef4444";

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
      <motion.circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        transform="rotate(-90 40 40)"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
      <text x="40" y="37" textAnchor="middle" fontSize="16" fontWeight="900" fill="white">
        {score}
      </text>
      <text x="40" y="50" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.6)" fontWeight="600">
        /100
      </text>
    </svg>
  );
}

// ─── Pillar Bar ───────────────────────────────────────────────────────────────
function PillarRow({ pillar, delay }) {
  const pct = Math.round((pillar.score / pillar.max) * 100);
  const barColor =
    pillar.status === "great" ? "bg-green-400" :
    pillar.status === "ok" ? "bg-amber-400" :
    "bg-red-400";

  const StatusIcon =
    pillar.status === "great" ? CheckCircle2 :
    pillar.status === "ok" ? AlertCircle : Circle;
  const iconColor =
    pillar.status === "great" ? "text-green-500" :
    pillar.status === "ok" ? "text-amber-500" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StatusIcon className={`w-3.5 h-3.5 ${iconColor}`} />
          <span className="text-xs font-semibold text-slate-700">{pillar.label}</span>
        </div>
        <span className="text-xs font-bold text-slate-500">{pillar.score}/{pillar.max}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
        />
      </div>
      {pillar.tip && (
        <p className="text-[10px] text-amber-600 font-medium">↗ {pillar.tip}</p>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HealthScore({ dog, streak, checkins, records, exercises, scans, dailyLogs }) {
  const [showDetail, setShowDetail] = useState(false);
  const [scoreData, setScoreData] = useState(null);

  useEffect(() => {
    if (!dog) return;
    const data = { dog, streak, checkins: checkins || [], records: records || [], exercises: exercises || [], scans: scans || [], dailyLogs: dailyLogs || [] };
    setScoreData(calcScore(data));
  }, [dog, streak, checkins, records, exercises, scans, dailyLogs]);

  if (!scoreData) return null;

  const { total, pillars } = scoreData;
  const label = total >= 80 ? "Excellent" : total >= 60 ? "Bien" : total >= 40 ? "À améliorer" : "Attention";
  const labelColor = total >= 80 ? "text-green-300" : total >= 60 ? "text-amber-300" : "text-red-300";

  const tips = pillars.filter(p => p.tip).slice(0, 2);

  return (
    <>
      {/* Inline widget in HeroHeader — compact ring + label */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
        onClick={() => setShowDetail(true)}
        className="flex flex-col items-center gap-0.5 relative"
      >
        <ScoreRing score={total} size={80} />
        <span className={`text-[10px] font-black uppercase tracking-wide ${labelColor}`}>{label}</span>
      </motion.button>

      {/* Detail modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="bg-white rounded-t-3xl w-full max-w-md pb-10 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sticky top-0 bg-white pt-4 pb-3 px-5 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-4" />
              <div className="flex items-center gap-2 mt-3">
                <Heart className="w-4 h-4 text-rose-500" />
                <h2 className="text-base font-black text-slate-900">Score Santé de {dog?.name}</h2>
              </div>
              <button onClick={() => setShowDetail(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mt-3">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="px-5 pt-5 space-y-5">
              {/* Score global */}
              <div className="flex items-center gap-4 bg-gradient-to-br from-[#0f4c3a] to-[#2d9f82] rounded-2xl p-5">
                <ScoreRing score={total} size={88} />
                <div className="flex-1">
                  <p className={`text-2xl font-black ${labelColor}`}>{label}</p>
                  <p className="text-white/70 text-xs mt-1">Score calculé sur 6 piliers de bien-être</p>
                  {tips.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {tips.map((t, i) => (
                        <p key={i} className="text-[11px] text-white/80">→ {t.tip}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pillars */}
              <div className="space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Détail par pilier</p>
                {pillars.map((p, i) => (
                  <PillarRow key={p.key} pillar={p} delay={i * 0.07} />
                ))}
              </div>

              {/* How it's calculated */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600">Comment est calculé ce score ?</p>
                </div>
                <div className="space-y-1.5">
                  {pillars.map(p => (
                    <div key={p.key} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{p.label}</span>
                      <span className="text-slate-400 font-medium">{p.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-300 pb-2">
                Le score se recalcule en temps réel à chaque action dans l'app
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}