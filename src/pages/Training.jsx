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
import { DogGrad } from "../components/ui/PawIllustrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { updateStreakSilently } from "../components/streakHelper";
import { motion } from "framer-motion";

const EXERCISES = [
  { order_number: 1,  name: "Assis",               icon: DogIcon,    iconColor: "#f59e0b", level: "debutant",      duration: "3 min",  is_premium: false, description: "La base de tout dressage – indispensable pour la sécurité.", steps: ["Tenez une friandise devant le museau de votre chien.", "Remontez lentement la friandise au-dessus de sa tête.", "Quand il s'assoit naturellement, dites « Assis » et donnez la friandise.", "Répétez 5 fois, puis réduisez progressivement la friandise.", "Pratiquez dans différents endroits et situations."] },
  { order_number: 2,  name: "Couché",              icon: Moon,       iconColor: "#6366f1", level: "debutant",      duration: "5 min",  is_premium: false, description: "Parfait pour les moments de calme et les lieux publics.", steps: ["Demandez d'abord « Assis ».", "Placez une friandise devant son museau puis descendez-la vers le sol.", "Déplacez-la lentement entre ses pattes.", "Dès qu'il se couche, dites « Couché » et récompensez.", "Augmentez progressivement la durée avant la récompense."] },
  { order_number: 3,  name: "Pas bouger",          icon: Hand,       iconColor: "#f59e0b", level: "debutant",      duration: "5 min",  is_premium: false, description: "Un ordre de sécurité crucial dans toutes les situations.", steps: ["Demandez « Assis » ou « Couché ».", "Montrez votre paume ouverte et dites « Pas bouger ».", "Faites un pas en arrière, revenez et récompensez.", "Augmentez progressivement la distance et la durée.", "Introduisez des distractions pour solidifier l'ordre."] },
  { order_number: 4,  name: "Viens ici (Rappel)",  icon: Megaphone,  iconColor: "#ef4444", level: "debutant",      duration: "5 min",  is_premium: true,  description: "L'ordre le plus important pour la sécurité en extérieur.", steps: ["Commencez en intérieur, à courte distance.", "Appelez son prénom + « Viens » avec enthousiasme.", "Récompensez généreusement à chaque retour réussi.", "Augmentez progressivement la distance.", "Pratiquez en laisse longue avant le rappel sans laisse."] },
  { order_number: 6,  name: "Lâche",               icon: Circle,     iconColor: "#10b981", level: "debutant",      duration: "5 min",  is_premium: true,  description: "Essentiel pour les jeux et la sécurité.", steps: ["Jouez avec un jouet avec votre chien.", "Présentez une friandise près de son museau.", "Quand il lâche, dites « Lâche » et donnez la friandise.", "Rendez le jouet immédiatement pour qu'il comprenne.", "Pratiquez régulièrement sans friandise ensuite."] },
  { order_number: 8,  name: "Attends",             icon: Hourglass,  iconColor: "#f59e0b", level: "intermediaire", duration: "5 min",  is_premium: true,  description: "Apprendre la patience avant une action.", steps: ["Demandez « Assis » et dites « Attends ».", "Posez sa gamelle ou son jouet devant lui.", "Dites « Ok » ou « Vas-y » pour libérer.", "Augmentez progressivement le temps d'attente.", "Pratiquez avant les repas, les jeux ou les sorties."] },
  { order_number: 5,  name: "Donne la patte",      icon: Handshake,  iconColor: "#10b981", level: "debutant",      duration: "3 min",  is_premium: true,  description: "Un tour sympathique qui renforce la complicité.", steps: ["Demandez « Assis » à votre chien.", "Présentez votre main paume vers le haut, légèrement inclinée.", "Quand il pose la patte, dites « Donne la patte » et récompensez.", "Répétez sans la friandise en utilisant uniquement le geste.", "Alterner les deux pattes pour l'équilibre."] },
  { order_number: 9,  name: "Tourne",              icon: RotateCw,   iconColor: "#6366f1", level: "intermediaire", duration: "5 min",  is_premium: true,  description: "Un tour sur lui-même – pour stimuler et épater !", steps: ["Tenez une friandise devant le museau de votre chien.", "Tracez lentement un cercle complet avec la friandise.", "Quand il complète le tour, récompensez.", "Ajoutez le signal verbal « Tourne ».", "Remplacez ensuite la friandise par un geste de la main."] },
  { order_number: 10, name: "Touche",              icon: Hand,       iconColor: "#f97316", level: "intermediaire", duration: "3 min",  is_premium: true,  description: "Toucher un objet ou une main sur commande.", steps: ["Présentez votre main paume vers le chien.", "Quand il touche la paume avec son museau, dites « Touche » et récompensez.", "Déplacez votre main à différentes hauteurs et angles.", "Introduisez d'autres surfaces à toucher.", "Utilisez « Touche » pour guider votre chien vers des endroits précis."] },
  { order_number: 7,  name: "Au pied",             icon: Footprints, iconColor: "#3b82f6", level: "intermediaire", duration: "10 min", is_premium: true,  description: "Promenades agréables sans tirer sur la laisse.", steps: ["Commencez avec votre chien à votre gauche.", "Dès qu'il tire, arrêtez-vous complètement.", "Reprenez quand la laisse se détend.", "Récompensez fréquemment quand il marche bien.", "Progressez vers des environnements plus distractifs."] },
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
        setDog(dogs[0]);
        const progs = await base44.entities.UserProgress.filter({ user_email: u.email, dog_id: dogs[0].id });
        setProgresses(progs);
      }
    } catch (err) {
      console.error("Training load error:", err);
    }
  };

  const isCompleted = (order) => progresses.some(p => p.exercise_id === String(order) && p.completed);
  const completedCount = EXERCISES.filter(e => isCompleted(e.order_number)).length;
  const isPremium = user?.is_premium;

  const getJourneyExercises = (journey) =>
    journey.exerciseOrders.map(o => EXERCISES.find(e => e.order_number === o)).filter(Boolean);

  const getJourneyCompleted = (journey) =>
    getJourneyExercises(journey).filter(e => isCompleted(e.order_number)).length;

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

      if (!wasCompleted) {
        if (navigator.vibrate) navigator.vibrate(30);
        await updateStreakSilently(dog.id, user.email);
        const prevCount = progresses.filter(p => p.completed).length;
        const newCount = newProgresses.filter(p => p.completed).length;
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

  if (celebration) {
    return (
      <CelebrationScreen
        dogName={dog?.name || "Ton chien"}
        exerciseName={celebration}
        onContinue={() => setCelebration(null)}
      />
    );
  }

  // Exercise detail screen
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
      <div className="bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] pt-10 pb-0 px-5 overflow-hidden relative">
        <div className="flex items-start justify-between">
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
          <div className="w-28 h-28 flex-shrink-0 -mb-2 ml-2">
            <DogGrad color="#ddd6fe" />
          </div>
        </div>
      </div>

      {/* Journey cards */}
      <div className="px-4 pt-5 space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">Mes parcours</p>
        {JOURNEYS.map((journey) => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            completedCount={getJourneyCompleted(journey)}
            isPremium={isPremium}
            onClick={() => setSelectedJourney(journey.id)}
          />
        ))}
      </div>

      <BottomNav currentPage="Training" />
    </div>
  );
}