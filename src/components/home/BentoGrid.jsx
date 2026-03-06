import { motion } from "framer-motion";
import { Heart, Utensils, Dumbbell, MessageCircle } from "lucide-react";
import { isUserPremium } from "@/utils/premium";
import FeatureTile from "./FeatureTile";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
  }
  return days;
}

function computeTileData({ records, exercises, scans, user, checkins, dailyLogs }) {
  const today = getTodayString();
  const isPremium = isUserPremium(user);
  const last7 = getLast7Days();

  // --- SANTE ---
  const vaccines = (records || []).filter(r => r.type === "vaccine" && r.next_date);
  const overdueCount = vaccines.filter(v => v.next_date < today).length;
  const totalRecords = (records || []).length;

  let santeData, santeSub, santeBadge;
  if (overdueCount > 0) {
    santeData = `${overdueCount}`;
    santeSub = `vaccin${overdueCount > 1 ? "s" : ""} en retard`;
    santeBadge = { text: "Retard", color: "#ef4444" };
  } else if (totalRecords > 0) {
    santeData = `${totalRecords}`;
    santeSub = `suivi${totalRecords > 1 ? "s" : ""} actif${totalRecords > 1 ? "s" : ""} · tout va bien`;
    santeBadge = { text: "A jour", color: "#10b981" };
  } else {
    santeData = "0";
    santeSub = "Ajoute un suivi sante";
    santeBadge = null;
  }

  // Week bars: mood from checkins (1-4 mapped to 0.25-1)
  const santeWeekBars = last7.map(day => {
    const c = (checkins || []).find(ch => ch.date === day);
    return c ? (c.mood || 2) / 4 : 0;
  });

  // --- NUTRITION ---
  const sortedScans = (scans || []).sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
  const safeCount = sortedScans.filter(s => s.verdict === "safe").length;

  let nutriData, nutriSub, nutriBadge;
  if (sortedScans.length > 0) {
    nutriData = `${sortedScans.length}`;
    nutriSub = `scan${sortedScans.length > 1 ? "s" : ""} · ${safeCount} OK`;
    const ratio = safeCount / sortedScans.length;
    nutriBadge = ratio >= 0.8 ? { text: "Bon", color: "#10b981" } : ratio >= 0.5 ? { text: "Moyen", color: "#d97706" } : { text: "Prudence", color: "#ef4444" };
  } else {
    nutriData = "0";
    nutriSub = "Scanne un aliment";
    nutriBadge = null;
  }

  // Week bars: scans per day
  const nutriWeekBars = last7.map(day => {
    const count = sortedScans.filter(s => (s.created_date || "").startsWith(day)).length;
    return Math.min(1, count / 2);
  });

  // --- DRESSAGE ---
  const TOTAL_EXERCISES = 8;
  const completed = (exercises || []).filter(e => e.completed);

  let trainData, trainSub, trainBadge;
  if (completed.length > 0) {
    trainData = `${completed.length}/${TOTAL_EXERCISES}`;
    trainSub = `exercice${completed.length > 1 ? "s" : ""} complete${completed.length > 1 ? "s" : ""}`;
    const ratio = completed.length / TOTAL_EXERCISES;
    trainBadge = ratio >= 0.8 ? { text: "Bravo", color: "#6366f1" } : ratio >= 0.4 ? { text: "En cours", color: "#d97706" } : { text: "A faire", color: "#6b7280" };
  } else {
    trainData = "0";
    trainSub = "Commence le dressage";
    trainBadge = null;
  }

  // Week bars: exercise minutes from dailyLogs
  const trainWeekBars = last7.map(day => {
    const log = (dailyLogs || []).find(l => l.date === day);
    if (log?.exercise_minutes) return Math.min(1, log.exercise_minutes / 30);
    return 0;
  });

  // --- CHAT IA ---
  let chatData, chatSub, chatBadge;
  if (isPremium) {
    chatData = "Illimite";
    chatSub = "Chat sante personnalise";
    chatBadge = { text: "Pro", color: "#2d9f82" };
  } else {
    chatData = "3/jour";
    chatSub = "Messages gratuits";
    chatBadge = { text: "Free", color: "#6b7280" };
  }

  return [
    { icon: Heart, iconColor: "#2d9f82", label: "Sante", dataPoint: santeData, subtitle: santeSub, badge: santeBadge, weekBars: santeWeekBars, page: "Sante" },
    { icon: Utensils, iconColor: "#059669", label: "Nutrition", dataPoint: nutriData, subtitle: nutriSub, badge: nutriBadge, weekBars: nutriWeekBars, page: "Nutri" },
    { icon: Dumbbell, iconColor: "#6366f1", label: "Dressage", dataPoint: trainData, subtitle: trainSub, badge: trainBadge, weekBars: trainWeekBars, page: "Activite", tab: "dressage" },
    { icon: MessageCircle, iconColor: "#8b5cf6", label: "Chat IA", dataPoint: chatData, subtitle: chatSub, badge: chatBadge, weekBars: null, page: "Chat" },
  ];
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function BentoGrid({ records, exercises, scans, user, checkins, dailyLogs }) {
  const tiles = computeTileData({ records, exercises, scans, user, checkins, dailyLogs });

  return (
    <div className="px-4">
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {tiles.map((tile) => (
          <FeatureTile key={tile.label} {...tile} />
        ))}
      </motion.div>
    </div>
  );
}
