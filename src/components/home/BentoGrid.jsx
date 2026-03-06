import { motion } from "framer-motion";
import { Heart, ScanLine, Dumbbell, MessageCircle } from "lucide-react";
import { isUserPremium } from "@/utils/premium";
import FeatureTile from "./FeatureTile";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function computeTileData({ records, exercises, scans, user }) {
  const today = getTodayString();
  const isPremium = isUserPremium(user);

  // Sante: next health event or "Tout va bien"
  const vaccines = (records || []).filter(r => r.type === "vaccine" && r.next_date);
  const overdueVaccine = vaccines.find(v => v.next_date < today);
  const soonVaccine = vaccines.find(v => v.next_date >= today);
  let santeData, santeSub;
  if (overdueVaccine) {
    santeData = "Vaccin en retard";
    santeSub = overdueVaccine.title || "Rappel a faire";
  } else if (soonVaccine) {
    santeData = "Prochain RDV";
    santeSub = soonVaccine.next_date ? new Date(soonVaccine.next_date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
  } else {
    santeData = "Tout va bien";
    santeSub = "Aucune alerte";
  }

  // Nutrition: last scan
  const sortedScans = (scans || []).sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
  const lastScan = sortedScans[0];
  let nutriData, nutriSub;
  if (lastScan) {
    const verdict = lastScan.verdict === "safe" ? "OK" : lastScan.verdict === "dangerous" ? "Danger" : "Prudence";
    nutriData = `${lastScan.food_name || "Aliment"} : ${verdict}`;
    nutriSub = `${scans.length} scan${scans.length > 1 ? "s" : ""} au total`;
  } else {
    nutriData = "Scanner un aliment";
    nutriSub = "Verifie ce que mange ton chien";
  }

  // Training: exercises completed
  const completed = (exercises || []).filter(e => e.completed);
  const total = (exercises || []).length;
  let trainData, trainSub;
  if (total > 0) {
    trainData = `${completed.length} exercice${completed.length > 1 ? "s" : ""} fait${completed.length > 1 ? "s" : ""}`;
    trainSub = `${total - completed.length} a essayer`;
  } else {
    trainData = "Commencer le dressage";
    trainSub = "Exercices personnalises";
  }

  // Chat IA
  const chatData = "Pose une question";
  const chatSub = isPremium ? "Chat sante illimite" : "3 messages / jour";

  return [
    { icon: Heart, iconColor: "#2d9f82", label: "Sante", dataPoint: santeData, subtitle: santeSub, page: "Notebook" },
    { icon: ScanLine, iconColor: "#059669", label: "Nutrition", dataPoint: nutriData, subtitle: nutriSub, page: "Nutrition" },
    { icon: Dumbbell, iconColor: "#6366f1", label: "Dressage", dataPoint: trainData, subtitle: trainSub, page: "Training" },
    { icon: MessageCircle, iconColor: "#2d9f82", label: "Chat IA", dataPoint: chatData, subtitle: chatSub, page: "Chat" },
  ];
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function BentoGrid({ records, exercises, scans, user }) {
  const tiles = computeTileData({ records, exercises, scans, user });

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
