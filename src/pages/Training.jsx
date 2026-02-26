import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, ChevronDown, ChevronUp, Timer, Star, Lock } from "lucide-react";

const EXERCISES_DATA = [
  {
    order_number: 1, name: "Assis", emoji: "🐕", level: "debutant", duration: "10 min", is_premium: false,
    description: "La base de tout dressage – indispensable pour la sécurité.",
    steps: ["Tenez une friandise devant le museau de votre chien.", "Remontez lentement la friandise au-dessus de sa tête.", "Quand il s'assoit naturellement, dites 'Assis' et donnez la friandise.", "Répétez 5 fois, puis progressivement réduire la friandise.", "Pratiquez dans différents endroits et situations."]
  },
  {
    order_number: 2, name: "Couché", emoji: "😴", level: "debutant", duration: "10 min", is_premium: false,
    description: "Parfait pour les moments de calme et les lieux publics.",
    steps: ["Demandez d'abord 'Assis'.", "Placez une friandise devant son museau, puis descendez-la vers le sol.", "Déplacez-la lentement entre ses pattes.", "Dès qu'il se couche, dites 'Couché' et récompensez.", "Augmentez progressivement la durée avant la récompense."]
  },
  {
    order_number: 3, name: "Pas bouger", emoji: "🧊", level: "debutant", duration: "15 min", is_premium: false,
    description: "Un ordre de sécurité crucial dans toutes les situations.",
    steps: ["Demandez 'Assis' ou 'Couché'.", "Montrez votre paume ouverte et dites 'Pas bouger'.", "Faites un pas en arrière, revenez et récompensez.", "Augmentez progressivement la distance et la durée.", "Introduisez des distractions pour solidifier l'ordre."]
  },
  {
    order_number: 4, name: "Rappel", emoji: "📣", level: "intermediaire", duration: "20 min", is_premium: true,
    description: "L'ordre le plus important pour la sécurité en extérieur.",
    steps: ["Commencez en intérieur, distance courte.", "Appelez son prénom + 'Viens' avec enthousiasme.", "Récompensez généreusement à chaque retour réussi.", "Augmentez progressivement la distance.", "Pratiquez en laisse longue avant le rappel sans laisse.", "Ne jamais gronder après un rappel, même tardif."]
  },
  {
    order_number: 5, name: "Marche en laisse", emoji: "🚶", level: "intermediaire", duration: "20 min", is_premium: true,
    description: "Promenades agréables sans tirer sur la laisse.",
    steps: ["Commencez avec votre chien à votre gauche.", "Dès qu'il tire, arrêtez-vous complètement.", "Reprenez quand la laisse se détend.", "Récompensez fréquemment quand il marche bien.", "Progressez vers des environnements plus distractifs."]
  },
  {
    order_number: 6, name: "Lâche / Donne", emoji: "🎾", level: "intermediaire", duration: "15 min", is_premium: true,
    description: "Essentiel pour les jeux et la sécurité.",
    steps: ["Jouez avec un jouet avec votre chien.", "Présentez une friandise près de son museau.", "Quand il lâche, dites 'Lâche' et donnez la friandise.", "Rendez le jouet immédiatement pour qu'il comprenne.", "Pratiquez régulièrement sans friandise ensuite."]
  },
  {
    order_number: 7, name: "Place", emoji: "🛏️", level: "intermediaire", duration: "20 min", is_premium: true,
    description: "Envoyer votre chien à son coin/panier sur commande.",
    steps: ["Placez votre chien près de son panier.", "Guidez-le vers le panier avec une friandise.", "Quand les 4 pattes sont dedans, dites 'Place' et récompensez.", "Augmentez la durée avec 'Pas bouger'.", "Pratiquez depuis différentes positions dans la pièce."]
  },
  {
    order_number: 8, name: "Tourne", emoji: "🔄", level: "avance", duration: "15 min", is_premium: true,
    description: "Un tour sur lui-même – pour stimuler et épater !",
    steps: ["Tenez une friandise devant le museau de votre chien.", "Tracez lentement un cercle complet avec la friandise.", "Quand il complète le tour, récompensez.", "Ajoutez le signal verbal 'Tourne'.", "Ensuite, remplacez la friandise par un geste de la main."]
  },
  {
    order_number: 9, name: "Saute par-dessus", emoji: "🏃", level: "avance", duration: "20 min", is_premium: true,
    description: "Agility de base – excellent exercice physique et mental.",
    steps: ["Commencez avec une très basse barrière (5 cm).", "Encouragez à passer par-dessus avec une friandise de l'autre côté.", "Dites 'Saute' quand il passe.", "Augmentez très progressivement la hauteur.", "Ne jamais forcer – adapter à la taille et l'âge du chien."]
  },
  {
    order_number: 10, name: "Cherche", emoji: "🔍", level: "avance", duration: "25 min", is_premium: true,
    description: "Stimulation olfactive intense – le nez de votre chien au travail.",
    steps: ["Cachez une friandise bien en vue d'abord.", "Dites 'Cherche' et laissez-le trouver.", "Félicitez avec enthousiasme.", "Rendez la cachette progressivement plus difficile.", "Utilisez un jouet préféré comme récompense finale."]
  },
];

