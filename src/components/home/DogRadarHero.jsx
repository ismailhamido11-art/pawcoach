/**
 * DogRadarHero — Carte d'identité vivante du chien
 * Photo centrale + 4 arcs de données animés (style Apple Watch)
 * Chaque arc = une section de l'app, nourri par les vraies données
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Flame, UserCircle, Dumbbell, ScanLine, Heart } from "lucide-react";
import { useDogAvatarState } from "../dogtwin/useDogAvatarState";
import Illustration from "../illustrations/Illustration";

// Calcule les 4 scores à partir des données réelles
// Chaque arc retourne hasData + hint pour transparence
function computeArcs({ checkins = [], streak, records = [], exercises = [], scans = [] }) {
  const recent = checkins.slice(-7);

  // 1. Santé (checkins humeur + énergie + vaccins)
  let health = 0;
  let healthData = false;
  let healthHint = "Pas de données";
  const hasVaccine = records.some(r => r.type === "vaccine" && r.date && (Date.now() - new Date(r.date).getTime()) / 86400000 < 365);

  if (recent.length > 0) {
    healthData = true;
    const avgM = recent.reduce((s, c) => s + (c.mood || 2), 0) / recent.length;
    const avgE = recent.reduce((s, c) => s + (c.energy || 2), 0) / recent.length;
    health = Math.round(((avgM - 1) / 3) * 50 + ((avgE - 1) / 2) * 30 + 20);
    if (hasVaccine) health = Math.min(100, health + 10);
    healthHint = `${recent.length} check-in${recent.length > 1 ? "s" : ""}`;
  } else if (hasVaccine) {
    healthData = true;
    health = 60;
    healthHint = "Vaccins à jour";
  }

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
    { key: "activity",  label: "Activité",  score: activity,  hasData: activityData,  hint: activityHint,  color: "#d97706", Icon: Flame,     page: "Activite" },
    { key: "training",  label: "Dressage",  score: training,  hasData: trainingData,  hint: trainingHint,  color: "#6366f1", Icon: Dumbbell,  page: "Activite", tab: "dressage" },
    { key: "nutrition", label: "Nutrition", score: nutrition, hasData: nutritionData, hint: nutritionHint, color: "#059669", Icon: ScanLine,  page: "Nutri" },
  ];
}

// SVG arc unique
function Arc({ index, total: _total, score, color, size }) {
  const cx = size / 2;
  const cy = size / 2;
  const gap = 7;
  const ringWidth = 5;
  // Du plus grand (extérieur) au plus petit (intérieur)
  const r = cx - 10 - index * (ringWidth + gap);
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  return (
    <g>
      {/* Piste de fond */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={ringWidth} strokeOpacity={0.12} />
      {/* Arc animé */}
      <motion.circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={ringWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - dash }}
        transition={{ duration: 1.2, delay: 0.2 + index * 0.15, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 6px ${color}aa) drop-shadow(0 0 12px ${color}44)` }}
      />
    </g>
  );
}

const moodEmoji = { excited: "🤩", happy: "😊", neutral: "😌", tired: "😴" };
const moodText  = { excited: "Très heureux !", happy: "En forme", neutral: "Calme", tired: "Fatigué" };

export default function DogRadarHero({ user, dog, streak, checkins = [], records = [], exercises = [], scans = [], dailyLogs: _dailyLogs = [] }) {
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(" ")[0] || "toi";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const { mood } = useDogAvatarState({ checkins, streak, records: records || [], scans: scans || [] });
  const arcs = useMemo(() => computeArcs({ checkins, streak, records: records || [], exercises: exercises || [], scans: scans || [] }), [checkins, streak, records, exercises, scans]);

  const SIZE = 160;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0f4c3a] via-[#1a6b52] to-background">
      {/* Fond décoratif */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />

      {/* Floating luminous orbs — rendent le hero vivant */}
      {[
        { size: 10, left: "12%", bottom: "20%", delay: 0, duration: 3.5 },
        { size: 14, left: "75%", bottom: "35%", delay: 0.8, duration: 4 },
        { size: 8,  left: "45%", bottom: "60%", delay: 1.6, duration: 3 },
        { size: 18, left: "88%", bottom: "15%", delay: 2.2, duration: 4.5 },
        { size: 6,  left: "30%", bottom: "80%", delay: 0.4, duration: 3.2 },
        { size: 12, left: "60%", bottom: "50%", delay: 1.2, duration: 3.8 },
      ].map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.left,
            bottom: orb.bottom,
            background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(45,159,130,0.15) 60%, transparent 100%)",
          }}
          animate={{
            y: [-5, -25, -5],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      {/* Illustration décorative flottante — ambiance nature */}
      <motion.div
        className="absolute bottom-0 right-0 w-32 h-32 opacity-[0.08] pointer-events-none"
        animate={{ y: [-3, 3, -3], rotate: [-2, 2, -2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Illustration name="qualityTime" className="w-full h-full" alt="" />
      </motion.div>

      <div className="relative z-10 px-5 pt-10 pb-4">
        {/* Top bar — emotional greeting */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">PawCoach</p>
            <p className="text-white text-lg font-bold mt-0.5 tracking-tight">{greeting}, {firstName}</p>
            {dog?.name && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-white/50 text-[11px] mt-0.5"
              >
                {hour < 12
                  ? `Prêt pour une belle journée avec ${dog.name} ?`
                  : hour < 18
                    ? `${dog.name} compte sur toi cet après-midi`
                    : `Bonne soirée avec ${dog.name}`
                }
              </motion.p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={createPageUrl("Profile")}
              className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center"
            >
              <UserCircle className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>

        {/* Centre : Radar + Photo */}
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            {/* SVG des arcs */}
            <svg
              width={SIZE} height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}
            >
              {arcs.map((arc, i) => (
                <Arc key={arc.key} index={i} total={arcs.length} score={arc.score} color={arc.color} size={SIZE} />
              ))}
            </svg>

            {/* Photo du chien au centre */}
            <div
              role="button"
              tabIndex={0}
              aria-label={`Voir le profil de ${dog?.name || "mon chien"}`}
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={() => navigate(createPageUrl("DogProfile"))}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(createPageUrl("DogProfile")); }}
            >
              <div className="relative">
                {/* Warm glow ring — breathing halo behind photo */}
                <motion.div
                  className="absolute inset-[-10px] rounded-full"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: "radial-gradient(circle, rgba(45,159,130,0.35) 0%, rgba(16,185,129,0.15) 40%, transparent 70%)",
                  }}
                />
                {dog?.photo ? (
                  <motion.img
                    src={dog.photo}
                    alt={dog?.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: [1, 1.03, 1],
                    }}
                    transition={{
                      opacity: { duration: 0.5 },
                      scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    }}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/40 shadow-[0_0_30px_rgba(45,159,130,0.25)] relative z-10"
                  />
                ) : (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                    className="w-20 h-20 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(45,159,130,0.2)] relative z-10"
                  >
                    <Illustration name="cautiousDog" className="w-14 h-14 drop-shadow-lg" alt="Mon chien" />
                  </motion.div>
                )}
                {/* Badge humeur */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-2 py-0.5 shadow-lg whitespace-nowrap"
                >
                  <span className="text-xs font-bold text-foreground">{moodEmoji[mood]} {moodText[mood]}</span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Nom + race + contextual summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-5"
          >
            <h1 className="text-2xl font-bold text-white">{dog?.name || "Mon chien"}</h1>
            {dog?.breed && (
              <p className="text-white/50 text-xs mt-0.5">{dog.breed}{dog.weight ? ` · ${dog.weight} kg` : ""}</p>
            )}
            {(() => {
              const withData = arcs.filter(a => a.hasData);
              const name = dog?.name || "Ton chien";
              if (withData.length === 0) {
                return (
                  <p className="text-xs font-medium mt-1.5 text-white/40">Fais un check-in pour activer le suivi</p>
                );
              }
              const avg = Math.round(withData.reduce((s, a) => s + a.score, 0) / withData.length);
              let text, color;
              if (avg >= 75) { text = `${name} est en pleine forme`; color = "#10b981"; }
              else if (avg >= 50) { text = "Quelques points à surveiller"; color = "#d97706"; }
              else { text = "À besoin d'attention"; color = "#ef4444"; }
              return (
                <p className="text-xs font-medium mt-1.5" style={{ color: `${color}99` }}>{text}</p>
              );
            })()}
          </motion.div>

          {/* Légende des arcs */}
          <div className="grid grid-cols-4 gap-3 mt-5 w-full max-w-xs">
            {arcs.map((arc, i) => {
              const Icon = arc.Icon;
              return (
                <motion.button
                  key={arc.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(createPageUrl(arc.page) + (arc.tab ? `?tab=${arc.tab}` : ""))}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: arc.color + "25", border: `1.5px solid ${arc.color}55` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: arc.color }} />
                  </div>
                  <span className="text-white/70 text-[10px] font-semibold">{arc.label}</span>
                  {arc.hasData ? (
                    <span className="font-black text-xs" style={{ color: arc.color }}>{arc.score}%</span>
                  ) : (
                    <span className="font-bold text-xs text-white/40">—</span>
                  )}
                  <span className="text-white/60 text-[8px] leading-tight">{arc.hint}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}