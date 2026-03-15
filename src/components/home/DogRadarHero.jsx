/**
 * DogRadarHero — CompactHeader premium mobile-first
 * Greeting + dog card compact + 4 stats en row horizontale
 * Remplace l'ancien hero plein écran (gradient sombre + arcs Apple Watch)
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Flame, UserCircle, Dumbbell, ScanLine, Heart } from "lucide-react";
import { PawMascotInline } from "../PawMascot";
import { computeHealthScore } from "@/utils/healthStatus";

// Calcule les 4 scores à partir des données réelles
// Chaque arc retourne hasData + hint pour transparence
function computeArcs({ checkins = [], streak, records = [], exercises = [], scans = [], dog = null, dailyLogs = [] }) {
  const recent = checkins.slice(-7);

  // 1. Santé — unified via computeHealthScore (WSAVA-weighted: vaccines 40 + weight 20 + vet 25 + activity 15)
  const health = computeHealthScore(records, dog, dailyLogs);
  const healthData = (records || []).length > 0 || (dailyLogs || []).length > 0;
  const healthHint = health >= 75 ? "Bon état" : health >= 50 ? "À surveiller" : health > 0 ? "À améliorer" : "Pas de données";

  // 2. Activité (streak)
  const streakDays = streak?.current_streak || 0;
  const activity = streakDays > 0
    ? Math.min(100, Math.round((streakDays / 14) * 100))
    : 0;
  const activityData = streakDays > 0;
  const activityHint = activityData ? `${streakDays}j actif${streakDays > 1 ? "s" : ""}` : "Pas de données";

  // 3. Dressage (exercices complétés sur 10 exercices au total — synced with Training.jsx EXERCISES[])
  const TOTAL_EXERCISES = 10;
  const completedEx = exercises.filter(e => e.completed).length;
  const training = completedEx > 0
    ? Math.min(100, Math.round((completedEx / TOTAL_EXERCISES) * 100))
    : 0;
  const trainingData = completedEx > 0;
  const trainingHint = trainingData ? `${completedEx}/${TOTAL_EXERCISES} faits` : "Aucun exercice";

  // 4. Alimentation (scans + appétit)
  let nutrition = 0;
  let nutritionData = false;
  let nutritionHint = "Aucun scan";

  if (scans.length > 0) {
    nutritionData = true;
    const safe = scans.filter(s => s.verdict === "safe").length;
    nutrition = Math.min(100, Math.round((safe / scans.length) * 80 + 20));
    nutritionHint = `${scans.length} scan${scans.length > 1 ? "s" : ""}`;
  }
  if (recent.length > 0 && nutritionData) {
    const avgA = recent.reduce((s, c) => s + (c.appetite || 2), 0) / recent.length;
    nutrition = Math.min(100, Math.round(nutrition * 0.6 + ((avgA - 1) / 2) * 40));
  }

  return [
    { key: "health",    label: "Santé",     score: health,    hasData: healthData,    hint: healthHint,    color: "#2d9f82", Icon: Heart,     page: "Sante" },
    { key: "activity",  label: "Activité",  score: activity,  hasData: activityData,  hint: activityHint,  color: "#3b82f6", Icon: Flame,     page: "Activite" },
    { key: "training",  label: "Dressage",  score: training,  hasData: trainingData,  hint: trainingHint,  color: "#6366f1", Icon: Dumbbell,  page: "Activite", tab: "dressage" },
    { key: "nutrition", label: "Nutrition", score: nutrition, hasData: nutritionData, hint: nutritionHint, color: "#059669", Icon: ScanLine,  page: "Nutri" },
  ];
}

export default function DogRadarHero({ user, dog, streak, checkins = [], records = [], exercises = [], scans = [], dailyLogs = [] }) {
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(" ")[0] || "toi";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const arcs = useMemo(() => computeArcs({ checkins, streak, records: records || [], exercises: exercises || [], scans: scans || [], dog, dailyLogs: dailyLogs || [] }), [checkins, streak, records, exercises, scans, dog, dailyLogs]);

  const avgScore = useMemo(() => {
    const withData = arcs.filter(a => a.hasData);
    if (withData.length === 0) return 0;
    return Math.round(withData.reduce((s, a) => s + a.score, 0) / withData.length);
  }, [arcs]);

  return (
    <div className="px-4 pt-3 pb-3 bg-background border-b border-border/10">
      {/* Ligne 1: Greeting + icones droite */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{greeting}</p>
          <p className="text-lg font-bold text-foreground">{firstName}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Avatar profil */}
          <Link to={createPageUrl("Profile")} className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
            <UserCircle className="w-5 h-5 text-primary" />
          </Link>
        </div>
      </div>

      {/* Ligne 2: Dog card compacte */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-3"
      >
        {/* Photo ronde petite 48px — cliquable → DogProfile */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate(createPageUrl("DogProfile"))}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(createPageUrl("DogProfile")); }}
          className="flex-shrink-0 cursor-pointer"
        >
          {dog?.photo ? (
            <img
              src={dog.photo}
              alt={dog?.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <PawMascotInline mood="curious" size="sm" />
            </div>
          )}
        </div>

        {/* Infos chien */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm leading-tight truncate">{dog?.name || "Mon chien"}</p>
          {dog?.breed && (
            <p className="text-xs text-muted-foreground truncate">
              {dog.breed}{dog.weight ? ` · ${dog.weight} kg` : ""}
            </p>
          )}
          {/* Status dynamique basé sur score moyen */}
          <p
            className="text-xs font-semibold mt-0.5"
            style={{ color: avgScore >= 75 ? "#2d9f82" : avgScore >= 50 ? "#d97706" : avgScore > 0 ? "#ef4444" : "#94a3b8" }}
          >
            {avgScore >= 75
              ? "En forme"
              : avgScore >= 50
                ? "À surveiller"
                : avgScore > 0
                  ? "Attention requise"
                  : "Fais un check-in"}
          </p>
        </div>

        {/* Mini cercle score global — cliquable → Dashboard */}
        <Link to={createPageUrl("Dashboard")} className="flex-shrink-0 w-11 h-11 relative" aria-label="Voir le tableau de bord">
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <motion.circle
              cx="22" cy="22" r="18" fill="none" stroke="#2d9f82" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 18}
              initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - avgScore / 100) }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-foreground">
            {avgScore > 0 ? `${avgScore}%` : "—"}
          </span>
        </Link>
      </motion.div>

      {/* Ligne 3: Stats row horizontale — 4 stats avec mini barres animées */}
      <div className="flex gap-2">
        {arcs.map((arc, i) => {
          const Icon = arc.Icon;
          return (
            <motion.button
              key={arc.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(createPageUrl(arc.page) + (arc.tab ? `?tab=${arc.tab}` : ""))}
              className="flex-1 flex flex-col items-center gap-1 bg-white rounded-xl p-2 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
            >
              <Icon className="w-3.5 h-3.5" style={{ color: arc.color }} />
              <span className="text-[10px] font-semibold text-muted-foreground">{arc.label}</span>
              <span className="text-xs font-black" style={{ color: arc.hasData ? arc.color : "#94a3b8" }}>
                {arc.hasData ? `${arc.score}%` : "—"}
              </span>
              {/* Mini barre de progression */}
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: arc.color }}
                  initial={{ width: 0 }}
                  animate={{ width: arc.hasData ? `${arc.score}%` : "0%" }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
