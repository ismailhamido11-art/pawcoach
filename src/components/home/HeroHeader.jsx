import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Flame, UserCircle } from "lucide-react";
import HealthScore from "./HealthScore";
import { DogWave } from "../ui/PawIllustrations";

export default function HeroHeader({ user, dog, streak, checkins, records, exercises, scans }) {
  const currentStreak = streak?.current_streak || 0;
  const firstName = user?.full_name?.split(" ")[0] || "l'ami";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="relative overflow-hidden">
      {/* Background immersif */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

      {/* Orbes décoratifs */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-60px] right-[-40px] w-64 h-64 rounded-full bg-white/10 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-10 left-[-40px] w-48 h-48 rounded-full bg-accent/30 blur-3xl"
      />

      <div className="relative z-10 px-5 pt-12 pb-16">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase">PawCoach</p>
          </motion.div>
          <div className="flex items-center gap-2">
            {currentStreak > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full"
              >
                <Flame className="w-3.5 h-3.5 text-orange-300" />
                <span className="text-white text-xs font-bold">{currentStreak}j</span>
              </motion.div>
            )}
            {/* Health Score Ring */}
            <HealthScore
              dog={dog}
              streak={streak}
              checkins={checkins}
              records={records}
              exercises={exercises}
              scans={scans}
            />
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <Link
                to={createPageUrl("Profile")}
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center"
              >
                <UserCircle className="w-5 h-5 text-white" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Main hero content */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-white/70 text-sm font-medium mb-1"
            >
              {greeting}, {firstName} 👋
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, type: "spring", stiffness: 100 }}
              className="text-3xl font-bold text-white leading-tight"
            >
              Comment va<br />
              <span className="text-accent">{dog?.name || "ton chien"}</span> ?
            </motion.h1>
            {dog?.breed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white/50 text-xs mt-1.5"
              >
                {dog.breed} · {dog.weight ? `${dog.weight} kg` : ""}
              </motion.p>
            )}
          </div>

          {/* Photo du chien */}
          {dog?.photo ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 3 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 14 }}
              className="relative flex-shrink-0"
            >
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl">
                <img src={dog.photo} alt={dog.name} className="w-full h-full object-cover" />
              </div>
              {currentStreak >= 7 && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <Flame className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-28 h-28 flex-shrink-0"
            >
              <DogWave color="#a7f3d0" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}