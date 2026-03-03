import React from "react";
import { Trophy, Medal, Star, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const BADGES = [
  { id: "novice", name: "Novice", threshold: 0, icon: Star, color: "text-slate-400 bg-slate-100" },
  { id: "apprenti", name: "Apprenti", threshold: 50, icon: Medal, color: "text-emerald-600 bg-emerald-100" },
  { id: "expert", name: "Expert", threshold: 200, icon: Award, color: "text-emerald-600 bg-emerald-100" },
  { id: "maitre", name: "Maître Canin", threshold: 500, icon: Trophy, color: "text-purple-600 bg-purple-100" },
];

export default function GamificationDashboard({ points = 0 }) {
  const currentBadgeIndex = [...BADGES].reverse().findIndex(b => points >= b.threshold);
  const currentBadge = BADGES[BADGES.length - 1 - currentBadgeIndex] || BADGES[0];
  
  const nextBadge = BADGES.find(b => points < b.threshold);
  const progressToNext = nextBadge ? ((points - currentBadge.threshold) / (nextBadge.threshold - currentBadge.threshold)) * 100 : 100;

  const Icon = currentBadge.icon;

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-foreground">Ton Score PawCoach</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Cumule des points dans l'app !</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black text-primary">{points}</span>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Points</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentBadge.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Niveau actuel</p>
          <p className="text-sm font-bold text-foreground">{currentBadge.name}</p>
        </div>
      </div>

      {nextBadge ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Prochain : {nextBadge.name}</span>
            <span className="font-semibold text-foreground">{points} / {nextBadge.threshold} pts</span>
          </div>
          <Progress value={progressToNext} className="h-2" />
        </div>
      ) : (
        <div className="text-center py-2 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-xs font-bold text-purple-700">🎉 Niveau maximum atteint !</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground">Dressage</p>
          <p className="text-xs font-semibold text-green-600">+50 pts</p>
        </div>
        <div className="border-l border-r border-border">
          <p className="text-[10px] text-muted-foreground">Carnet</p>
          <p className="text-xs font-semibold text-blue-600">+20 pts</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Scan</p>
          <p className="text-xs font-semibold text-emerald-600">+10 pts</p>
        </div>
      </div>
    </div>
  );
}