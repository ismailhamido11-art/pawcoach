import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scale, Syringe, Dumbbell, Plus } from "lucide-react";
import { MOOD_OPTIONS } from "./CheckinCard";

function getMoodLabel(mood) {
  const opt = MOOD_OPTIONS.find(o => o.value === mood);
  return opt ? { label: opt.label, color: opt.color } : null;
}

function getNextVaccine(records) {
  if (!records?.length) return null;
  const vaccines = records
    .filter(r => r.type === "vaccine" && r.next_date)
    .sort((a, b) => a.next_date.localeCompare(b.next_date));
  return vaccines[0] || null;
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function getLatestWeight(records) {
  if (!records?.length) return null;
  const weights = records
    .filter(r => r.type === "weight" && r.value)
    .sort((a, b) => b.date.localeCompare(a.date));
  return weights[0] || null;
}

function getTodayExercises(exercises) {
  if (!exercises?.length) return 0;
  return exercises.filter(e => e.completed && e.completed_date === getTodayString()).length;
}

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function MetricCard({ children, to, delay = 0 }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100, damping: 16 }}
      className="bg-white rounded-2xl border border-border/30 shadow-sm p-4 flex flex-col gap-1.5 min-h-[100px] tap-scale"
    >
      {children}
    </motion.div>
  );
  if (to) return <Link to={createPageUrl(to)}>{inner}</Link>;
  return inner;
}

function EmptyState({ label, to }) {
  return (
    <Link to={createPageUrl(to)}>
      <div className="flex items-center gap-1.5 mt-auto">
        <Plus className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-primary font-semibold">{label}</span>
      </div>
    </Link>
  );
}

export default function DailySnapshot({ todayCheckin, records, exercises, dog }) {
  const moodInfo = todayCheckin ? getMoodLabel(todayCheckin.mood) : null;
  const weightRecord = getLatestWeight(records);
  const nextVaccine = getNextVaccine(records);
  const daysUntilVaccine = nextVaccine ? getDaysUntil(nextVaccine.next_date) : null;
  const todayExerciseCount = getTodayExercises(exercises);

  return (
    <div className="mx-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
        Snapshot du jour
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Carte 1 : Poids */}
        <MetricCard to="Notebook" delay={0.05}>
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Poids</span>
          </div>
          {weightRecord ? (
            <>
              <p className="text-3xl font-black text-foreground leading-none mt-1">
                {weightRecord.value}
                <span className="text-sm font-semibold text-muted-foreground ml-1">kg</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(weightRecord.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </p>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-xs text-muted-foreground">Aucune mesure</p>
              <EmptyState label="Ajouter" to="Notebook" />
            </div>
          )}
        </MetricCard>

        {/* Carte 2 : Humeur du chien */}
        <MetricCard delay={0.1}>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: moodInfo?.color || "#e2e8f0" }} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Humeur</span>
          </div>
          {moodInfo ? (
            <>
              <p className="text-2xl font-black leading-none mt-1" style={{ color: moodInfo.color }}>
                {moodInfo.label}
              </p>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4].map(v => (
                  <div
                    key={v}
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: v <= todayCheckin.mood ? moodInfo.color : "#e2e8f0" }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-xs text-muted-foreground">Check-in manquant</p>
              <div className="flex items-center gap-1.5 mt-auto">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-primary font-semibold">Faire le check-in</span>
              </div>
            </div>
          )}
        </MetricCard>

        {/* Carte 3 : Entraînement */}
        <MetricCard to="Training" delay={0.15}>
          <div className="flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dressage</span>
          </div>
          {todayExerciseCount > 0 ? (
            <>
              <p className="text-3xl font-black text-foreground leading-none mt-1">
                {todayExerciseCount}
                <span className="text-sm font-semibold text-muted-foreground ml-1">ex.</span>
              </p>
              <p className="text-[10px] text-muted-foreground">aujourd'hui</p>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-xs text-muted-foreground">Aucun exercice</p>
              <EmptyState label="S'entraîner" to="Training" />
            </div>
          )}
        </MetricCard>

        {/* Carte 4 : Prochain vaccin */}
        <MetricCard to="Notebook" delay={0.2}>
          <div className="flex items-center gap-1.5">
            <Syringe className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vaccin</span>
          </div>
          {nextVaccine ? (
            <>
              <p className="text-xl font-black text-foreground leading-none mt-1 truncate">
                {nextVaccine.title}
              </p>
              <p
                className="text-[11px] font-semibold mt-0.5"
                style={{ color: daysUntilVaccine <= 30 ? "#f43f5e" : daysUntilVaccine <= 90 ? "#f59e0b" : "#10b981" }}
              >
                {daysUntilVaccine === 0
                  ? "Aujourd'hui !"
                  : daysUntilVaccine < 0
                  ? `Il y a ${Math.abs(daysUntilVaccine)}j`
                  : `Dans ${daysUntilVaccine}j`}
              </p>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-xs text-muted-foreground">Aucun rappel</p>
              <EmptyState label="Ajouter" to="Notebook" />
            </div>
          )}
        </MetricCard>
      </div>
    </div>
  );
}