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
import { Dog as DogIcon, Moon, Hand, Megaphone, Handshake, Circle, Footprints, Hourglass, RotateCw, ChevronRight, Sparkles, Lock } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import { isUserPremium } from "@/utils/premium";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { dogAgeMonths } from "@/utils/healthStatus";
import { updateStreakSilently } from "../components/streakHelper";
import { unlockBadge, checkStreakBadges } from "@/components/achievements/badgeUtils";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

const BEHAVIOR_GUIDES = [
  {
    id: "reactivity",
    name: "Réactivité en laisse",
    emoji: "😤",
    description: "Ton chien aboie ou tire sur d'autres chiens/personnes en promenade",
    isFree: true,
    duration: "2-8 semaines",
    steps: [
      "Identifie la distance de déclenchement (seuil) — c'est la distance à laquelle ton chien réagit. Reste TOUJOURS en dessous.",
      "Dès que le stimulus (chien, personne) est visible, donne des friandises haute valeur en continu. Quand il disparaît, les friandises s'arrêtent.",
      "Réduis la distance TRÈS progressivement (sur plusieurs semaines). Si ton chien réagit, tu es allé trop vite — recule.",
    ],
    alarm: "Si ton chien a mordu ou menace de mordre, consulte un comportementaliste certifié (pas un éducateur classique).",
    errors: ["Raccourcir la laisse (augmente la tension)", "Punir les aboiements (augmente le stress)", "Forcer la rencontre avec le stimulus"],
  },
  {
    id: "pulling",
    name: "Tirage en laisse",
    emoji: "🦮",
    description: "Ton chien tire fort en promenade et tu as du mal à le contrôler",
    isFree: true,
    duration: "2-4 semaines",
    steps: [
      "Dès que la laisse se tend, arrête-toi complètement. Ne tire pas, ne parle pas. Attends.",
      "Quand la laisse se détend naturellement (ton chien se retourne ou recule), repars immédiatement en le félicitant.",
      "Récompense régulièrement quand il marche à côté de toi sans tirer. Varie les friandises pour garder son intérêt.",
    ],
    alarm: "Si le tirage est accompagné de grognements ou de réactivité, c'est un problème de réactivité (voir fiche dédiée).",
    errors: ["Tirer en retour (ça renforce le tirage)", "Utiliser un collier étrangleur (douleur = stress)", "Être inconsistant (parfois laisser tirer)"],
  },
  {
    id: "barking",
    name: "Aboiements intempestifs",
    emoji: "📢",
    description: "Ton chien aboie excessivement à la maison ou en promenade",
    isFree: false,
    duration: "1-4 semaines",
    steps: [
      "Identifie le TYPE d'aboiement (territorial, ennui, anxiété, demande d'attention). Chaque type a une solution différente.",
      "Ne punis JAMAIS l'aboiement — ça augmente le stress. Redirige plutôt vers un comportement incompatible (ex: \"va sur ton tapis\").",
      "Pour les aboiements d'ennui : augmente la stimulation mentale (jeux de flair, Kong, promenades variées). 15 min de stimulation mentale = 1h d'exercice physique.",
    ],
    alarm: "Des aboiements soudains et inhabituels peuvent signaler une douleur. Si c'est nouveau, consulte ton vétérinaire.",
    errors: ["Crier pour le faire taire (il pense que tu aboies aussi)", "Ignorer sans proposer d'alternative", "Utiliser un collier anti-aboiement"],
  },
  {
    id: "separation",
    name: "Anxiété de séparation",
    emoji: "😰",
    description: "Ton chien panique, détruit ou aboie quand tu pars",
    isFree: false,
    duration: "4-12 semaines",
    steps: [
      "Exercices d'indépendance : apprends-lui \"VA SUR TON TAPIS\" et récompense le calme à distance. Objectif : qu'il soit à l'aise sans contact permanent.",
      "Découple les indices de départ : prends tes clés, mets ton manteau, puis rassieds-toi. Répète jusqu'à ce que ces gestes ne déclenchent plus de stress.",
      "Désensibilisation progressive : sors 1 seconde, reviens. Puis 5s, 15s, 30s, 1min, 3min... JAMAIS dépasser le seuil où il panique.",
    ],
    alarm: "Si ton chien se blesse (griffe les portes, saigne) ou ne mange plus en ton absence, c'est sévère — un vétérinaire comportementaliste peut prescrire un traitement temporaire.",
    errors: ["Punir les destructions au retour (il ne comprend pas)", "Partir longtemps sans préparation", "Faire des adieux dramatiques"],
  },
  {
    id: "noise",
    name: "Peur des bruits",
    emoji: "🎆",
    description: "Ton chien tremble, se cache ou panique lors de bruits forts (orage, feux d'artifice, travaux)",
    isFree: false,
    duration: "2-6 semaines",
    steps: [
      "Désensibilisation sonore : joue les bruits concernés à un volume À PEINE perceptible pendant que ton chien mange ou joue. Association positive uniquement.",
      "Augmente le volume TRÈS progressivement (sur plusieurs jours/semaines). Si ton chien montre le moindre signe de stress, baisse le volume.",
      "Pendant un épisode réel : propose un refuge sécurisant (pièce calme, couverture, white noise). Consoler ton chien est OK — le mythe que ça renforce la peur est faux.",
    ],
    alarm: "Si la peur est généralisée (pas seulement les bruits) ou empire malgré le travail, consulte un comportementaliste.",
    errors: ["Forcer l'exposition au bruit (sensibilisation inversée)", "Ignorer le chien pendant une crise", "Utiliser des pétards pour l'habituer (traumatisant)"],
  },
];

