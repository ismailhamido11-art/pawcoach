import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { WifiOff } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.24, ease: "easeOut" },
};

export default function Layout({ children, currentPageName }) {
  const reduceMotion = useReducedMotion();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const transitionProps = reduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : fadeIn;

  return (
    <>
      <style>{`
        /* Prevent decorative elements from being draggable */
        img[class*="drop-shadow"], [class*="illustration"] {
          pointer-events: none;
          -webkit-user-drag: none;
        }
      `}</style>

      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-slate-800 text-white flex items-center justify-center gap-2 px-4 py-2"
            style={{ paddingTop: "max(8px, env(safe-area-inset-top, 0px))" }}
            role="status"
            aria-live="polite"
          >
            <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs font-semibold">Vous êtes hors ligne — données en cache</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTE : Layout applique deja un paddingBottom pour le BottomNav.
           Les pages NE doivent PAS ajouter leur propre pb-* sur le wrapper principal. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          id="main-content"
          key={currentPageName}
          {...transitionProps}
          className="layout-padding"
          style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
