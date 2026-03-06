/**
 * DogRadarHero — Carte d'identité vivante du chien
 * Photo centrale + 4 arcs de données animés (style Apple Watch)
 * Chaque arc = une section de l'app, nourri par les vraies données
 */
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Flame, UserCircle, Dumbbell, ScanLine, Heart } from "lucide-react";
import { useDogAvatarState } from "../dogtwin/useDogAvatarState";

// Calcule les 4 scores à partir des données réelles
function computeArcs({ checkins, streak, records, exercises, scans }) {
  // 1. Santé (checkins humeur + énergie + vaccins)
  let health = 40;
  if (checkins.length > 0) {
    const r = checkins.slice(-7);
    const avgM = r.reduce((s, c) => s + (c.mood || 2), 0) / r.length;
    const avgE = r.reduce((s, c) => s + (c.energy || 2), 0) / r.length;
    health = Math.round(((avgM - 1) / 3) * 50 + ((avgE - 1) / 2) * 30 + 20);
  }
  const hasVaccine = records.some(r => r.type === "vaccine" && r.date && (Date.now() - new Date(r.date).getTime()) / 86400000 < 365);
  if (hasVaccine) health = Math.min(100, health + 10);

  // 2. Activité (streak)
  const activity = streak?.current_streak
    ? Math.min(100, Math.round((streak.current_streak / 14) * 100))
    : 0;

  // 3. Dressage (exercices complétés)
  const training = exercises.length > 0
    ? Math.min(100, Math.round((exercises.filter(e => e.completed).length / Math.max(exercises.length, 1)) * 100))
    : 0;

  // 4. Alimentation (scans récents + appétit)
  let nutrition = 50;
  if (scans.length > 0) {
    const safe = scans.filter(s => s.verdict === "safe").length;
    nutrition = Math.min(100, Math.round((safe / scans.length) * 80 + 20));
  }
  if (checkins.length > 0) {
    const r = checkins.slice(-7);
    const avgA = r.reduce((s, c) => s + (c.appetite || 2), 0) / r.length;
    nutrition = Math.min(100, Math.round(nutrition * 0.6 + ((avgA - 1) / 2) * 40));
  }

  return [
    { key: "health",    label: "Santé",       score: Math.max(10, health),    color: "#2d9f82", Icon: Heart,     page: "Notebook" },
    { key: "activity",  label: "Activité",    score: Math.max(10, activity),  color: "#d97706", Icon: Flame,     page: "Dashboard" },
    { key: "training",  label: "Dressage",    score: Math.max(10, training),  color: "#6366f1", Icon: Dumbbell,  page: "Training" },
    { key: "nutrition", label: "Nutrition",   score: Math.max(10, nutrition), color: "#059669", Icon: ScanLine,  page: "Nutrition" },
  ];
}

// SVG arc unique
function Arc({ index, total, score, color, size }) {
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
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
    </g>
  );
}

const moodEmoji = { excited: "🤩", happy: "😊", neutral: "😌", tired: "😴" };
const moodText  = { excited: "Très heureux !", happy: "En forme", neutral: "Calme", tired: "Fatigué" };

export default function DogRadarHero({ user, dog, streak, checkins, records, exercises, scans, dailyLogs }) {
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(" ")[0] || "toi";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const { mood } = useDogAvatarState({ checkins, streak, records: records || [], scans: scans || [] });
  const arcs = computeArcs({ checkins, streak, records: records || [], exercises: exercises || [], scans: scans || [] });

  const SIZE = 160;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0f4c3a] via-[#1a6b52] to-background">
      {/* Fond décoratif */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />

      <div className="relative z-10 px-5 pt-10 pb-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">PawCoach</p>
            <p className="text-white text-sm font-semibold mt-0.5">{greeting}, {firstName}</p>
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
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={() => navigate(createPageUrl("DogProfile"))}
            >
              <div className="relative">
                {dog?.photo ? (
                  <motion.img
                    src={dog.photo}
                    alt={dog?.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-2xl"
                  />
                ) : (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-20 h-20 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-5xl shadow-xl"
                  >
                    🐶
                  </motion.div>
                )}
                {/* Badge humeur */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-2 py-0.5 shadow-lg whitespace-nowrap"
                >
                  <span className="text-[11px] font-bold text-foreground">{moodEmoji[mood]} {moodText[mood]}</span>
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
              const avg = Math.round(arcs.reduce((s, a) => s + a.score, 0) / arcs.length);
              const name = dog?.name || "Ton chien";
              let text, color;
              if (avg >= 75) { text = `${name} est en pleine forme`; color = "#10b981"; }
              else if (avg >= 50) { text = "Quelques points a surveiller"; color = "#d97706"; }
              else { text = "A besoin d'attention"; color = "#ef4444"; }
              return (
                <p className="text-[11px] font-medium mt-1.5" style={{ color: `${color}99` }}>{text}</p>
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
                  onClick={() => navigate(createPageUrl(arc.page))}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: arc.color + "25", border: `1.5px solid ${arc.color}55` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: arc.color }} />
                  </div>
                  <span className="text-white/60 text-[9px] font-semibold">{arc.label}</span>
                  <span className="font-black text-[11px]" style={{ color: arc.color }}>{arc.score}%</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}