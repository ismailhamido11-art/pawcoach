import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import ExerciseDetail from "../components/training/ExerciseDetail";
import CelebrationScreen from "../components/training/CelebrationScreen";
import MilestoneScreen from "../components/training/MilestoneScreen";
import FreeExercisesGate from "../components/training/FreeExercisesGate";
import { CheckCircle, Timer, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { updateStreakSilently } from "../components/streakHelper";
import { motion } from "framer-motion";

const spring = { type: "spring", stiffness: 400, damping: 30 };
const listContainer = { show: { transition: { staggerChildren: 0.06 } } };
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
};

const EXERCISES = [
  { order_number: 1,  name: "Assis",              emoji: "🐕",  level: "debutant",      duration: "3 min",  is_premium: false, description: "La base de tout dressage – indispensable pour la sécurité.", steps: ["Tenez une friandise devant le museau de votre chien.", "Remontez lentement la friandise au-dessus de sa tête.", "Quand il s'assoit naturellement, dites « Assis » et donnez la friandise.", "Répétez 5 fois, puis réduisez progressivement la friandise.", "Pratiquez dans différents endroits et situations."] },
  { order_number: 2,  name: "Couché",             emoji: "😴",  level: "debutant",      duration: "5 min",  is_premium: false, description: "Parfait pour les moments de calme et les lieux publics.", steps: ["Demandez d'abord « Assis ».", "Placez une friandise devant son museau puis descendez-la vers le sol.", "Déplacez-la lentement entre ses pattes.", "Dès qu'il se couche, dites « Couché » et récompensez.", "Augmentez progressivement la durée avant la récompense."] },
  { order_number: 3,  name: "Pas bouger",         emoji: "🧶",  level: "debutant",      duration: "5 min",  is_premium: false, description: "Un ordre de sécurité crucial dans toutes les situations.", steps: ["Demandez « Assis » ou « Couché ».", "Montrez votre paume ouverte et dites « Pas bouger ».", "Faites un pas en arrière, revenez et récompensez.", "Augmentez progressivement la distance et la durée.", "Introduisez des distractions pour solidifier l'ordre."] },
  { order_number: 4,  name: "Viens ici (Rappel)", emoji: "📣",  level: "debutant",      duration: "5 min",  is_premium: true,  description: "L'ordre le plus important pour la sécurité en extérieur.", steps: ["Commencez en intérieur, à courte distance.", "Appelez son prénom + « Viens » avec enthousiasme.", "Récompensez généreusement à chaque retour réussi.", "Augmentez progressivement la distance.", "Pratiquez en laisse longue avant le rappel sans laisse."] },
  { order_number: 5,  name: "Donne la patte",     emoji: "🤝",  level: "debutant",      duration: "3 min",  is_premium: true,  description: "Un tour sympathique qui renforce la complicité.", steps: ["Demandez « Assis » à votre chien.", "Présentez votre main paume vers le haut, légèrement inclinée.", "Quand il pose la patte, dites « Donne la patte » et récompensez.", "Répétez sans la friandise en utilisant uniquement le geste.", "Alterner les deux pattes pour l'équilibre."] },
  { order_number: 6,  name: "Lâche",              emoji: "🎾",  level: "debutant",      duration: "5 min",  is_premium: true,  description: "Essentiel pour les jeux et la sécurité.", steps: ["Jouez avec un jouet avec votre chien.", "Présentez une friandise près de son museau.", "Quand il lâche, dites « Lâche » et donnez la friandise.", "Rendez le jouet immédiatement pour qu'il comprenne.", "Pratiquez régulièrement sans friandise ensuite."] },
  { order_number: 7,  name: "Au pied",            emoji: "🚶",  level: "intermediaire", duration: "10 min", is_premium: true,  description: "Promenades agréables sans tirer sur la laisse.", steps: ["Commencez avec votre chien à votre gauche.", "Dès qu'il tire, arrêtez-vous complètement.", "Reprenez quand la laisse se détend.", "Récompensez fréquemment quand il marche bien.", "Progressez vers des environnements plus distractifs."] },
  { order_number: 8,  name: "Attends",            emoji: "⏳",  level: "intermediaire", duration: "5 min",  is_premium: true,  description: "Apprendre la patience avant une action.", steps: ["Demandez « Assis » et dites « Attends ».", "Posez sa gamelle ou son jouet devant lui.", "Dites « Ok » ou « Vas-y » pour libérer.", "Augmentez progressivement le temps d'attente.", "Pratiquez avant les repas, les jeux ou les sorties."] },
  { order_number: 9,  name: "Tourne",             emoji: "🔄",  level: "intermediaire", duration: "5 min",  is_premium: true,  description: "Un tour sur lui-même – pour stimuler et épater !", steps: ["Tenez une friandise devant le museau de votre chien.", "Tracez lentement un cercle complet avec la friandise.", "Quand il complète le tour, récompensez.", "Ajoutez le signal verbal « Tourne ».", "Remplacez ensuite la friandise par un geste de la main."] },
  { order_number: 10, name: "Touche",             emoji: "✋",  level: "intermediaire", duration: "3 min",  is_premium: true,  description: "Toucher un objet ou une main sur commande.", steps: ["Présentez votre main paume vers le chien.", "Quand il touche la paume avec son museau, dites « Touche » et récompensez.", "Déplacez votre main à différentes hauteurs et angles.", "Introduisez d'autres surfaces à toucher.", "Utilisez « Touche » pour guider votre chien vers des endroits précis."] },
];

