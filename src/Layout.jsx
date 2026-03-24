import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useReducedMotion from "@/hooks/useReducedMotion";
import { fadeIn } from "@/lib/animations";

export default function Layout({ children, currentPageName }) {
  const reduceMotion = useReducedMotion();

  // Force light mode — dark mode not QA'd, disabled to avoid broken rendering
  useEffect(() => {
    document.documentElement.classList.remove("dark");
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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentPageName}
          {...transitionProps}
          style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