const LEVEL_CONFIG = {
  debutant: { label: "Débutant", color: "text-safe bg-green-50 border-green-200", stars: 1 },
  intermediaire: { label: "Intermédiaire", color: "text-amber-600 bg-amber-50 border-amber-200", stars: 2 },
  avance: { label: "Avancé", color: "text-purple-600 bg-purple-50 border-purple-200", stars: 3 },
};

export default function Training() {
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [progresses, setProgresses] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const dogs = await base44.entities.Dog.filter({ owner: u.email });
    if (dogs.length > 0) {
      setDog(dogs[0]);
      const progs = await base44.entities.UserProgress.filter({ user_email: u.email, dog_id: dogs[0].id });
      setProgresses(progs);
    }
  };

  const isCompleted = (exerciseOrder) =>
    progresses.some(p => p.exercise_id === String(exerciseOrder) && p.completed);

  const completedCount = EXERCISES_DATA.filter(e => isCompleted(e.order_number)).length;

  const toggleComplete = async (exercise) => {
    if (!dog || !user) return;
    const key = String(exercise.order_number);
    const existing = progresses.find(p => p.exercise_id === key);
    setCompleting(exercise.order_number);

    if (existing && existing.completed) {
      await base44.entities.UserProgress.update(existing.id, { completed: false, completed_date: null });
      setProgresses(prev => prev.map(p => p.id === existing.id ? { ...p, completed: false } : p));
    } else if (existing) {
      await base44.entities.UserProgress.update(existing.id, { completed: true, completed_date: new Date().toISOString().split("T")[0] });
      setProgresses(prev => prev.map(p => p.id === existing.id ? { ...p, completed: true } : p));
    } else {
      const newP = await base44.entities.UserProgress.create({
        user_email: user.email,
        dog_id: dog.id,
        exercise_id: key,
        completed: true,
        completed_date: new Date().toISOString().split("T")[0],
      });
      setProgresses(prev => [...prev, newP]);
    }
    setCompleting(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      <div className="gradient-primary pt-10 pb-6 px-5">
        <h1 className="text-white font-bold text-xl mb-1">Coach Dressage</h1>
        <p className="text-white/70 text-sm">
          {dog ? `Entraînement avec ${dog.name}` : "Chargement..."}
        </p>

        {/* Progress bar */}
        <div className="mt-4 bg-white/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">Progression globale</span>
            <span className="text-white font-bold">{completedCount} / {EXERCISES_DATA.length}</span>
          </div>
          <div className="bg-white/30 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-700"
              style={{ width: `${(completedCount / EXERCISES_DATA.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-3">
        {EXERCISES_DATA.map(exercise => {
          const done = isCompleted(exercise.order_number);
          const levelCfg = LEVEL_CONFIG[exercise.level];
          const isOpen = expanded === exercise.order_number;

          return (
            <Card
              key={exercise.order_number}
              className={`shadow-none transition-all duration-200 ${done ? "border-green-200 bg-green-50/30" : "border-border"}`}
            >
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left tap-scale"
                  onClick={() => setExpanded(isOpen ? null : exercise.order_number)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
                    {done ? "✅" : exercise.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {exercise.name}
                      </p>
                      {exercise.is_premium && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                          <Lock className="w-2.5 h-2.5" /> Premium
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${levelCfg.color}`}>
                        {levelCfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="w-3 h-3" />
                        {exercise.duration}
                      </span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 animate-slide-up">
                    <p className="text-sm text-muted-foreground mb-3">{exercise.description}</p>
                    <div className="space-y-2 mb-4">
                      {exercise.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-5 h-5 rounded-full bg-secondary text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => toggleComplete(exercise)}
                      disabled={completing === exercise.order_number}
                      className={`w-full h-10 rounded-xl gap-2 font-semibold ${
                        done
                          ? "bg-muted text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive"
                          : "gradient-primary border-0 text-white shadow-md shadow-primary/25"
                      }`}
                    >
                      {done ? (
                        <><Circle className="w-4 h-4" /> Marquer comme non fait</>
                      ) : (
                        <><CheckCircle className="w-4 h-4" /> Marquer comme fait !</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <BottomNav currentPage="Training" />
    </div>
  );
}