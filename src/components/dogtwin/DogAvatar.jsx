/**
 * DogAvatar — SVG premium animé, connecté aux données réelles
 * 
 * Props:
 *  - healthScore: 0-100 (score global de santé)
 *  - mood: 'happy' | 'neutral' | 'tired' | 'excited'
 *  - size: 'sm' | 'md' | 'lg' | 'xl'
 *  - streak: number (jours consécutifs)
 *  - interactive: bool (pulsation au tap)
 *  - onClick: fn
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Couleur de l'aura selon score
const auraColor = (score) => {
  if (score >= 85) return { primary: "#34d399", secondary: "#10b981", glow: "#34d39960" };
  if (score >= 65) return { primary: "#f59e0b", secondary: "#d97706", glow: "#f59e0b55" };
  return { primary: "#ff6b8a", secondary: "#e11d48", glow: "#ff6b8a55" };
};

// Hauteur des yeux selon humeur
const eyeConfig = (_mood) => ({
  happy:   { scaleY: 0.45, pupilY: 0, shine: true },
  excited: { scaleY: 1.2,  pupilY: -1, shine: true },
  neutral: { scaleY: 0.85, pupilY: 0, shine: true },
  tired:   { scaleY: 0.3,  pupilY: 1, shine: false },
});

// Paramètres de taille
const sizeMap = {
  sm:  { px: 72,  viewBox: "0 0 120 130" },
  md:  { px: 110, viewBox: "0 0 120 130" },
  lg:  { px: 160, viewBox: "0 0 120 130" },
  xl:  { px: 220, viewBox: "0 0 120 130" },
};

export default function DogAvatar({
  healthScore = 82,
  mood = "happy",
  size = "md",
  streak = 0,
  interactive = false,
  onClick,
}) {
  const aura = auraColor(healthScore);
  const eyes = eyeConfig(mood);
  const { px, viewBox } = sizeMap[size] || sizeMap.md;
  const [tapped, setTapped] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  const handleTap = () => {
    if (!interactive) return;
    setTapped(true);
    setSparkles([...Array(5)].map((_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 40 + (Math.random() - 0.5) * 40,
      angle: (Math.random() * 360),
    })));
    setTimeout(() => { setTapped(false); setSparkles([]); }, 700);
    onClick?.();
  };

  // Vitesse queue selon humeur
  const tailSpeed = mood === 'excited' ? 1.0 : mood === 'happy' ? 1.8 : mood === 'tired' ? 4 : 2.5;
  const tailAmp = mood === 'excited' ? 22 : mood === 'happy' ? 16 : mood === 'tired' ? 5 : 12;

  // Vitesse respiration
  const breathSpeed = mood === 'tired' ? 3.5 : 2;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: px, height: px }}
      onClick={handleTap}
    >
      {/* Aura glow externe */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: breathSpeed * 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${aura.glow} 0%, transparent 70%)`,
          transform: "scale(1.3)",
        }}
      />

      {/* Cercle de fond */}
      <motion.div
        animate={{ scale: tapped ? 0.92 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 40% 35%, #1e3d35, #0d2218)`,
          border: `2px solid ${aura.primary}44`,
          boxShadow: `0 0 24px ${aura.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      />

      {/* Score arc SVG */}
      <svg
        className="absolute inset-0"
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={px / 2} cy={px / 2}
          r={(px / 2) - 4}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2.5"
        />
        <motion.circle
          cx={px / 2} cy={px / 2}
          r={(px / 2) - 4}
          fill="none"
          stroke={aura.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${((px - 8) * Math.PI)}`}
          initial={{ strokeDashoffset: (px - 8) * Math.PI }}
          animate={{ strokeDashoffset: (px - 8) * Math.PI * (1 - healthScore / 100) }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 4px ${aura.primary})` }}
        />
      </svg>

      {/* SVG Avatar du chien */}
      <motion.svg
        width={px * 0.72}
        height={px * 0.72}
        viewBox={viewBox}
        className="relative z-10"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: breathSpeed, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* === QUEUE (wag) === */}
        <motion.path
          d="M 88 88 Q 100 72 105 58 Q 108 46 100 40"
          fill="none"
          stroke="#c4956a"
          strokeWidth="7"
          strokeLinecap="round"
          animate={{ rotate: [0, tailAmp, -tailAmp * 0.6, tailAmp * 0.4, 0] }}
          transition={{ duration: tailSpeed, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
          style={{ transformOrigin: "88px 88px" }}
        />
        {/* Bout queue */}
        <motion.circle
          cx="100" cy="40" r="5"
          fill="#e8cfa0"
          animate={{ rotate: [0, tailAmp, -tailAmp * 0.6, tailAmp * 0.4, 0] }}
          transition={{ duration: tailSpeed, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
          style={{ transformOrigin: "88px 88px" }}
        />

        {/* === CORPS === */}
        <ellipse cx="60" cy="82" rx="33" ry="28" fill="#c4956a" />
        {/* Ventre clair */}
        <ellipse cx="60" cy="87" rx="18" ry="16" fill="#e8cfa0" opacity="0.7" />

        {/* === PATTES ARRIÈRE === */}
        <ellipse cx="36" cy="104" rx="9" ry="6" fill="#7a4a28" />
        <ellipse cx="84" cy="104" rx="9" ry="6" fill="#7a4a28" />

        {/* === PATTES AVANT === */}
        <motion.g
          animate={mood === 'excited' ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
        >
          <rect x="38" y="96" width="12" height="16" rx="6" fill="#c4956a" />
          <ellipse cx="44" cy="113" rx="7" ry="5" fill="#7a4a28" />
        </motion.g>
        <motion.g
          animate={mood === 'excited' ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror", delay: 0.25 }}
        >
          <rect x="70" y="96" width="12" height="16" rx="6" fill="#c4956a" />
          <ellipse cx="76" cy="113" rx="7" ry="5" fill="#7a4a28" />
        </motion.g>

        {/* === COU === */}
        <ellipse cx="60" cy="60" rx="16" ry="12" fill="#c4956a" />

        {/* === COLLIER (couleur brand) === */}
        <rect x="44" y="63" width="32" height="7" rx="3.5" fill="#2d9f82" />
        {/* Médaille */}
        <circle cx="60" cy="72" r="4" fill="#ffd700" />
        <text x="60" y="75" textAnchor="middle" fontSize="4" fontWeight="bold" fill="#1a0d06">P</text>

        {/* === TÊTE === */}
        <motion.g
          animate={mood === 'excited' ? { rotate: [-4, 4, -4] } : { rotate: 0 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "60px 42px" }}
        >
          <ellipse cx="60" cy="42" rx="28" ry="26" fill="#c4956a" />
          {/* Dôme crâne */}
          <ellipse cx="60" cy="24" rx="18" ry="14" fill="#b8845c" />

          {/* === OREILLES (floppy) === */}
          <motion.ellipse
            cx="33" cy="32" rx="10" ry="16" fill="#7a4a28"
            style={{ transformOrigin: "33px 22px" }}
            animate={{ rotate: mood === 'excited' ? [-8, 4, -8] : [0, -4, 0] }}
            transition={{ duration: tailSpeed * 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="87" cy="32" rx="10" ry="16" fill="#7a4a28"
            style={{ transformOrigin: "87px 22px" }}
            animate={{ rotate: mood === 'excited' ? [8, -4, 8] : [0, 4, 0] }}
            transition={{ duration: tailSpeed * 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />

          {/* === MUSEAU === */}
          <ellipse cx="60" cy="53" rx="14" ry="10" fill="#e8cfa0" />
          {/* Truffe */}
          <ellipse cx="60" cy="48" rx="7" ry="5" fill="#1a0d06" />
          <ellipse cx="58" cy="47" rx="2" ry="1.5" fill="#333" opacity="0.6" />
          {/* Narines */}
          <ellipse cx="57" cy="49" rx="2" ry="1.2" fill="#0d0600" />
          <ellipse cx="63" cy="49" rx="2" ry="1.2" fill="#0d0600" />
          {/* Bouche */}
          {mood === 'happy' || mood === 'excited' ? (
            <>
              <path d="M 52 55 Q 55 59 60 60 Q 65 59 68 55" fill="none" stroke="#7a4a28" strokeWidth="1.8" strokeLinecap="round" />
              <ellipse cx="60" cy="59" rx="5" ry="3" fill="#ff9999" opacity="0.8" />
            </>
          ) : (
            <path d="M 54 57 Q 60 56 66 57" fill="none" stroke="#7a4a28" strokeWidth="1.8" strokeLinecap="round" />
          )}

          {/* === YEUX === */}
          {[34, 86].map((ex, i) => (
            <g key={i}>
              {/* Blanc œil (ombre) */}
              <ellipse cx={ex} cy="37" rx="8" ry="8" fill="#1a0d06" opacity="0.3" />
              {/* Iris */}
              <motion.ellipse
                cx={ex} cy="37"
                rx="6.5"
                ry={6.5 * eyes.scaleY}
                fill="#0d0600"
                animate={{ scaleY: [eyes.scaleY, eyes.scaleY * (mood === 'tired' ? 0.95 : 0.88), eyes.scaleY] }}
                transition={{ duration: 3.5 + i, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Pupille */}
              <ellipse cx={ex} cy={37 + eyes.pupilY} rx="3.5" ry="3.5" fill="#2d1a08" />
              {/* Éclat */}
              {eyes.shine && (
                <ellipse cx={ex + 2} cy={35 + eyes.pupilY} rx="2" ry="2" fill="white" opacity="0.9" />
              )}
              {/* Clin d'œil occasionnel */}
              <motion.rect
                x={ex - 7} y={31}
                width="14" height="13"
                rx="7"
                fill="#c4956a"
                animate={{ scaleY: [0, 1, 0] }}
                transition={{
                  duration: 0.18,
                  repeat: Infinity,
                  repeatDelay: 5 + i * 2.3,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: `${ex}px 37px` }}
              />
            </g>
          ))}

          {/* Sourcils expressifs */}
          {mood === 'tired' && (
            <>
              <path d="M 28 30 Q 34 26 40 30" fill="none" stroke="#7a4a28" strokeWidth="2" strokeLinecap="round" />
              <path d="M 80 30 Q 86 26 92 30" fill="none" stroke="#7a4a28" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {mood === 'excited' && (
            <>
              <path d="M 28 28 Q 34 24 40 28" fill="none" stroke="#7a4a28" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 80 28 Q 86 24 92 28" fill="none" stroke="#7a4a28" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </motion.g>
      </motion.svg>

      {/* Sparkles au tap */}
      <AnimatePresence>
        {sparkles.map(s => (
          <motion.div
            key={s.id}
            className="absolute pointer-events-none text-base"
            style={{ left: `${s.x}%`, top: `${s.y}%`, rotate: s.angle }}
            initial={{ opacity: 1, scale: 0, y: 0 }}
            animate={{ opacity: 0, scale: 1.4, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            ✨
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Badge streak */}
      {streak >= 3 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg z-20"
          style={{ background: aura.primary, boxShadow: `0 0 8px ${aura.glow}` }}
        >
          🔥
        </motion.div>
      )}

      {/* Score label (petit) */}
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black z-20"
        style={{ background: aura.primary, color: "#fff", boxShadow: `0 2px 8px ${aura.glow}` }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        {healthScore}
      </motion.div>
    </div>
  );
}