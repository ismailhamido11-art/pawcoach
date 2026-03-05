import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import ExerciseDetail from "../components/training/ExerciseDetail";
import CelebrationScreen from "../components/training/CelebrationScreen";
import MilestoneScreen from "../components/training/MilestoneScreen";
import FreeExercisesGate from "../components/training/FreeExercisesGate";
import JourneyCard from "../components/training/JourneyCard";
import JourneyView from "../components/training/JourneyView";
import { Dog as DogIcon, Moon, Hand, Megaphone, Handshake, Circle, Footprints, Hourglass, RotateCw } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import { isUserPremium } from "@/utils/premium";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { updateStreakSilently } from "../components/streakHelper";
import { unlockBadge, checkStreakBadges } from "@/components/achievements/badgeUtils";
import { motion } from "framer-motion";

const EXERCISES = [
  { order_number: 1,  name: "Assis",               emoji: "🐶", icon: DogIcon,    iconColor: "#10b981", level: "debutant",      duration: "3 min",  is_premium: false, description: "La base de tout dressage – indispensable pour la sécurité.", steps: ["Tiens une friandise devant le museau de ton chien.", "Remonte lentement la friandise au-dessus de sa tête.", "Quand il s'assoit naturellement, dis « Assis » et donne la friandise.", "Répète 5 fois, puis réduis progressivement la friandise.", "Pratique dans différents endroits et situations."] },
  { order_number: 2,  name: "Couché",              emoji: "🌙", icon: Moon,       iconColor: "#6366f1", level: "debutant",      duration: "5 min",  is_premium: false, description: "Parfait pour les moments de calme et les lieux publics.", steps: ["Demande d'abord « Assis ».", "Place une friandise devant son museau puis descends-la vers le sol.", "Déplace-la lentement entre ses pattes.", "Dès qu'il se couche, dis « Couché » et récompense.", "Augmente progressivement la durée avant la récompense."] },
  { order_number: 3,  name: "Pas bouger",          emoji: "✋", icon: Hand,       iconColor: "#10b981", level: "debutant",      duration: "5 min",  is_premium: false, description: "Un ordre de sécurité crucial dans toutes les situations.", steps: ["Demande « Assis » ou « Couché ».", "Montre ta paume ouverte et dis « Pas bouger ».", "Fais un pas en arrière, reviens et récompense.", "Augmente progressivement la distance et la durée.", "Introduis des distractions pour solidifier l'ordre."] },
  { order_number: 4,  name: "Viens ici (Rappel)",  emoji: "📣", icon: Megaphone,  iconColor: "#ef4444", level: "debutant",      duration: "5 min",  is_premium: true,  description: "L'ordre le plus important pour la sécurité en extérieur.", steps: ["Commence en intérieur, à courte distance.", "Appelle son prénom + « Viens » avec enthousiasme.", "Récompense généreusement à chaque retour réussi.", "Augmente progressivement la distance.", "Pratique en laisse longue avant le rappel sans laisse."] },
  { order_number: 6,  name: "Lâche",               emoji: "🎾", icon: Circle,     iconColor: "#10b981", level: "debutant",      duration: "5 min",  is_premium: true,  description: "Essentiel pour les jeux et la sécurité.", steps: ["Joue avec un jouet avec ton chien.", "Présente une friandise près de son museau.", "Quand il lâche, dis « Lâche » et donne la friandise.", "Rends le jouet immédiatement pour qu'il comprenne.", "Pratique régulièrement sans friandise ensuite."] },
  { order_number: 8,  name: "Attends",             emoji: "⏳", icon: Hourglass,  iconColor: "#10b981", level: "intermediaire", duration: "5 min",  is_premium: true,  description: "Apprendre la patience avant une action.", steps: ["Demande « Assis » et dis « Attends ».", "Pose sa gamelle ou son jouet devant lui.", "Dis « Ok » ou « Vas-y » pour libérer.", "Augmente progressivement le temps d'attente.", "Pratique avant les repas, les jeux ou les sorties."] },
  { order_number: 5,  name: "Donne la patte",      emoji: "🤝", icon: Handshake,  iconColor: "#10b981", level: "debutant",      duration: "3 min",  is_premium: true,  description: "Un tour sympathique qui renforce la complicité.", steps: ["Demande « Assis » à ton chien.", "Présente ta main paume vers le haut, légèrement inclinée.", "Quand il pose la patte, dis « Donne la patte » et récompense.", "Répète sans la friandise en utilisant uniquement le geste.", "Alterne les deux pattes pour l'équilibre."] },
  { order_number: 9,  name: "Tourne",              emoji: "🔄", icon: RotateCw,   iconColor: "#6366f1", level: "intermediaire", duration: "5 min",  is_premium: true,  description: "Un tour sur lui-même – pour stimuler et épater !", steps: ["Tiens une friandise devant le museau de ton chien.", "Trace lentement un cercle complet avec la friandise.", "Quand il complète le tour, récompense.", "Ajoute le signal verbal « Tourne ».", "Remplace ensuite la friandise par un geste de la main."] },
  { order_number: 10, name: "Touche",              emoji: "👋", icon: Hand,       iconColor: "#d97706", level: "intermediaire", duration: "3 min",  is_premium: true,  description: "Toucher un objet ou une main sur commande.", steps: ["Présente ta main paume vers le chien.", "Quand il touche la paume avec son museau, dis « Touche » et récompense.", "Déplace ta main à différentes hauteurs et angles.", "Introduis d'autres surfaces à toucher.", "Utilise « Touche » pour guider ton chien vers des endroits précis."] },
  { order_number: 7,  name: "Au pied",             emoji: "🦮", icon: Footprints, iconColor: "#3b82f6", level: "intermediaire", duration: "10 min", is_premium: true,  description: "Promenades agréables sans tirer sur la laisse.", steps: ["Commence avec ton chien à ta gauche.", "Dès qu'il tire, arrête-toi complètement.", "Reprends quand la laisse se détend.", "Récompense fréquemment quand il marche bien.", "Progresse vers des environnements plus distractifs."] },
];

