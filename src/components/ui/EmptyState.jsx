/**
 * EmptyState — composant réutilisable pour les sections sans données
 * Design : cream bg, forest green #1A4D3E, emerald #2D9F82
 * Animation : Framer Motion fadeIn + slight scale
 */
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  DogWave,
  DogDetective,
  DogGrad,
  DogChef,
  DogDoctor,
  DogChat,
  DogTrophy,
  DogCurious,
} from "./PawIllustrations";
import StorysetIllustration from "./StorysetIllustration";
import LottieAnimation from "./LottieAnimation";
import useReducedMotion from "@/hooks/useReducedMotion";

const MASCOTS = {
  wave: DogWave,
  detective: DogDetective,
  grad: DogGrad,
  chef: DogChef,
  doctor: DogDoctor,
  chat: DogChat,
  trophy: DogTrophy,
  curious: DogCurious,
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  mascot = "curious",
  illustration,
  lottieSrc,
  className = "",
}) {
  const reduceMotion = useReducedMotion();
  const MascotComponent = mascot ? MASCOTS[mascot] : null;

  let LucideIcon = null;
  if (icon && !MascotComponent && !illustration && !lottieSrc) {
    LucideIcon = LucideIcons[icon] || LucideIcons.HelpCircle;
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 28, duration: reduceMotion ? 0 : 0.32 }}
      className={`flex flex-col items-center justify-center text-center py-10 px-6 ${className}`}
    >
      {lottieSrc ? (
        <div className="mb-4 flex items-center justify-center rounded-[2rem] border border-border/60 bg-card/80 p-3 shadow-sm">
          <LottieAnimation src={lottieSrc} size={112} ariaLabel={title || "Animation"} />
        </div>
      ) : illustration ? (
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-36 h-36 mb-4"
        >
          <StorysetIllustration name={illustration} alt="" className="w-full h-full" />
        </motion.div>
      ) : MascotComponent ? (
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 mb-4"
        >
          <MascotComponent color="hsl(var(--accent))" />
        </motion.div>
      ) : LucideIcon ? (
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <LucideIcon className="w-7 h-7 text-accent" />
        </div>
      ) : null}

      <p className="font-bold text-base text-primary leading-tight mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">{description}</p>
      )}

      {actionLabel && onAction && (
        <motion.button
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          onClick={onAction}
          className="mt-5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
