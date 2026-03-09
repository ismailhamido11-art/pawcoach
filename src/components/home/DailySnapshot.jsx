import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Dumbbell, Syringe, Scale, Smile, Footprints } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { VACCINE_REFERENCE } from "@/utils/healthStatus";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const isValidWeight = (v) => typeof v === "number" && v > 0 && v <= 200;

function WeightCard({ records = [], dailyLogs = [] }) {
  // Merge HealthRecord weights + DailyLog weights, pick most recent (filter absurd values)
  const fromRecords = records.filter(r => r.type === "weight" && isValidWeight(r.value)).map(r => ({ date: r.date, value: r.value }));
  const fromLogs = (dailyLogs || []).filter(l => isValidWeight(l.weight_kg)).map(l => ({ date: l.date, value: l.weight_kg }));
  const weightRecords = [...fromRecords, ...fromLogs].sort((a, b) => b.date.localeCompare(a.date));

  const last = weightRecords[0];
  const prev = weightRecords[1];
  const trend = last && prev
    ? last.value > prev.value ? "up" : last.value < prev.value ? "down" : "stable"
    : null;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#d97706" : trend === "down" ? "#d97706" : "#94a3b8";

  return (
    <Link to={createPageUrl("Sante") + "?tab=weight"} className="block">
      <div className="bg-white rounded-2xl p-4 border border-border/30 shadow-sm h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
            <Scale className="w-3.5 h-3.5 text-blue-500" />
          </div>
          {trend && <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />}
        </div>
        {last ? (
          <>
            <p className="text-2xl font-black text-foreground leading-none">{last.value}<span className="text-sm font-medium text-muted-foreground ml-1">kg</span></p>
            <p className="text-[11px] text-muted-foreground mt-1">Poids</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-muted-foreground">—</p>
            <p className="text-[11px] text-muted-foreground mt-1">Poids non enregistré</p>
          </>
        )}
      </div>
    </Link>
  );
}

function MoodCard({ checkins = [] }) {
  const weekStart = getWeekStart();
  const weekCheckins = checkins.filter(c => c.date >= weekStart && c.mood);
  const avg = weekCheckins.length > 0
    ? (weekCheckins.reduce((s, c) => s + c.mood, 0) / weekCheckins.length).toFixed(1)
    : null;

  const MOOD_LABELS = { 1: "Triste", 2: "Bof", 3: "Bien", 4: "Super" };
  const color = avg >= 3.5 ? "#10b981" : avg >= 2.5 ? "#d97706" : avg ? "#ef4444" : "#94a3b8";

  return (
    <Link to={createPageUrl("Dashboard")} className="block">
      <div className="bg-white rounded-2xl p-4 border border-border/30 shadow-sm h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center">
            <Smile className="w-3.5 h-3.5 text-rose-500" />
          </div>
          {weekCheckins.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{weekCheckins.length}j</span>
          )}
        </div>
        {avg ? (
          <>
            <p className="text-2xl font-black leading-none" style={{ color }}>{avg}<span className="text-sm font-medium text-muted-foreground ml-0.5">/4</span></p>
            <p className="text-[11px] text-muted-foreground mt-1">Humeur semaine</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-muted-foreground">—</p>
            <p className="text-[11px] text-muted-foreground mt-1">Pas de check-ins</p>
          </>
        )}
      </div>
    </Link>
  );
}

function TrainingCard({ exercises = [] }) {
  const completed = exercises.filter(e => e.completed).length;
  const total = Math.max(exercises.length, 10);
  const pct = Math.round((completed / total) * 100);
  const color = pct >= 70 ? "#10b981" : pct >= 30 ? "#d97706" : "#3b82f6";

  return (
    <Link to={createPageUrl("Training")} className="block">
      <div className="bg-white rounded-2xl p-4 border border-border/30 shadow-sm h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-violet-500" />
          </div>
        </div>
        <p className="text-2xl font-black leading-none" style={{ color }}>
          {completed}<span className="text-sm font-medium text-muted-foreground">/{total}</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">Exercices</p>
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>
    </Link>
  );
}

function WalkCard({ dailyLogs }) {
  const today = getTodayString();
  const todayLog = (dailyLogs || []).find(l => l.date === today);
  const mins = todayLog?.walk_minutes;

  return (
    <Link to={createPageUrl("Sante")} className="block">
      <div className="bg-white rounded-2xl p-4 border border-border/30 shadow-sm h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Footprints className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
        {mins ? (
          <>
            <p className="text-2xl font-black text-emerald-600 leading-none">{mins}<span className="text-sm font-medium text-muted-foreground ml-1">min</span></p>
            <p className="text-[11px] text-muted-foreground mt-1">Balade aujourd'hui</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-muted-foreground">--</p>
            <p className="text-[11px] text-muted-foreground mt-1">Balade non loggee</p>
          </>
        )}
      </div>
    </Link>
  );
}

function VaccineCard({ records = [] }) {
  const today = getTodayString();
  const allVaccines = records.filter(r => r.type === "vaccine");
  const upcoming = allVaccines
    .filter(r => r.next_date && r.next_date >= today)
    .sort((a, b) => a.next_date.localeCompare(b.next_date));

  const next = upcoming[0];
  const daysUntil = next
    ? Math.ceil((new Date(next.next_date + "T12:00:00") - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const urgent = daysUntil !== null && daysUntil <= 30;
  const hasAnyVaccine = allVaccines.length > 0;
  const vaccineKey = next ? Object.entries(VACCINE_REFERENCE).find(([_, ref]) => ref.name === next.title || ref.shortName === next.title)?.[0] : null;

  return (
    <Link to={createPageUrl("Sante") + `?tab=vaccine${vaccineKey ? `&vaccineKey=${vaccineKey}` : ""}`} className="block">
      <div className="bg-white rounded-2xl p-4 border border-border/30 shadow-sm h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Syringe className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          {urgent && <span className="text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">Bientot</span>}
        </div>
        {next ? (
          <>
            <p className="text-2xl font-black leading-none" style={{ color: urgent ? "#d97706" : "#10b981" }}>
              {daysUntil}<span className="text-sm font-medium text-muted-foreground ml-1">j</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">{next.title}</p>
          </>
        ) : hasAnyVaccine ? (
          <>
            <p className="text-sm font-black text-emerald-500">OK</p>
            <p className="text-[11px] text-muted-foreground mt-1">Vaccins à jour</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-muted-foreground">--</p>
            <p className="text-[11px] text-muted-foreground mt-1">Aucun vaccin</p>
          </>
        )}
      </div>
    </Link>
  );
}

const stagger = { show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } } };

export default function DailySnapshot({ records = [], exercises = [], checkins = [], dailyLogs = [] }) {
  return (
    <div className="mx-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
        Snapshot du jour
      </p>
      <motion.div className="grid grid-cols-2 gap-3" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={item}><WeightCard records={records} dailyLogs={dailyLogs} /></motion.div>
        <motion.div variants={item}><WalkCard dailyLogs={dailyLogs} /></motion.div>
        <motion.div variants={item}><MoodCard checkins={checkins} /></motion.div>
        <motion.div variants={item}><VaccineCard records={records} /></motion.div>
      </motion.div>
    </div>
  );
}