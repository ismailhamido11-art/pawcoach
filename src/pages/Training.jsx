import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import ExerciseDetail from "../components/training/ExerciseDetail";
import CelebrationScreen from "../components/training/CelebrationScreen";
import MilestoneScreen from "../components/training/MilestoneScreen";
import { CheckCircle, Timer, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const EXERCISES = [
  { order_number: 1,  name: "Assis",              emoji: "\ud83d\udc15",  level: "debutant",      duration: "3 min",  is_premium: false, description: "La base de tout dressage \u2013 indispensable pour la s\u00e9curit\u00e9.", steps: ["Tenez une friandise devant le museau de votre chien.", "Remontez lentement la friandise au-dessus de sa t\u00eate.", "Quand il s'assoit naturellement, dites \u00ab Assis \u00bb et donnez la friandise.", "R\u00e9p\u00e9tez 5 fois, puis r\u00e9duisez progressivement la friandise.", "Pratiquez dans diff\u00e9rents endroits et situations."] },
  { order_number: 2,  name: "Couch\u00e9",             emoji: "\ud83d\ude34",  level: "debutant",      duration: "5 min",  is_premium: false, description: "Parfait pour les moments de calme et les lieux publics.", steps: ["Demandez d'abord \u00ab Assis \u00bb.", "Placez une friandise devant son museau puis descendez-la vers le sol.", "D\u00e9placez-la lentement entre ses pattes.", "D\u00e8s qu'il se couche, dites \u00ab Couch\u00e9 \u00bb et r\u00e9compensez.", "Augmentez progressivement la dur\u00e9e avant la r\u00e9compense."] },
  { order_number: 3,  name: "Pas bouger",         emoji: "\ud83e\uddf6",  level: "debutant",      duration: "5 min",  is_premium: false, description: "Un ordre de s\u00e9curit\u00e9 crucial dans toutes les situations.", steps: ["Demandez \u00ab Assis \u00bb ou \u00ab Couch\u00e9 \u00bb.", "Montrez votre paume ouverte et dites \u00ab Pas bouger \u00bb.", "Faites un pas en arri\u00e8re, revenez et r\u00e9compensez.", "Augmentez progressivement la distance et la dur\u00e9e.", "Introduisez des distractions pour solidifier l'ordre."] },
  { order_number: 4,  name: "Viens ici (Rappel)", emoji: "\ud83d\udce3",  level: "debutant",      duration: "5 min",  is_premium: true,  description: "L'ordre le plus important pour la s\u00e9curit\u00e9 en ext\u00e9rieur.", steps: ["Commencez en int\u00e9rieur, \u00e0 courte distance.", "Appelez son pr\u00e9nom + \u00ab Viens \u00bb avec enthousiasme.", "R\u00e9compensez g\u00e9n\u00e9reusement \u00e0 chaque retour r\u00e9ussi.", "Augmentez progressivement la distance.", "Pratiquez en laisse longue avant le rappel sans laisse."] },
  { order_number: 5,  name: "Donne la patte",     emoji: "\ud83e\udd1d",  level: "debutant",      duration: "3 min",  is_premium: true,  description: "Un tour sympathique qui renforce la complicit\u00e9.", steps: ["Demandez \u00ab Assis \u00bb \u00e0 votre chien.", "Pr\u00e9sentez votre main paume vers le haut, l\u00e9g\u00e8rement inclin\u00e9e.", "Quand il pose la patte, dites \u00ab Donne la patte \u00bb et r\u00e9compensez.", "R\u00e9p\u00e9tez sans la friandise en utilisant uniquement le geste.", "Alterner les deux pattes pour l'\u00e9quilibre."] },
  { order_number: 6,  name: "L\u00e2che",              emoji: "\ud83c\udfbe",  level: "debutant",      duration: "5 min",  is_premium: true,  description: "Essentiel pour les jeux et la s\u00e9curit\u00e9.", steps: ["Jouez avec un jouet avec votre chien.", "Pr\u00e9sentez une friandise pr\u00e8s de son museau.", "Quand il l\u00e2che, dites \u00ab L\u00e2che \u00bb et donnez la friandise.", "Rendez le jouet imm\u00e9diatement pour qu'il comprenne.", "Pratiquez r\u00e9guli\u00e8rement sans friandise ensuite."] },
  { order_number: 7,  name: "Au pied",            emoji: "\ud83d\udeb6",  level: "intermediaire", duration: "10 min", is_premium: true,  description: "Promenades agr\u00e9ables sans tirer sur la laisse.", steps: ["Commencez avec votre chien \u00e0 votre gauche.", "D\u00e8s qu'il tire, arr\u00eatez-vous compl\u00e8tement.", "Reprenez quand la laisse se d\u00e9tend.", "R\u00e9compensez fr\u00e9quemment quand il marche bien.", "Progressez vers des environnements plus distractifs."] },
  { order_number: 8,  name: "Attends",            emoji: "\u23f3",  level: "intermediaire", duration: "5 min",  is_premium: true,  description: "Apprendre la patience avant une action.", steps: ["Demandez \u00ab Assis \u00bb et dites \u00ab Attends \u00bb.", "Posez sa gamelle ou son jouet devant lui.", "Dites \u00ab Ok \u00bb ou \u00ab Vas-y \u00bb pour lib\u00e9rer.", "Augmentez progressivement le temps d'attente.", "Pratiquez avant les repas, les jeux ou les sorties."] },
  { order_number: 9,  name: "Tourne",             emoji: "\ud83d\udd04",  level: "intermediaire", duration: "5 min",  is_premium: true,  description: "Un tour sur lui-m\u00eame \u2013 pour stimuler et \u00e9pater !", steps: ["Tenez une friandise devant le museau de votre chien.", "Tracez lentement un cercle complet avec la friandise.", "Quand il compl\u00e8te le tour, r\u00e9compensez.", "Ajoutez le signal verbal \u00ab Tourne \u00bb.", "Remplacez ensuite la friandise par un geste de la main."] },
  { order_number: 10, name: "Touche",             emoji: "\u270b",  level: "intermediaire", duration: "3 min",  is_premium: true,  description: "Toucher un objet ou une main sur commande.", steps: ["Pr\u00e9sentez votre main paume vers le chien.", "Quand il touche la paume avec son museau, dites \u00ab Touche \u00bb et r\u00e9compensez.", "D\u00e9placez votre main \u00e0 diff\u00e9rentes hauteurs et angles.", "Introduisez d'autres surfaces \u00e0 toucher.", "Utilisez \u00ab Touche \u00bb pour guider votre chien vers des endroits pr\u00e9cis."] },
];

const MILESTONES = [3, 5, 10];
const LEVEL_CONFIG = {
  debutant:      { label: "D\u00e9butant",      color: "text-green-700 bg-green-50 border-green-200" },
  intermediaire: { label: "Interm\u00e9diaire", color: "text-amber-600 bg-amber-50 border-amber-200" },
};

// --- STREAK HELPER ---
async function updateStreakSilently(dogId, ownerEmail) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const streaks = await base44.entities.Streak.filter({ dog_id: dogId });
    if (streaks.length > 0) {
      const s = streaks[0];
      if (s.last_activity_date === today) return;
      const lastDate = new Date(s.last_activity_date + "T12:00:00");
      const todayDate = new Date(today + "T12:00:00");
      const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      let newStreak = s.current_streak;
      let graceDaysUsed = s.grace_days_used || 0;
      let graceDaysRemaining = s.grace_days_remaining ?? 1;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays === 2 && graceDaysRemaining > 0) {
        newStreak += 1;
        graceDaysUsed += 1;
        graceDaysRemaining -= 1;
      } else {
        newStreak = 1;
        graceDaysUsed = 0;
        graceDaysRemaining = 1;
      }
      const newLongest = Math.max(s.longest_streak || 0, newStreak);
      await base44.entities.Streak.update(s.id, {
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        grace_days_used: graceDaysUsed,
        grace_days_remaining: graceDaysRemaining,
      });
    } else {
      await base44.entities.Streak.create({
        dog_id: dogId,
        owner_email: ownerEmail,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        grace_days_used: 0,
        grace_days_remaining: 1,
      });
    }
  } catch (e) {
    console.warn("Streak update failed (training):", e.message);
  }
}

