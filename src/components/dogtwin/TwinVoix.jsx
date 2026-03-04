import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";

const LETTERS = [
  {
    week: "Cette semaine",
    date: "24 fév – 2 mars 2026",
    mood: "😌",
    letter: `Bonjour ! Cette semaine, j'ai été un peu plus calme que d'habitude. Le mardi et le mercredi, mon appétit n'était pas au top — j'ai laissé quelques croquettes dans ma gamelle, ce qui m'arrive rarement.

Je pense que la chaleur de ces derniers jours m'a un peu fatigué. Mes balades étaient bonnes, surtout celle du samedi matin qui était super longue ! Merci pour ça 🐾

Mon conseil pour la semaine prochaine : pensez à me proposer de l'eau plus fraîche et peut-être réduire un peu ma ration si mon appétit reste en baisse. Je file droit, promis !`,
    highlights: ["Appétit -18% mer & jeu", "Balade +40 min samedi", "Énergie stable globalement"],
    score: 78,
  },
  {
    week: "Semaine précédente",
    date: "17 – 23 fév 2026",
    mood: "🥳",
    letter: `Quelle semaine incroyable ! J'ai eu de la visite — un autre chien est venu à la maison et on a joué pendant des heures. Mon énergie était au maximum, j'étais sur un nuage !

Les nouvelles croquettes Royal Canin commencent vraiment à me convenir. Je sens que j'ai plus d'énergie le matin et ma digestion est bien meilleure qu'avant.

Bilan : une des meilleures semaines depuis longtemps. Si vous pouvez réinviter mon ami Toffi... je dis ça, je dis rien 🐶`,
    highlights: ["Score énergie : 96/100", "Visite d'un autre chien", "Digestion : excellente"],
    score: 94,
  },
];

export default function TwinVoix() {
  const [idx, setIdx] = useState(0);
  const letter = LETTERS[idx];

  const scoreColor = s => s >= 85 ? "#34d399" : s >= 65 ? "#f59e0b" : "#ff6b8a";

  return (
    <div className="px-4 pt-3 pb-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-pink-400" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">La Voix de Max</p>
          <p className="text-white/40 text-[10px]">Lettre hebdomadaire générée par l'IA</p>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIdx(i => Math.min(LETTERS.length - 1, i + 1))}
          disabled={idx >= LETTERS.length - 1}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">{letter.week}</p>
          <p className="text-white/40 text-[10px]">{letter.date}</p>
        </div>
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx <= 0}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {/* Letter card */}
          <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
            {/* Letter header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{letter.mood}</span>
                <div>
                  <p className="text-white font-bold text-sm">Max t'écrit</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color: scoreColor(letter.score) }}>
                      Humeur {letter.score}/100
                    </span>
                  </div>
                </div>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Volume2 className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>

            {/* Letter body */}
            <div className="px-4 py-4">
              <p className="text-white/75 text-sm leading-7 whitespace-pre-line">{letter.letter}</p>
            </div>

            {/* Highlights */}
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {letter.highlights.map((h, i) => (
                <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/8 text-white/50 border border-white/10">
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {LETTERS.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === idx ? "#fff" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}