const JOURNEYS = [
  {
    id: "bases",
    name: "Les bases",
    emoji: "🐾",
    description: "Les ordres fondamentaux pour tout chien",
    isPremium: false,
    exerciseOrders: [1, 2, 3],
  },
  {
    id: "securite",
    name: "La sécurité",
    emoji: "🛡️",
    description: "Ordres essentiels pour la sécurité au quotidien",
    isPremium: true,
    exerciseOrders: [4, 6, 8],
  },
  {
    id: "complicite",
    name: "La complicité",
    emoji: "🤝",
    description: "Renforcer le lien et la communication",
    isPremium: true,
    exerciseOrders: [5, 9, 10],
  },
  {
    id: "promenade",
    name: "En promenade",
    emoji: "🦮",
    description: "Maîtriser les balades en toute sérénité",
    isPremium: true,
    exerciseOrders: [7],
  },
];

const MILESTONES = [3, 5, 10];

export default function Training() {
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progresses, setProgresses] = useState([]);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [selected, setSelected] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [showFreeGate, setShowFreeGate] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs.length > 0) {
        const activeDog = getActiveDog(dogs);
        setDog(activeDog);
        const progs = await base44.entities.UserProgress.filter({ user_email: u.email, dog_id: activeDog.id });
        setProgresses(progs);
      }
    } catch (err) {
      console.error("Training load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = (order) => progresses.some(p => p.exercise_id === String(order) && p.completed);
  const completedCount = EXERCISES.filter(e => isCompleted(e.order_number)).length;
  const isPremium = isUserPremium(user);

  const getJourneyExercises = (journey) =>
    journey.exerciseOrders.map(o => EXERCISES.find(e => e.order_number === o)).filter(Boolean);

  const getJourneyCompleted = (journey) =>
    getJourneyExercises(journey).filter(e => isCompleted(e.order_number)).length;

  const handleComplete = async (exercise) => {
    if (!dog || !user) return;
    const key = String(exercise.order_number);
    const existing = progresses.find(p => p.exercise_id === key);
    const wasCompleted = existing?.completed;

    // --- OPTIMISTIC UPDATE ---
    let optimisticProgresses;
    if (existing && existing.completed) {
      optimisticProgresses = progresses.map(p => p.id === existing.id ? { ...p, completed: false } : p);
    } else if (existing) {
      optimisticProgresses = progresses.map(p => p.id === existing.id ? { ...p, completed: true } : p);
    } else {
      optimisticProgresses = [...progresses, { exercise_id: key, completed: true, completed_date: new Date().toISOString().split("T")[0], _optimistic: true }];
    }
    setProgresses(optimisticProgresses);
    setSelected(null);

    if (!wasCompleted) {
      if (navigator.vibrate) navigator.vibrate(30);
      const prevCount = progresses.filter(p => p.completed).length;
      const newCount = optimisticProgresses.filter(p => p.completed).length;
      if (prevCount === 2 && newCount === 3 && !isUserPremium(user)) {
        setShowFreeGate(true);
      } else if (MILESTONES.includes(newCount)) {
        setMilestone(newCount);
      } else {
        setCelebration(exercise.name);
      }
    }

    // --- API SYNC (background) ---
    try {
      let newProgresses;
      if (existing && existing.completed) {
        await base44.entities.UserProgress.update(existing.id, { completed: false, completed_date: null });
        newProgresses = progresses.map(p => p.id === existing.id ? { ...p, completed: false } : p);
      } else if (existing) {
        await base44.entities.UserProgress.update(existing.id, { completed: true, completed_date: new Date().toISOString().split("T")[0] });
        newProgresses = progresses.map(p => p.id === existing.id ? { ...p, completed: true } : p);
      } else {
        const newP = await base44.entities.UserProgress.create({
          user_email: user.email,
          dog_id: dog.id,
          exercise_id: key,
          completed: true,
          completed_date: new Date().toISOString().split("T")[0],
        });
        // Replace the optimistic placeholder with the real record
        newProgresses = [...progresses.filter(p => !p._optimistic), newP];
        const newPoints = (user.points || 0) + 50;
        await base44.auth.updateMe({ points: newPoints });
        setUser(prev => ({ ...prev, points: newPoints }));
      }
      setProgresses(newProgresses);
      if (!wasCompleted) {
        updateStreakSilently(dog.id, user.email).catch(() => {});
        checkStreakBadges(dog.id, user.email).catch(() => {});
      }
    } catch (err) {
      console.error("Training complete error:", err);
      // Rollback on failure
      setProgresses(progresses);
    }
  };

  const handleHelp = (exercise) => {
    const msg = `J'ai besoin d'aide avec l'exercice « ${exercise.name} » pour ${dog?.name || "mon chien"}. ${dog?.name || "Mon chien"} est un ${dog?.breed || "chien"} de ${dog?.weight || "?"} kg.`;
    navigate(createPageUrl("Chat") + `?help=${encodeURIComponent(msg)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] pt-16 pb-0 px-5 overflow-hidden relative">
          <div className="flex items-start justify-between">
            <div className="pb-6 flex-1">
              <div className="h-3 w-16 bg-white/20 rounded animate-pulse mb-2" />
              <div className="h-7 w-28 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-36 bg-white/10 rounded animate-pulse mt-2 mb-4" />
              <div className="bg-white/15 rounded-2xl p-4">
                <div className="h-3 w-32 bg-white/20 rounded animate-pulse mb-2" />
                <div className="bg-white/25 rounded-full h-2.5 w-full" />
              </div>
            </div>
            <div className="w-28 h-28 flex-shrink-0 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="px-4 pt-5 space-y-3">
          <div className="h-3 w-24 bg-muted rounded animate-pulse mb-1" />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-border animate-pulse" />
          ))}
        </div>
        <BottomNav currentPage="Training" />
      </div>
    );
  }

  // Overlay screens
  if (milestone !== null) {
    return (
      <MilestoneScreen
        dogName={dog?.name || "Ton chien"}
        completedExercises={EXERCISES.filter(e => isCompleted(e.order_number))}
        onContinue={() => setMilestone(null)}
      />
    );
  }

  if (showFreeGate) {
    return <FreeExercisesGate dogName={dog?.name} onDismiss={() => setShowFreeGate(false)} />;
  }

  // celebration is shown as overlay (handled below)

  if (selected) {
    const exercise = EXERCISES.find(e => e.order_number === selected);
    const locked = exercise.is_premium && !isPremium;
    return (
      <>
        <ExerciseDetail
          exercise={exercise}
          isCompleted={isCompleted(exercise.order_number)}
          isPremiumLocked={locked}
          dogName={dog?.name}
          onBack={() => setSelected(null)}
          onComplete={() => handleComplete(exercise)}
          onHelp={() => handleHelp(exercise)}
        />
        {celebration && (
          <CelebrationScreen
            dogName={dog?.name || "Ton chien"}
            exerciseName={celebration}
            onContinue={() => { setCelebration(null); setSelected(null); }}
          />
        )}
      </>
    );
  }

  // Journey detail view
  if (selectedJourney) {
    const journey = JOURNEYS.find(j => j.id === selectedJourney);
    const journeyExercises = getJourneyExercises(journey);
    return (
      <>
        <WellnessBanner />
        <JourneyView
          journey={journey}
          exercises={journeyExercises}
          progresses={progresses}
          isPremium={isPremium}
          dogName={dog?.name}
          onBack={() => setSelectedJourney(null)}
          onSelectExercise={(order) => setSelected(order)}
        />
        <BottomNav currentPage="Training" />
      </>
    );
  }

  // Main journey list
  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      {/* Hero header */}
      <div className="bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] pt-16 pb-0 px-5 overflow-hidden relative">
        <div className="relative z-10 flex items-start justify-between">
          <div className="pb-6 flex-1">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-2">PawCoach</p>
            <h1 className="text-white font-black text-2xl leading-tight">Dressage</h1>
            <p className="text-white/70 text-sm mt-1 mb-4">
              {dog ? `Parcours de ${dog.name}` : "Chargement..."}
            </p>
            <div className="bg-white/15 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-semibold">{completedCount} / {EXERCISES.length} exercices</span>
                <span className="text-white/80 text-sm">{Math.round((completedCount / EXERCISES.length) * 100)}%</span>
              </div>
              <div className="bg-white/25 rounded-full h-2.5">
                <div className="bg-white rounded-full h-2.5 transition-all duration-700" style={{ width: `${(completedCount / EXERCISES.length) * 100}%` }} />
              </div>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-28 h-28 flex-shrink-0 -mb-2 ml-2"
          >
            <Illustration name="dogWalking" alt="Dressage" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Journey cards */}
      <div className="px-4 pt-5 space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">Mes parcours</p>
        {JOURNEYS.map((journey, idx) => {
          const locked = journey.isPremium && !isPremium;
          const done = getJourneyCompleted(journey);
          const total = journey.exerciseOrders.length;
          const isNext = !locked && done < total && JOURNEYS.slice(0, idx).every(j => {
            const d = getJourneyCompleted(j);
            return d === j.exerciseOrders.length || j.isPremium;
          });
          return (
            <JourneyCard
              key={journey.id}
              journey={journey}
              completedCount={done}
              isPremium={isPremium}
              isNext={isNext}
              onClick={() => locked ? navigate(createPageUrl("Premium")) : setSelectedJourney(journey.id)}
            />
          );
        })}
      </div>

      <BottomNav currentPage="Training" />
    </div>
  );
}