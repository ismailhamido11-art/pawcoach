import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Pause, Play, StopCircle, Timer, Footprints, Zap, TrendingUp, TrendingDown, Minus, Share2, TreePine } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import WalkMap from "./WalkMap";
import WalkShareCard from "./WalkShareCard";
import NearbyParks from "./NearbyParks";
import { PostWalkReviewPrompt } from "./ParkReviews";
import { checkWalkBadges } from "@/components/achievements/badgeUtils";

const WALK_MOODS = [
  { id: "super", emoji: "😊", label: "Super" },
  { id: "good", emoji: "👍", label: "Bien" },
  { id: "calm", emoji: "😐", label: "Calme" },
  { id: "hard", emoji: "😤", label: "Difficile" },
];
const WALK_TAGS = ["Tirait en laisse", "Bon rappel", "Sociable", "Distrait", "Très calme", "Énergique"];
const MOOD_KEY = "pawcoach_walk_moods";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getWalkInsight(minutes, logs, dogName) {
  const name = dogName || "ton chien";
  const recentLogs = (logs || []).filter(l => l.walk_minutes > 0).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const avgMinutes = recentLogs.length > 0 ? Math.round(recentLogs.reduce((s, l) => s + l.walk_minutes, 0) / recentLogs.length) : 0;
  const walkDaysThisWeek = recentLogs.filter(l => {
    const d = new Date(l.date + "T00:00:00");
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < 7;
  }).length;

  const diff = avgMinutes > 0 ? Math.round(((minutes - avgMinutes) / avgMinutes) * 100) : 0;
  let trend = null;
  if (avgMinutes > 0 && diff > 15) trend = { icon: TrendingUp, color: "text-emerald-600", text: `+${diff}% vs ta moyenne (${avgMinutes} min)` };
  else if (avgMinutes > 0 && diff < -15) trend = { icon: TrendingDown, color: "text-amber-600", text: `${diff}% vs ta moyenne (${avgMinutes} min)` };
  else if (avgMinutes > 0) trend = { icon: Minus, color: "text-blue-600", text: `Dans ta moyenne (${avgMinutes} min)` };

  let insight = "";
  if (minutes >= 45) insight = `Super sortie ! ${name} a eu sa dose d'activité pour la journée.`;
  else if (minutes >= 30) insight = `Objectif atteint ! 30 min de balade, c'est l'idéal pour la santé de ${name}.`;
  else if (minutes >= 15) insight = `Bonne balade ! Pour maximiser les bénéfices, vise 30 min la prochaine fois.`;
  else insight = `Petite sortie rapide — chaque minute compte pour ${name} !`;

  let streak = "";
  if (walkDaysThisWeek >= 5) streak = `${walkDaysThisWeek} balades cette semaine — régularité exemplaire !`;
  else if (walkDaysThisWeek >= 3) streak = `${walkDaysThisWeek} balades cette semaine — belle constance.`;

  return { trend, insight, streak };
}

