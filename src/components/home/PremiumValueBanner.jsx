import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Crown, ChevronRight, Star } from "lucide-react";

export default function PremiumValueBanner({ streak, checkins }) {
  // Only show to active free users: at least 3 check-ins total
  if (!checkins || checkins.length < 3) return null;

  const currentStreak = streak?.current_streak || 0;

  const getMessage = () => {
    if (currentStreak >= 7) return `${currentStreak} jours de suivi — tu es régulier ! Passe Premium pour aller encore plus loin.`;
    if (checkins.length >= 7) return "Tu utilises PawCoach régulièrement. Débloque toutes les fonctionnalités.";
    return "Continue sur ta lancée ! Premium débloque le chat illimité et bien plus.";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-5"
    >
      <Link to={createPageUrl("Premium")}>
        <div className="relative overflow-hidden rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm"
          style={{ background: "linear-gradient(135deg, #1a6b52, #2d9f82)" }}>
          {/* Decorative orb */}
          <div className="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-white/10 blur-xl" />

          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-white/70 text-white/70" />
              ))}
              <span className="text-white/60 text-[10px] font-medium ml-0.5">Premium</span>
            </div>
            <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{getMessage()}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}