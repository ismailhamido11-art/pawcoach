import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lightbulb, ChevronRight, Sparkles } from "lucide-react";
import { buildRecommendations } from "@/utils/recommendations";

// 25 tips rotating daily — {name} and {breed} are replaced dynamically
const TIPS = [
  // Health
  "Un check-in quotidien de 30 secondes peut detecter des problemes de sante precocement chez {name}",
  "Les soins dentaires sont souvent negliges. Pense a verifier les dents de {name} regulierement",
  "Le stress peut affecter l'appetit et l'humeur de {name}. Un environnement calme et previsible aide",
  "Les vaccins de rappel sont aussi importants que les premiers vaccins. Un retard de quelques semaines peut laisser {name} sans protection",
  "Surveille le poids de {name} chaque mois : un surpoids de 10% augmente les risques articulaires de 30%",
  "Les puces et tiques sont actives des le printemps. Verifie le traitement antiparasitaire de {name}",
  // Nutrition
  "{name} devrait boire environ 50ml d'eau par kg de poids par jour. Change l'eau au moins 2 fois",
  "Le chocolat, le raisin, l'oignon et l'ail sont toxiques pour les chiens — meme en petite quantite",
  "Les croquettes de qualite doivent avoir une proteine animale en premier ingredient. Verifie l'etiquette !",
  "Un changement d'alimentation doit se faire progressivement sur 7 jours pour eviter les troubles digestifs",
  "Les os cuits sont dangereux — ils peuvent se fragmenter. Prefere les os crus ou les jouets a macher",
  // Activity
  "{name} a besoin de stimulation physique ET mentale chaque jour pour rester equilibre",
  "Varie les parcours de promenade ! Les nouvelles odeurs stimulent le cerveau de {name} autant que l'exercice",
  "15 minutes de jeu interactif par jour renforcent votre lien et la confiance de {name}",
  "Un chien fatigue mentalement est plus calme qu'un chien fatigue physiquement. Essaie les jeux de flair !",
  "La socialisation ne s'arrete pas apres le chiot. Expose {name} regulierement a de nouvelles situations",
  // Breed-aware
  "Chaque race a ses predispositions de sante. Renseigne-toi sur celles des {breed} pour mieux prevenir",
  "L'esperance de vie de {name} depend enormement de la qualite de ses soins quotidiens",
  "Adapte les portions de {name} a son age, son poids actuel et son niveau d'activite — pas juste la notice du paquet",
  "Un brossage regulier permet de reperer tot les problemes de peau, les parasites et les masses inhabituelles",
  // Fun facts
  "Le nez de chaque chien est unique, comme une empreinte digitale humaine",
  "Les chiens revent pendant le sommeil paradoxal — ils revivent souvent leurs aventures de la journee",
  "Un chien peut apprendre en moyenne 165 mots et signaux. Certains prodiges jusqu'a 250 !",
  "Les chiens percoivent les odeurs 100 000 fois mieux que nous. Une promenade est un festival sensoriel pour {name}",
  "Les chiens voient en bleu et jaune, pas en noir et blanc comme on le croit souvent",
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

export default function DailyCoaching({ dog, records, exercises, scans, dailyLogs, todayCheckin, streak }) {
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
  });

  // If todayCheckin exists, TodayCard already shows rec[0] — skip it here
  const topRecs = todayCheckin ? recs.slice(1, 3) : recs.slice(0, 2);

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

      {/* Smart recommendations */}
      {topRecs.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-white/80 backdrop-blur-sm p-3.5 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary opacity-[0.05]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Pour {dog?.name || "ton chien"} aujourd'hui</p>
            </div>
            <div className="space-y-1">
              {topRecs.map((rec) => (
                <Link key={rec.id} to={createPageUrl(rec.page)}>
                  <div className="flex items-center gap-2.5 py-2 group">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${rec.iconColor}20, ${rec.iconColor}10)`,
                        border: `1px solid ${rec.iconColor}20`,
                      }}
                    >
                      <rec.icon className="w-3.5 h-3.5" style={{ color: rec.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate">{rec.label}</p>
                      <p className="text-[10px] text-muted-foreground">{rec.sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
