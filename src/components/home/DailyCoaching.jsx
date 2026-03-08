import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lightbulb, ChevronRight, Sparkles } from "lucide-react";
import { buildRecommendations } from "@/utils/recommendations";

// 25 tips rotating daily — {name} and {breed} are replaced dynamically
const TIPS = [
  // Health
  "Un check-in quotidien de 30 secondes peut détecter des problèmes de santé précocement chez {name}",
  "Les soins dentaires sont souvent négligés. Pense à vérifier les dents de {name} régulièrement",
  "Le stress peut affecter l'appétit et l'humeur de {name}. Un environnement calme et prévisible aide",
  "Les vaccins de rappel sont aussi importants que les premiers vaccins. Un retard de quelques semaines peut laisser {name} sans protection",
  "Surveille le poids de {name} chaque mois : un surpoids de 10% augmente les risques articulaires de 30%",
  "Les puces et tiques sont actives dès le printemps. Vérifie le traitement antiparasitaire de {name}",
  // Nutrition
  "{name} devrait boire environ 50ml d'eau par kg de poids par jour. Change l'eau au moins 2 fois",
  "Le chocolat, le raisin, l'oignon et l'ail sont toxiques pour les chiens — même en petite quantité",
  "Les croquettes de qualité doivent avoir une protéine animale en premier ingrédient. Vérifie l'étiquette !",
  "Un changement d'alimentation doit se faire progressivement sur 7 jours pour éviter les troubles digestifs",
  "Les os cuits sont dangereux — ils peuvent se fragmenter. Préfère les os crus ou les jouets à mâcher",
  // Activity
  "{name} a besoin de stimulation physique ET mentale chaque jour pour rester équilibré",
  "Varie les parcours de promenade ! Les nouvelles odeurs stimulent le cerveau de {name} autant que l'exercice",
  "15 minutes de jeu interactif par jour renforcent ton lien et la confiance de {name}",
  "Un chien fatigué mentalement est plus calme qu'un chien fatigué physiquement. Essaie les jeux de flair !",
  "La socialisation ne s'arrête pas après le chiot. Expose {name} régulièrement à de nouvelles situations",
  // Breed-aware
  "Chaque race a ses prédispositions de santé. Renseigne-toi sur celles des {breed} pour mieux prévenir",
  "L'espérance de vie de {name} dépend énormément de la qualité de ses soins quotidiens",
  "Adapte les portions de {name} à son âge, son poids actuel et son niveau d'activité — pas juste la notice du paquet",
  "Un brossage régulier permet de repérer tôt les problèmes de peau, les parasites et les masses inhabituelles",
  // Fun facts
  "Le nez de chaque chien est unique, comme une empreinte digitale humaine",
  "Les chiens rêvent pendant le sommeil paradoxal — ils revivent souvent leurs aventures de la journée",
  "Un chien peut apprendre en moyenne 165 mots et signaux. Certains prodiges jusqu'à 250 !",
  "Les chiens perçoivent les odeurs 100 000 fois mieux que nous. Une promenade est un festival sensoriel pour {name}",
  "Les chiens voient en bleu et jaune, pas en noir et blanc comme on le croit souvent",
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

export default function DailyCoaching({ dog, records = [], exercises = [], scans = [], dailyLogs = [], todayCheckin, streak, diagnosisReports = [], nutritionPlans = [] }) {
  const dayIndex = getDayOfYear();
  const tip = TIPS[dayIndex % TIPS.length]
    .replace(/\{name\}/g, dog?.name || "ton chien")
    .replace(/\{breed\}/g, dog?.breed || "chiens");

  const recs = buildRecommendations({
    records: records || [],
    exercises: exercises || [],
    scans: scans || [],
    checkins: [],
    dailyLogs: dailyLogs || [],
    todayCheckin,
    streak,
    diagnosisReports: diagnosisReports || [],
    nutritionPlans: nutritionPlans || [],
  });

  // Filter out "Home" recs (we're already on Home, they go nowhere)
  const actionableRecs = recs.filter(r => r.page !== "Home");
  const topRecs = actionableRecs.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.15 }}
      className="mx-4 space-y-3"
    >
      {/* Daily tip */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-3.5 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-amber-400 opacity-[0.06]" />
        <div className="relative flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-700/80 uppercase tracking-wider mb-1">Le savais-tu ?</p>
            <p className="text-[12px] text-foreground/80 leading-relaxed">{tip}</p>
          </div>
        </div>
      </div>

      {/* Next Best Action — hero + mini badges */}
      {topRecs.length > 0 && (() => {
        const hero = topRecs[0];
        const HeroIcon = hero.icon;
        const mini = topRecs.slice(1, 3);
        return (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Pour {dog?.name || "ton chien"} aujourd'hui</p>
            </div>

            {/* Hero card */}
            <Link to={createPageUrl(hero.page) + (hero.tab ? `?tab=${hero.tab}` : "")}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-md border border-border/30 border-l-4 ${hero.accent} cursor-pointer`}
              >
                <div className={`w-12 h-12 rounded-2xl ${hero.iconBg} flex items-center justify-center shrink-0`}>
                  <HeroIcon className="w-6 h-6" style={{ color: hero.iconColor }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-foreground text-[15px] leading-tight">{hero.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{hero.sub}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs font-bold text-primary">{hero.cta}</span>
                  <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </motion.div>
            </Link>

            {/* Mini badges */}
            {mini.length > 0 && (
              <div className="flex gap-2 mt-2">
                {mini.map((rec) => (
                  <Link key={rec.id} to={createPageUrl(rec.page) + (rec.tab ? `?tab=${rec.tab}` : "")} className="flex-1">
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-border/20 cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg ${rec.iconBg} flex items-center justify-center shrink-0`}>
                        <rec.icon className="w-4 h-4" style={{ color: rec.iconColor }} strokeWidth={2} />
                      </div>
                      <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">{rec.label}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </motion.div>
  );
}