const MILESTONES = [3, 5, 10];
const LEVEL_CONFIG = {
  debutant:      { label: "Débutant",      color: "text-green-700 bg-green-50 border-green-200" },
  intermediaire: { label: "Intermédiaire", color: "text-amber-600 bg-amber-50 border-amber-200" },
};

export default function Training() {
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [progresses, setProgresses] = useState([]);
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
        setDog(dogs[0]);
        const progs = await base44.entities.UserProgress.filter({ user_email: u.email, dog_id: dogs[0].id });
        setProgresses(progs);
      }
    } catch (err) {
      console.error("Training load error:", err);
    }
  };

  const isCompleted = (order) => progresses.some(p => p.exercise_id === String(order) && p.completed);

  const completedExercises = EXERCISES.filter(e => isCompleted(e.order_number));
  const completedCount = completedExercises.length;

  const isPremium = user?.is_premium;

  const handleComplete = async (exercise) => {
    if (!dog || !user) return;
    const key = String(exercise.order_number);
    const existing = progresses.find(p => p.exercise_id === key);
    const wasCompleted = existing?.completed;

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
        newProgresses = [...progresses, newP];

        const newPoints = (user.points || 0) + 50;
        await base44.auth.updateMe({ points: newPoints });
        setUser(prev => ({ ...prev, points: newPoints }));
      }

      setProgresses(newProgresses);
      setSelected(null);

      // Only show celebration and update streak if we just completed (not un-completing)
      if (!wasCompleted) {
        if (navigator.vibrate) navigator.vibrate(30);
        // --- STREAK UPDATE ---
        await updateStreakSilently(dog.id, user.email);

        const prevCount = progresses.filter(p => p.completed).length;
        const newCount = newProgresses.filter(p => p.completed).length;

        // Free exercises gate: exactly when going from 2→3 completed and user is free
        if (prevCount === 2 && newCount === 3 && !user?.is_premium) {
          setShowFreeGate(true);
        } else if (MILESTONES.includes(newCount)) {
          setMilestone(newCount);
        } else {
          setCelebration(exercise.name);
        }
      }
    } catch (err) {
      console.error("Training complete error:", err);
      alert("Erreur lors de la sauvegarde. Réessaie.");
    }
  };

  const handleHelp = (exercise) => {
    const msg = `J'ai besoin d'aide avec l'exercice « ${exercise.name} » pour ${dog?.name || "mon chien"}. ${dog?.name || "Mon chien"} est un ${dog?.breed || "chien"} de ${dog?.weight || "?"} kg.`;
    navigate(createPageUrl("Chat") + `?help=${encodeURIComponent(msg)}`);
  };

  // Overlay screens
  if (milestone !== null) {
    const completedUpTo = EXERCISES.filter(e => isCompleted(e.order_number));
    return (
      <MilestoneScreen
        dogName={dog?.name || "Ton chien"}
        completedExercises={completedUpTo}
        onContinue={() => setMilestone(null)}
      />
    );
  }

  if (showFreeGate) {
    return (
      <FreeExercisesGate
        dogName={dog?.name}
        onDismiss={() => setShowFreeGate(false)}
      />
    );
  }

  if (celebration) {
    return (
      <CelebrationScreen
        dogName={dog?.name || "Ton chien"}
        exerciseName={celebration}
        onContinue={() => setCelebration(null)}
      />
    );
  }

  // Detail screen
  if (selected) {
    const exercise = EXERCISES.find(e => e.order_number === selected);
    const locked = exercise.is_premium && !isPremium;
    return (
      <ExerciseDetail
        exercise={exercise}
        isCompleted={isCompleted(exercise.order_number)}
        isPremiumLocked={locked}
        dogName={dog?.name}
        onBack={() => setSelected(null)}
        onComplete={() => handleComplete(exercise)}
        onHelp={() => handleHelp(exercise)}
      />
    );
  }

  // List screen
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="min-h-screen bg-background pb-24"
    >
      <WellnessBanner />

      <div className="gradient-primary pt-10 pb-6 px-5">
        <h1 className="text-white font-bold text-xl mb-0.5">Coach Dressage 🐾</h1>
        <p className="text-white/70 text-sm mb-4">
          {dog ? `Entraîne-toi avec ${dog.name}` : "Chargement..."}
        </p>
        <div className="bg-white/15 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-semibold">{completedCount} / {EXERCISES.length} tours maîtrisés</span>
            <span className="text-white/80 text-sm">{Math.round((completedCount / EXERCISES.length) * 100)}%</span>
          </div>
          <div className="bg-white/25 rounded-full h-2.5">
            <div className="bg-white rounded-full h-2.5 transition-all duration-700" style={{ width: `${(completedCount / EXERCISES.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <motion.div className="px-4 pt-4 space-y-3" variants={listContainer} initial="hidden" animate="show">
        {EXERCISES.map(exercise => {
          const done = isCompleted(exercise.order_number);
          const locked = exercise.is_premium && !isPremium;
          const lvl = LEVEL_CONFIG[exercise.level];

          return (
            <motion.button
              key={exercise.order_number}
              variants={listItem}
              whileTap={{ scale: 0.96 }}
              transition={spring}
              onClick={() => setSelected(exercise.order_number)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-colors shadow-sm bg-white
                ${done ? "border-green-200 bg-green-50/40" : "border-border"}`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${done ? "bg-green-100" : "bg-secondary/50"}`}>
                {exercise.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-tight ${done ? "text-green-700" : "text-foreground"}`}>
                  {exercise.name}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${lvl.color}`}>
                    {lvl.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="w-3 h-3" /> {exercise.duration}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {done ? (
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                ) : locked ? (
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">{exercise.order_number}</span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <BottomNav currentPage="Training" />
    </motion.div>
  );
}