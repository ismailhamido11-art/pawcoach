import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { spring } from "@/lib/animations";

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * ErrorState — inline error + retry pour les pages avec data fetching
 * Usage : remplace <SkeletonPage> ou <EmptyState> quand le chargement échoue
 */
export default function ErrorState({
  message = "Impossible de charger les données. Vérifie ta connexion.",
  onRetry,
  className = "",
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, duration: 0.3 }}
      role="alert"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-destructive" aria-hidden="true" />
      </div>

      <p className="font-bold text-base text-primary leading-tight mb-1">
        Oups, quelque chose a planté
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mb-6">
        {message}
      </p>

      {onRetry && (
        <motion.button
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          transition={spring}
          onClick={onRetry}
          aria-label="Réessayer le chargement"
          className="flex items-center gap-2 h-11 px-5 rounded-xl bg-accent text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Réessayer
        </motion.button>
      )}
    </motion.div>
  );
}