export default function WalkMode({ dog, user, logs = [], onLogged, onViewHistory }) {
  const [status, setStatus] = useState("idle"); // idle | running | paused | done
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedMinutes, setSavedMinutes] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [nearPark, setNearPark] = useState(null); // park user is near
  const [path, setPath] = useState([]); // [{lat, lng}]
  const [currentPos, setCurrentPos] = useState(null);
  const [walkMood, setWalkMood] = useState(null);
  const [selectedMoodTags, setSelectedMoodTags] = useState([]);
  const [moodSaved, setMoodSaved] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedRef = useRef(0);
  const watchRef = useRef(null);
  const lastPosRef = useRef(null);
  const distanceRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (watchRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  const startGPS = () => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setCurrentPos([latitude, longitude]);
        if (lastPosRef.current) {
          const d = haversine(lastPosRef.current, newPos);
          // Only add to path if moved > 5m (filters GPS noise)
          if (d > 5) {
            distanceRef.current += d;
            setDistance(Math.round(distanceRef.current));
            setPath(prev => [...prev, [latitude, longitude]]);
          }
        } else {
          setPath([[latitude, longitude]]);
        }
        lastPosRef.current = newPos;
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  };

  const stopGPS = () => {
    if (watchRef.current && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  };

  const haversine = (a, b) => {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
  };

  const handleStart = () => {
    setStatus("running");
    setElapsed(0);
    setDistance(0);
    setPath([]);
    setCurrentPos(null);
    distanceRef.current = 0;
    lastPosRef.current = null;
    pausedRef.current = 0;
    startTimeRef.current = Date.now();
    startGPS();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current - pausedRef.current) / 1000));
    }, 500);
    if (navigator.vibrate) navigator.vibrate(100);
  };

  const handlePause = () => {
    if (status === "running") {
      setStatus("paused");
      clearInterval(timerRef.current);
      pausedRef.current -= Date.now();
      stopGPS();
    } else {
      setStatus("running");
      pausedRef.current += Date.now();
      startGPS();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current - pausedRef.current) / 1000));
      }, 500);
    }
  };

  const stoppingRef = useRef(false);
  const handleStop = async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    clearInterval(timerRef.current);
    stopGPS();
    setStatus("done");
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

    // Sync distance state from ref (GPS watcher may have updated ref without React re-render)
    const finalDistance = distanceRef.current;
    setDistance(Math.round(finalDistance));
    const finalKm = finalDistance > 0 ? (finalDistance / 1000).toFixed(2) : null;

    const minutes = Math.max(1, Math.round(elapsed / 60));
    setSavedMinutes(minutes);
    setSaving(true);
    try {
      const today = getTodayString();
      const existing = await base44.entities.DailyLog.filter({ dog_id: dog.id, date: today });
      if (existing?.length > 0) {
        const prev = existing[0].walk_minutes || 0;
        await base44.entities.DailyLog.update(existing[0].id, {
          walk_minutes: prev + minutes,
          notes: `Balade de ${prev + minutes} min${finalKm ? ` · ${finalKm} km` : ""}`
        });
      } else {
        await base44.entities.DailyLog.create({
          dog_id: dog.id,
          owner: user?.email,
          date: today,
          walk_minutes: minutes,
          notes: `Balade de ${minutes} min${finalKm ? ` · ${finalKm} km` : ""}`
        });
      }
      // Check walk badges
      const allLogs = await base44.entities.DailyLog.filter({ dog_id: dog.id }, "-date", 60);
      checkWalkBadges(dog.id, user?.email, allLogs || []).catch(() => {});
      onLogged?.();
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const saveMoodData = () => {
    if (!walkMood) return;
    try {
      const existing = JSON.parse(localStorage.getItem(MOOD_KEY) || "{}");
      existing[getTodayString()] = { mood: walkMood, tags: selectedMoodTags };
      localStorage.setItem(MOOD_KEY, JSON.stringify(existing));
      setMoodSaved(true);
    } catch {}
  };

  const handleReset = () => {
    stoppingRef.current = false;
    setStatus("idle");
    setElapsed(0);
    setDistance(0);
    setSavedMinutes(null);
    setShowShare(false);
    setNearPark(null);
    setWalkMood(null);
    setSelectedMoodTags([]);
    setMoodSaved(false);
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const km = distance > 0 ? (distance / 1000).toFixed(2) : null;
  const dogCalories = dog?.weight ? Math.round(dog.weight * 3.5 * ((savedMinutes || 0) / 60)) : null;
  const kibbleEquiv = dogCalories ? Math.round(dogCalories / 3.5) : null;

  return (
    <div className="flex flex-col items-center py-6 select-none">

      <AnimatePresence mode="wait">
        {/* IDLE */}
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="text-center space-y-1 mt-2">
              <h2 className="text-2xl font-black text-foreground">Mode Balade</h2>
              <p className="text-muted-foreground text-sm">Lance le chrono et profite de ta balade</p>
            </div>

            {/* Big animated start button */}
            <motion.button
              onClick={handleStart}
              whileTap={{ scale: 0.94 }}
              className="relative w-52 h-52 rounded-full shadow-2xl flex flex-col items-center justify-center gap-2 overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(160,50%,22%), hsl(162,45%,38%))" }}
            >
              {/* Pulsing rings */}
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-white/20"
                  animate={{ scale: [1, 1.3 + i * 0.15], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                />
              ))}
              <Footprints className="w-14 h-14 text-white" strokeWidth={1.5} />
              <span className="text-white font-black text-xl tracking-wide">DÉMARRER</span>
            </motion.button>

            {dog && (
              <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-2.5">
                <span className="text-xl">🐕</span>
                <span className="text-sm font-semibold text-foreground">Balade avec {dog.name}</span>
              </div>
            )}

            {/* Near park banner */}
            {nearPark && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <TreePine className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 truncate">Tu es au {nearPark.name} !</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Appuie sur Démarrer pour tracker ta balade ici</p>
                </div>
              </motion.div>
            )}

            {/* Nearby parks */}
            <NearbyParks dog={dog} user={user} onNearPark={setNearPark} />
          </motion.div>
        )}

        {/* RUNNING or PAUSED */}
        {(status === "running" || status === "paused") && (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-5 w-full"
          >
            {/* Animated background orb */}
            <div className="relative w-56 h-56 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, hsl(162,55%,42%), transparent 70%)" }}
                animate={status === "running" ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <div
                className="w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-2xl border border-white/10"
                style={{ background: "linear-gradient(135deg, hsl(160,50%,18%), hsl(162,45%,30%))" }}
              >
                <div className="font-black tabular-nums text-white" style={{ fontSize: "3.5rem", lineHeight: 1 }}>
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
                <div className="text-white/60 text-xs mt-1 font-medium">minutes : secondes</div>
                {status === "paused" && (
                  <div className="mt-1 bg-white/20 rounded-full px-3 py-0.5 text-white text-[10px] font-bold">
                    ⏸ EN PAUSE
                  </div>
                )}
              </div>
            </div>

            {/* Live map */}
            <WalkMap path={path} currentPos={currentPos} />

            {/* Stats row */}
            <div className="flex gap-3 w-full">
              {km && (
                <div className="flex-1 bg-white border border-border rounded-2xl p-3 text-center">
                  <MapPin className="w-4 h-4 text-accent mx-auto mb-1" />
                  <div className="text-lg font-black text-foreground">{km}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">km</div>
                </div>
              )}
              <div className="flex-1 bg-white border border-border rounded-2xl p-3 text-center">
                <Timer className="w-4 h-4 text-primary mx-auto mb-1" />
                <div className="text-lg font-black text-foreground">{minutes}</div>
                <div className="text-[10px] text-muted-foreground font-medium">minutes</div>
              </div>
              <div className="flex-1 bg-white border border-border rounded-2xl p-3 text-center">
                <Zap className="w-4 h-4 text-caution mx-auto mb-1" />
                <div className="text-lg font-black text-foreground">{Math.round(elapsed / 60 * 5)}</div>
                <div className="text-[10px] text-muted-foreground font-medium">cal. est.</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handlePause}
                className="w-14 h-14 rounded-full bg-white border-2 border-border shadow flex items-center justify-center"
              >
                {status === "running"
                  ? <Pause className="w-6 h-6 text-foreground" />
                  : <Play className="w-6 h-6 text-foreground" />
                }
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleStop}
                className="w-20 h-20 rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5"
                style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
              >
                <StopCircle className="w-7 h-7 text-white" />
                <span className="text-white text-[10px] font-bold">TERMINER</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* DONE */}
        {status === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="flex flex-col items-center gap-5 w-full text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-7xl"
            >
              🐾
            </motion.div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Balade terminée !</h2>
              <p className="text-muted-foreground text-sm mt-1">Super promenade avec {dog?.name}</p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-5 w-full space-y-3">
              <div className="flex justify-around">
                <div>
                  <div className="text-3xl font-black text-primary">{savedMinutes}</div>
                  <div className="text-xs text-muted-foreground">minutes</div>
                </div>
                {km && (
                  <div>
                    <div className="text-3xl font-black text-accent">{km}</div>
                    <div className="text-xs text-muted-foreground">km</div>
                  </div>
                )}
                <div>
                  <div className="text-3xl font-black text-caution">{Math.round((savedMinutes || 0) * 5)}</div>
                  <div className="text-xs text-muted-foreground">cal. est.</div>
                </div>
              </div>
              {kibbleEquiv > 0 && (
                <div className="flex items-center justify-center gap-1.5 bg-white/60 rounded-xl py-1.5 px-3">
                  <span className="text-sm">🦴</span>
                  <span className="text-xs font-bold text-foreground">= {kibbleEquiv} croquettes brûlées</span>
                </div>
              )}
              {saving ? (
                <div className="text-xs text-muted-foreground animate-pulse">Sauvegarde en cours…</div>
              ) : (
                <div className="text-xs text-accent font-semibold">✓ Enregistré dans le journal</div>
              )}
            </div>

            {/* Walk Intelligence — contextual insight */}
            {savedMinutes && (() => {
              const walkInfo = getWalkInsight(savedMinutes, logs, dog?.name);
              return (
                <>
                  <motion.div
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 30 }}
                    className="bg-white border border-border rounded-2xl p-4 w-full space-y-2 text-left"
                  >
                    {walkInfo.trend && (
                      <div className="flex items-center gap-2">
                        <walkInfo.trend.icon className={`w-4 h-4 ${walkInfo.trend.color} flex-shrink-0`} />
                        <p className={`text-xs font-bold ${walkInfo.trend.color}`}>{walkInfo.trend.text}</p>
                      </div>
                    )}
                    <p className="text-xs text-foreground/80 leading-relaxed">{walkInfo.insight}</p>
                    {walkInfo.streak && (
                      <p className="text-[10px] font-bold text-primary">{walkInfo.streak}</p>
                    )}
                  </motion.div>

                  {/* Post-walk park review prompt */}
                  {nearPark && (
                    <PostWalkReviewPrompt park={nearPark} dog={dog} user={user} />
                  )}

                  {/* Walk Mood Tracker */}
                  {!moodSaved ? (
                    <motion.div
                      initial={{ y: 16, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7, type: "spring", stiffness: 400, damping: 30 }}
                      className="bg-white border border-border rounded-2xl p-4 w-full space-y-3"
                    >
                      <p className="text-xs font-bold text-foreground">Comment s'est passée la balade ?</p>
                      <div className="flex justify-center gap-3">
                        {WALK_MOODS.map(m => (
                          <button
                            key={m.id}
                            onClick={() => setWalkMood(m.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                              walkMood === m.id ? "bg-primary/10 ring-2 ring-primary scale-105" : "hover:bg-secondary/40"
                            }`}
                          >
                            <span className="text-2xl">{m.emoji}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">{m.label}</span>
                          </button>
                        ))}
                      </div>
                      {walkMood && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2 overflow-hidden">
                          <p className="text-[10px] font-bold text-muted-foreground">Comportement (optionnel)</p>
                          <div className="flex flex-wrap gap-1.5">
                            {WALK_TAGS.map(tag => (
                              <button
                                key={tag}
                                onClick={() => setSelectedMoodTags(prev =>
                                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                )}
                                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                                  selectedMoodTags.includes(tag)
                                    ? "bg-primary text-white"
                                    : "bg-secondary/50 text-muted-foreground"
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={saveMoodData}
                            className="w-full py-2 rounded-xl text-xs font-bold text-white"
                            style={{ background: "linear-gradient(135deg, hsl(160,50%,22%), hsl(162,45%,38%))" }}
                          >
                            Enregistrer
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-2xl py-2.5 px-4 flex items-center justify-center gap-2"
                    >
                      <span className="text-xs text-emerald-600">✓</span>
                      <span className="text-xs font-bold text-emerald-700">Humeur enregistrée</span>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setShowShare(true)}
                      className="py-3.5 rounded-2xl font-bold text-sm border-2 border-primary/30 bg-white text-primary flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Partager
                    </motion.button>
                    <button
                      onClick={handleReset}
                      className="py-3.5 rounded-2xl font-bold text-sm"
                      style={{ background: "linear-gradient(135deg, hsl(160,50%,22%), hsl(162,45%,38%))", color: "white" }}
                    >
                      Nouvelle balade
                    </button>
                  </div>

                  {onViewHistory && (
                    <button
                      onClick={onViewHistory}
                      className="text-xs text-muted-foreground underline underline-offset-2"
                    >
                      Voir l'historique des balades
                    </button>
                  )}

                  {showShare && (
                    <WalkShareCard
                      minutes={savedMinutes}
                      km={km}
                      calories={Math.round((savedMinutes || 0) * 5)}
                      dogName={dog?.name}
                      streak={walkInfo.streak}
                      kibbleEquiv={kibbleEquiv}
                      onClose={() => setShowShare(false)}
                    />
                  )}
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}