const MILESTONES = [3, 5, 10];

export default function Training() {
   const navigate = useNavigate();
   const [dog, setDog] = useState(null);
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [progresses, setProgresses] = useState([]);
   const [celebration, setCelebration] = useState(null);
   const [milestone, setMilestone] = useState(null);
   const [showFreeGate, setShowFreeGate] = useState(false);
   const [generatingProgram, setGeneratingProgram] = useState(false);
   const [behaviorProgram, setBehaviorProgram] = useState(null);
   const [behaviorBookmarks, setBehaviorBookmarks] = useState([]);

   // Get journey and exercise IDs from URL query params
   const params = new URLSearchParams(window.location.search);
   const journeyId = params.get("journey");
   const exerciseId = params.get("exercise");
   const behaviorId = params.get("behavior");

   useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs?.length > 0) {
        const activeDog = getActiveDog(dogs);
        setDog(activeDog);
        const [progs, bBks] = await Promise.all([
          base44.entities.UserProgress.filter({ user_email: u.email, dog_id: activeDog.id }),
          base44.entities.Bookmark.filter({ dog_id: activeDog.id, source: "behavior_program" }, "-created_at", 5).catch(() => []),
        ]);
        setProgresses(progs || []);
        setBehaviorBookmarks(bBks || []);
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

  // Puppy detection
  const ageMonths = dogAgeMonths(dog);
  const isPuppy = ageMonths !== null && ageMonths < 12;

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
    // Navigate back, preserving journey context if present
    if (journeyId) {
      navigate(createPageUrl("Training") + `?journey=${journeyId}`);
    } else {
      navigate(createPageUrl("Training"));
    }

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
      <div className="min-h-screen bg-background pb-28">
        <div className="gradient-primary safe-pt-16 pb-0 px-5 overflow-hidden relative">
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

   // Exercise detail view (from query param)
   if (exerciseId) {
     const exercise = EXERCISES.find(e => String(e.order_number) === exerciseId);
     if (!exercise) return (
       <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 gap-4">
         <p className="text-lg font-bold text-foreground">Exercice introuvable</p>
         <p className="text-sm text-muted-foreground text-center">Cet exercice n'existe pas ou a ete supprime.</p>
         <Link to={createPageUrl("Training")} className="bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl">Retour au dressage</Link>
       </div>
     );
     const locked = exercise.is_premium && !isPremium;
     const backUrl = journeyId ? createPageUrl("Training") + `?journey=${journeyId}` : createPageUrl("Training");
     return (
       <>
         <ExerciseDetail
           exercise={exercise}
           isCompleted={isCompleted(exercise.order_number)}
           isPremiumLocked={locked}
           dogName={dog?.name}
           dogId={dog?.id}
           onBack={() => navigate(backUrl)}
           onComplete={() => handleComplete(exercise)}
           onHelp={() => handleHelp(exercise)}
         />
         {celebration && (
           <CelebrationScreen
             dogName={dog?.name || "Ton chien"}
             exerciseName={celebration}
             onContinue={() => { setCelebration(null); navigate(backUrl); }}
           />
         )}
       </>
     );
   }

   // Journey detail view (from query param)
   if (journeyId) {
     const journey = JOURNEYS.find(j => j.id === journeyId);
     if (!journey) return (
       <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 gap-4">
         <p className="text-lg font-bold text-foreground">Parcours introuvable</p>
         <p className="text-sm text-muted-foreground text-center">Ce parcours n'existe pas ou a ete supprime.</p>
         <Link to={createPageUrl("Training")} className="bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl">Retour au dressage</Link>
       </div>
     );
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
           onBack={() => navigate(createPageUrl("Training"))}
           onSelectExercise={(order) => navigate(createPageUrl("Training") + `?journey=${journeyId}&exercise=${order}`)}
         />
         <BottomNav currentPage="Training" />
       </>
     );
   }

  // Behavior guide detail
  if (behaviorId) {
    const guide = BEHAVIOR_GUIDES.find(g => g.id === behaviorId);
    if (!guide) return null;
    const locked = !guide.isFree && !isPremium;

    // Find active behavior program for this guide
    let activeProgram = null;
    if (behaviorProgram?.problem_id === guide.id) {
      activeProgram = behaviorProgram;
    } else {
      for (const bk of behaviorBookmarks) {
        try {
          const data = JSON.parse(bk.content);
          if (data.problem_id === guide.id && data.start_date && data.days) {
            const start = new Date(data.start_date + "T00:00:00");
            const now = new Date(); now.setHours(0, 0, 0, 0);
            const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
            if (elapsed >= 0 && elapsed < 7) { activeProgram = data; break; }
          }
        } catch {}
      }
    }

    let todayDay = null, dayIndex = 0, programProgress = 0;
    if (activeProgram?.days) {
      const start = new Date(activeProgram.start_date + "T00:00:00");
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      dayIndex = Math.min(Math.max(elapsed, 0), 6);
      todayDay = activeProgram.days[dayIndex];
      programProgress = Math.round(((dayIndex + 1) / 7) * 100);
    }

    return (
      <div className="min-h-screen bg-background" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}>
        <WellnessBanner />
        <div className="gradient-primary safe-pt-14 pb-6 px-5">
          <button onClick={() => navigate(createPageUrl("Training"))} className="relative z-20 w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2 hover:bg-white/30 transition-colors">
            <ChevronRight className="w-5 h-5 text-white rotate-180" />
          </button>
          <div className="text-center">
            <span className="text-4xl mb-2 block">{guide.emoji}</span>
            <h1 className="text-white font-black text-2xl">{guide.name}</h1>
            <p className="text-white/70 text-sm mt-1">{guide.duration} de travail</p>
          </div>
        </div>

        {locked ? (
          <div className="px-5 pt-6">
            <div className="bg-muted/50 rounded-2xl p-6 text-center border border-border">
              <p className="text-lg mb-2">🔒</p>
              <p className="font-bold text-foreground mb-1">Fiche Premium</p>
              <p className="text-sm text-muted-foreground mb-4">Accede aux 5 fiches comportement avec Premium</p>
              <Link to={createPageUrl("Premium") + "?from=training"} className="inline-block bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl">Debloquer</Link>
            </div>
          </div>
        ) : (
          <div className="px-5 pt-5 space-y-4">
            {/* Steps */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Les 3 etapes</p>
              {guide.steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex gap-3 bg-white rounded-2xl p-4 border border-border/30 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-black text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{step}</p>
                </motion.div>
              ))}
            </div>

            {/* Errors to avoid */}
            {guide.errors && (
              <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2">A ne surtout PAS faire</p>
                <ul className="space-y-1.5">
                  {guide.errors.map((err, i) => (
                    <li key={i} className="text-sm text-red-700 flex gap-2">
                      <span className="shrink-0">✕</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alarm signal */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Quand consulter</p>
              <p className="text-sm text-amber-800 leading-relaxed">{guide.alarm}</p>
            </div>

            {/* Programme comportement 7j — affichage ou generation */}
            {generatingProgram ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
                <p className="font-bold text-sm text-center">Création du programme en cours...</p>
                <p className="text-xs text-muted-foreground text-center max-w-52">L'IA conçoit un programme adapté à {dog?.name}</p>
              </div>
            ) : activeProgram && todayDay ? (
              <div className="space-y-3 mt-2">
                {/* Program header */}
                <div className="gradient-primary rounded-2xl p-5 text-white">
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Programme comportement</p>
                  <h3 className="font-black text-lg leading-tight">{activeProgram.program_title}</h3>
                  <p className="text-white/80 text-xs mt-1.5 leading-relaxed">{activeProgram.summary}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Jour {dayIndex + 1} / 7</span>
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${programProgress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-white/80">{programProgress}%</span>
                  </div>
                </div>

                {/* Today's exercises */}
                <div className="bg-white rounded-2xl border border-blue-200 p-4">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">{todayDay.day_name} — {todayDay.theme}</p>
                  {todayDay.exercises?.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2.5 mt-2.5 first:mt-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {ex.name} <span className="text-xs text-muted-foreground font-normal">({ex.duration_min} min)</span>
                        </p>
                        <p className="text-xs text-foreground/70 leading-relaxed mt-0.5">{ex.description}</p>
                        {ex.tips && <p className="text-[10px] text-blue-600 italic mt-1">{ex.tips}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Environment tips */}
                {todayDay.environment_tips && (
                  <div className="bg-blue-50/80 rounded-2xl px-4 py-3 border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Environnement</p>
                    <p className="text-xs text-blue-800 leading-relaxed">{todayDay.environment_tips}</p>
                  </div>
                )}

                {/* Do / Don't */}
                {(todayDay.do?.length > 0 || todayDay.dont?.length > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    {todayDay.do?.length > 0 && (
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1.5">A faire</p>
                        {todayDay.do.map((d, i) => <p key={i} className="text-xs text-emerald-800 leading-relaxed">✓ {d}</p>)}
                      </div>
                    )}
                    {todayDay.dont?.length > 0 && (
                      <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                        <p className="text-[10px] font-bold text-red-700 uppercase mb-1.5">A eviter</p>
                        {todayDay.dont.map((d, i) => <p key={i} className="text-xs text-red-800 leading-relaxed">✕ {d}</p>)}
                      </div>
                    )}
                  </div>
                )}

                {/* Emergency protocol */}
                {activeProgram.emergency_protocol && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">En cas d'urgence</p>
                    <p className="text-xs text-amber-800 leading-relaxed">{activeProgram.emergency_protocol}</p>
                  </div>
                )}

                {/* Progress indicators */}
                {activeProgram.progress_indicators?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-border p-4">
                    <p className="font-bold text-sm mb-2">Signes de progres a observer</p>
                    {activeProgram.progress_indicators.map((ind, i) => (
                      <p key={i} className="text-xs text-muted-foreground mt-1">✓ {ind}</p>
                    ))}
                  </div>
                )}

                {/* Link to Home */}
                <Link
                  to={createPageUrl("Home")}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm"
                >
                  Suivre le programme sur l'accueil
                </Link>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  if (!isPremium) {
                    navigate(createPageUrl("Premium") + "?from=behavior-program");
                    return;
                  }
                  setGeneratingProgram(true);
                  try {
                    const response = await base44.functions.invoke("generateTrainingProgram", {
                      dogId: dog.id,
                      dogName: dog.name,
                      dogBreed: dog.breed,
                      dogBirthDate: dog.birth_date,
                      activityLevel: dog.activity_level,
                      healthIssues: dog.health_issues,
                      mode: "behavior",
                      problemId: guide.id,
                      problemLabel: guide.name,
                      problemDescription: guide.description,
                    });
                    let program = response.data?.program;
                    if (typeof program === "string") {
                      try { program = JSON.parse(program); } catch {}
                    }
                    if (!program || !program.days) throw new Error("No program returned");
                    const today = new Date().toISOString().slice(0, 10);
                    const programData = { ...program, start_date: today, problem_id: guide.id };
                    await base44.entities.Bookmark.create({
                      dog_id: dog.id,
                      owner: user.email,
                      source: "behavior_program",
                      title: program.program_title || `Programme — ${guide.name}`,
                      content: JSON.stringify(programData),
                      created_at: new Date().toISOString(),
                    });
                    setBehaviorProgram(programData);
                    toast.success("Programme 7 jours activé !");
                  } catch (err) {
                    console.error("Behavior program generation error:", err);
                    toast.error("Erreur lors de la génération. Réessaie.");
                  } finally {
                    setGeneratingProgram(false);
                  }
                }}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg gradient-primary"
              >
                {isPremium ? (
                  <><Sparkles className="w-4 h-4" /> Lancer le programme comportement</>
                ) : (
                  <><Lock className="w-4 h-4" /> Programme comportement — Premium</>
                )}
              </motion.button>
            )}

            {/* CTA Chat */}
            <Link to={createPageUrl("Chat") + `?help=${encodeURIComponent(`J'ai un probleme de ${guide.name.toLowerCase()} avec ${dog?.name || "mon chien"}. Peux-tu m'aider ?`)}`}>
              <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Demander conseil a PawCoach</p>
                  <p className="text-xs text-muted-foreground">L'IA peut t'aider avec ce probleme specifique</p>
                </div>
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </Link>
          </div>
        )}
        <BottomNav currentPage="Training" />
      </div>
    );
  }

  // Main journey list
  return (
    <div className="min-h-screen bg-background pb-28">
      <WellnessBanner />

      {/* Hero header */}
      <div className="gradient-primary safe-pt-16 pb-0 px-5 overflow-hidden relative">
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

      {/* Puppy program banner */}
      {isPuppy && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🐾</span>
            <div>
              <p className="font-bold text-sm text-emerald-900">Programme chiot — {dog.name} ({ageMonths} mois)</p>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                {ageMonths < 4
                  ? `À ${ageMonths} mois, concentre-toi sur la socialisation et les ordres de base (Assis, Couché). Sessions de 2-3 min max !`
                  : ageMonths < 8
                  ? `À ${ageMonths} mois, ${dog.name} est prêt pour les ordres de base + sécurité. Sessions de 5 min, toujours en positif.`
                  : `À ${ageMonths} mois, ${dog.name} peut aborder les exercices intermédiaires. Augmente la durée à 10 min progressivement.`
                }
              </p>
              <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                Recommandé : {ageMonths < 4 ? "2x 2 min" : ageMonths < 8 ? "2x 5 min" : "2x 10 min"} par jour
              </p>
            </div>
          </div>
        </div>
      )}

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
              onClick={() => locked ? navigate(createPageUrl("Premium")) : navigate(createPageUrl("Training") + `?journey=${journey.id}`)}
            />
          );
        })}
      </div>

      {/* Behavior guides section */}
      <div className="px-4 pt-6 space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">Problèmes courants</p>
        {BEHAVIOR_GUIDES.map((guide, idx) => {
          const locked = !guide.isFree && !isPremium;
          return (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: 0.05 * idx }}
              onClick={() => locked ? navigate(createPageUrl("Premium") + "?from=training") : navigate(createPageUrl("Training") + `?behavior=${guide.id}`)}
              className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-border/30 shadow-sm cursor-pointer"
            >
              <span className="text-2xl shrink-0">{guide.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{guide.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{guide.description}</p>
              </div>
              {locked ? (
                <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>

      <BottomNav currentPage="Training" />
    </div>
  );
}