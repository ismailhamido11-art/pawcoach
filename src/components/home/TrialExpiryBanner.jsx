import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getTrialDaysLeft, isUserOnTrial } from "@/utils/premium";
import { Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

function getDogAgeSegment(dog) {
  if (!dog?.birth_date) return "adult";
  const monthsOld = (Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30.44);
  if (monthsOld < 12) return "puppy";
  if (monthsOld > 84) return "senior";
  return "adult";
}

const SEGMENT_MESSAGES = {
  puppy: {
    title: (name, days) => days === 1
      ? `Dernier jour pour accompagner ${name} dans ses semaines critiques !`
      : `${name} grandit vite — encore ${days} jours de suivi complet`,
    sub: "Les premiers mois sont decisifs pour son education et sa sante",
  },
  adult: {
    title: (name, days) => days === 1
      ? `Dernier jour pour garder l'historique sante de ${name} !`
      : `${name} a deja son suivi en place — encore ${days} jours d'essai`,
    sub: "Un suivi regulier previent les problemes courants",
  },
  senior: {
    title: (name, days) => days === 1
      ? `Dernier jour pour proteger la sante de ${name} !`
      : `${name} merite un suivi attentif — encore ${days} jours d'essai`,
    sub: "Les rappels vaccins et le carnet sante sont essentiels a son age",
  },
};

export default function TrialExpiryBanner({ user, dog }) {
  if (!isUserOnTrial(user)) return null;

  const daysLeft = getTrialDaysLeft(user);
  if (daysLeft > 3 || daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 1;
  const segment = getDogAgeSegment(dog);
  const dogName = dog?.name || "ton chien";
  const msg = SEGMENT_MESSAGES[segment];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-5"
    >
      <Link to={createPageUrl("Premium")}>
        <div
          className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${
            isUrgent
              ? "bg-amber-50 border-amber-300"
              : "bg-amber-50/60 border-amber-200"
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isUrgent ? "bg-amber-200" : "bg-amber-100"
          }`}>
            <Clock className={`w-4.5 h-4.5 ${isUrgent ? "text-amber-700" : "text-amber-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold leading-snug ${isUrgent ? "text-amber-800" : "text-amber-700"}`}>
              {msg.title(dogName, daysLeft)}
            </p>
            <p className="text-[10px] text-amber-600/80 mt-0.5">
              {msg.sub}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
