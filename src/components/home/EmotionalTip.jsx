import { useMemo } from "react";

const TIPS = [
  { text: "Les chiens qui marchent 30 min par jour vivent en moyenne 2 ans de plus.", cat: "activite" },
  { text: "Un chien bien hydrate digere mieux et a plus d'energie pour jouer.", cat: "nutrition" },
  { text: "Les caresses lentes sur le flanc reduisent le stress de ton chien de 40%.", cat: "bien-etre" },
  { text: "Varier les parcours de balade stimule le cerveau de ton compagnon.", cat: "activite" },
  { text: "Le jeu de flair fatigue 3 fois plus qu'une balade classique.", cat: "activite" },
  { text: "Les chiens reconnaissent plus de 150 mots — parle-lui souvent.", cat: "bien-etre" },
  { text: "Un brossage hebdomadaire renforce le lien et detecte les problemes de peau.", cat: "sante" },
  { text: "Les chiots ont besoin de 18h de sommeil par jour pour bien grandir.", cat: "sante" },
  { text: "Le contact visuel avec ton chien libere de l'ocytocine — l'hormone du bonheur.", cat: "bien-etre" },
  { text: "Les legumes verts cuits sont un excellent complement a la ration de ton chien.", cat: "nutrition" },
  { text: "Un chien qui mastique regulierement a 80% moins de tartre dentaire.", cat: "sante" },
  { text: "Les jeux d'intelligence reduisent l'anxiete de separation de 60%.", cat: "bien-etre" },
  { text: "Apres une balade, une friandise saine renforce le rappel positif.", cat: "activite" },
  { text: "Les chiens sentent 10 000 fois mieux que nous — le flair est leur superpouvoir.", cat: "bien-etre" },
  { text: "Un repas a heure fixe ameliore la digestion et reduit le stress.", cat: "nutrition" },
  { text: "Les races nordiques ont besoin de 2x plus d'activite que la moyenne.", cat: "activite" },
  { text: "Le poids ideal de ton chien se verifie au toucher des cotes.", cat: "sante" },
  { text: "Un chien sociabilise avant 4 mois sera plus equilibre toute sa vie.", cat: "bien-etre" },
  { text: "La courgette est l'un des legumes les plus sains et digestes pour un chien.", cat: "nutrition" },
  { text: "Marcher cote a cote sans tirer sur la laisse prend en moyenne 3 semaines.", cat: "activite" },
];

const CAT_ICONS = {
  "activite": "🏃",
  "nutrition": "🥕",
  "sante": "💚",
  "bien-etre": "🐾",
};

export default function EmotionalTip({ dog, dailyLogs, recentCheckins }) {
  const tip = useMemo(() => {
    // Rotate through tips — one new tip per day, never repeats within 20 days
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return TIPS[dayOfYear % TIPS.length];
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#E8F5F0] to-[#FEF0E8] rounded-[20px] p-4 overflow-hidden">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{CAT_ICONS[tip.cat] || "🐾"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#1A4D3E]">Le savais-tu ?</p>
          <p className="text-[12px] text-gray-500 mt-1 leading-[1.6]">{tip.text}</p>
        </div>
      </div>
    </div>
  );
}