export default function Training() {
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [progresses, setProgresses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [milestone, setMilestone] = useState(null);

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
        // --- STREAK UPDATE ---
        await updateStreakSilently(dog.id, user.email);

        const newCount = newProgresses.filter(p => p.completed).length;
        if (MILESTONES.includes(newCount)) {
          setMilestone(newCount);
        } else {
          setCelebration(exercise.name);
        }
      }
    } catch (err) {
      console.error("Training complete error:", err);
      alert("Erreur lors de la sauvegarde. R\u00e9essaie.");
    }
  };

  const handleHelp = (exercise) => {
    const msg = `J'ai besoin d'aide avec l'exercice \u00ab ${exercise.name} \u00bb pour ${dog?.name || "mon chien"}. ${dog?.name || "Mon chien"} est un ${dog?.breed || "chien"} de ${dog?.weight || "?"} kg.`;
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
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      <div className="gradient-primary pt-10 pb-6 px-5">
        <h1 className="text-white font-bold text-xl mb-0.5">Coach Dressage \ud83d\udc3e</h1>
        <p className="text-white/70 text-sm mb-4">
          {dog ? `Entra\u00eene-toi avec ${dog.name}` : "Chargement..."}
        </p>
        <div className="bg-white/15 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-semibold">{completedCount} / {EXERCISES.length} tours ma\u00eetris\u00e9s</span>
            <span className="text-white/80 text-sm">{Math.round((completedCount / EXERCISES.length) * 100)}%</span>
          </div>
          <div className="bg-white/25 rounded-full h-2.5">
            <div className="bg-white rounded-full h-2.5 transition-all duration-700" style={{ width: `${(completedCount / EXERCISES.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {EXERCISES.map(exercise => {
          const done = isCompleted(exercise.order_number);
          const locked = exercise.is_premium && !isPremium;
          const lvl = LEVEL_CONFIG[exercise.level];

          return (
            <button
              key={exercise.order_number}
              onClick={() => setSelected(exercise.order_number)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left tap-scale transition-all duration-200 shadow-sm bg-white
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
            </button>
          );
        })}
      </div>

      <BottomNav currentPage="Training" />
    </div>
  );
}
