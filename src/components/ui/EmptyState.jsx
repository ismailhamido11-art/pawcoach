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

/**
 * EmptyState
 * @param {string}   icon         Nom d'icône Lucide (ex: "MapPin") OU null si mascot utilisé
 * @param {string}   title        Titre principal (court, accrocheur)
 * @param {string}   description  Description secondaire (1-2 lignes)
 * @param {string}   actionLabel  Label du bouton CTA (optionnel)
 * @param {function} onAction     Callback du bouton CTA (optionnel)
 * @param {string}   mascot       Nom de la mascotte PawMascot : wave|detective|grad|chef|doctor|chat|trophy|curious
 * @param {string}   className    Classes supplémentaires sur le conteneur
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  mascot = "curious",
  className = "",
}) {
  const MascotComponent = mascot ? MASCOTS[mascot] : null;

  // Résolution de l'icône Lucide si fournie (et pas de mascot)
  let LucideIcon = null;
  if (icon && !MascotComponent) {
    LucideIcon = LucideIcons[icon] || LucideIcons["HelpCircle"];
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center py-10 px-6 ${className}`}
    >
      {/* Illustration */}
      {MascotComponent ? (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 mb-4"
        >
          <MascotComponent color="#2D9F82" />
        </motion.div>
      ) : LucideIcon ? (
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
          <LucideIcon className="w-7 h-7 text-emerald-600" />
        </div>
      ) : null}

      {/* Textes */}
      <p className="font-bold text-base text-[#1A4D3E] leading-tight mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">{description}</p>
      )}

      {/* CTA */}
      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={onAction}
          className="mt-5 px-5 py-2.5 rounded-xl bg-[#2D9F82] text-white text-sm font-semibold shadow-sm hover:bg-[#27896f] transition-colors"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
