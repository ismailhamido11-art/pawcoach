import { useMemo } from "react";

const TIPS = [
  { text: "Les chiens qui marchent 30 min par jour vivent en moyenne 2 ans de plus.", img: "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=200&q=80" },
  { text: "Un chien bien hydrate digere mieux et a plus d'energie pour jouer.", img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&q=80" },
  { text: "Les caresses lentes sur le flanc reduisent le stress de ton chien de 40%.", img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=80" },
  { text: "Varier les parcours de balade stimule le cerveau de ton compagnon.", img: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=200&q=80" },
  { text: "Le jeu de flair fatigue 3 fois plus qu'une balade classique.", img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&q=80" },
];

export default function EmotionalTip({ dog }) {
  const tip = useMemo(() => {
    const dayIndex = new Date().getDate() % TIPS.length;
    return TIPS[dayIndex];
  }, []);

  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-[#E8F5F0] to-[#FEF0E8] rounded-[20px] p-4 overflow-hidden">
      <img
        src={tip.img}
        alt=""
        className="w-[68px] h-[68px] rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#1A4D3E]">Le savais-tu ?</p>
        <p className="text-[12px] text-gray-500 mt-1 leading-[1.5]">{tip.text}</p>
      </div>
    </div>
  );
}
