import { Crown, Star, Medal, Award, Trophy } from "lucide-react";
import { isUserPremium, getTrialDaysLeft } from "@/utils/premium";

const BADGES = [
  { name: "Novice", threshold: 0, icon: Star, color: "bg-slate-100 text-slate-500" },
  { name: "Apprenti", threshold: 50, icon: Medal, color: "bg-emerald-100 text-emerald-600" },
  { name: "Expert", threshold: 200, icon: Award, color: "bg-emerald-100 text-emerald-600" },
  { name: "Maître", threshold: 500, icon: Trophy, color: "bg-purple-100 text-purple-600" },
];

function getBadge(points = 0) {
  return [...BADGES].reverse().find(b => points >= b.threshold) || BADGES[0];
}

export default function ProfileHeader({ user }) {
  const points = user?.points || 0;
  const badge = getBadge(points);
  const BadgeIcon = badge.icon;
  const initials = (user?.full_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="gradient-primary safe-pt-16 pb-8 px-5 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0 text-white font-black text-xl shadow-lg">
          {initials}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-lg truncate">{user?.full_name || "Mon profil"}</h1>
          <p className="text-white/60 text-xs truncate">{user?.email}</p>

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
              <span className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-xs font-semibold text-white/70">
                Gratuit
              </span>
            )}
          </div>
        </div>

        {/* Gamification badge */}
        <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl ${badge.color} flex-shrink-0`}>
          <BadgeIcon className="w-5 h-5" />
          <span className="text-[10px] font-black">{badge.name}</span>
          <span className="text-[10px] font-bold opacity-70">{points} pts</span>
        </div>
      </div>
    </div>
  );
}