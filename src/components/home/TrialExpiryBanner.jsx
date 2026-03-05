import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getTrialDaysLeft, isUserOnTrial } from "@/utils/premium";
import { Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function TrialExpiryBanner({ user }) {
  if (!isUserOnTrial(user)) return null;

  const daysLeft = getTrialDaysLeft(user);
  if (daysLeft > 3 || daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 1;

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
              {daysLeft === 1
                ? "Dernier jour de ton essai Premium !"
                : `Ton essai Premium expire dans ${daysLeft} jours`}
            </p>
            <p className="text-[10px] text-amber-600/80 mt-0.5">
              Abonne-toi pour garder toutes les fonctionnalités
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
