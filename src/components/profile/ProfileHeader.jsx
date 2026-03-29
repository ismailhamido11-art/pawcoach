import { Crown, Star, Medal, Dog } from "lucide-react";
import { getTrialDaysLeft } from "@/utils/premium";

// Aligned with AchievementsSection LEVEL_THRESHOLDS
const LEVEL_THRESHOLDS = [
  { min: 0,    label: "Chiot",     icon: Dog,   color: "bg-emerald-100 text-emerald-500" },
  { min: 100,  label: "Compagnon", icon: Dog,   color: "bg-emerald-100 text-emerald-600" },
  { min: 300,  label: "Sportif",   icon: Star,  color: "bg-blue-100 text-blue-600" },
  { min: 700,  label: "Champion",  icon: Medal, color: "bg-amber-100 text-amber-500" },
  { min: 1200, label: "Légende",   icon: Crown, color: "bg-amber-100 text-amber-600" },
];

function getBadge(points = 0) {
  let level = LEVEL_THRESHOLDS[0];
  for (const t of LEVEL_THRESHOLDS) { if (points >= t.min) level = t; }
  return level;
}

export default function ProfileHeader({ user, achievementPoints }) {
  // achievementPoints comes from DogAchievement (real data), fallback to user?.points
  const points = achievementPoints ?? user?.points ?? 0;
  const badge = getBadge(points);
  const BadgeIcon = badge.icon;
  const initials = (user?.full_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="gradient-primary safe-pt-14 pb-4 px-5 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-lg">
          {initials}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base truncate break-all">{user?.full_name || "Mon profil"}</h1>
          <p className="text-white/80 text-xs truncate">{user?.email}</p>

          {/* Subscription badge */}
          <div className="flex items-center gap-2 mt-2">
            {user?.is_premium ? (
              <span className="flex items-center gap-1 bg-emerald-400/30 border border-emerald-300/40 px-2.5 py-1 rounded-full text-xs font-bold text-white">
                <Crown className="w-3 h-3" /> Premium
              </span>
            ) : getTrialDaysLeft(user) > 0 ? (
              <span className="flex items-center gap-1 bg-emerald-400/30 border border-emerald-300/40 px-2.5 py-1 rounded-full text-xs font-bold text-white">
                <Crown className="w-3 h-3" /> Essai · {getTrialDaysLeft(user)}j
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-xs font-semibold text-white/80">
                Gratuit
              </span>
            )}
          </div>
        </div>

        {/* Gamification badge — now shows real achievement points */}
        <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl ${badge.color} flex-shrink-0`}>
          <BadgeIcon className="w-5 h-5" />
          <span className="text-[11px] font-bold">{badge.label}</span>
          <span className="text-[11px] font-bold opacity-70">
            {achievementPoints === null ? "..." : `${points} pts`}
          </span>
        </div>
      </div>
    </div>
  );
}