import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.24, ease: "easeOut" },
};

export default function Layout({ children, currentPageName }) {
  const reduceMotion = useReducedMotion();



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
      {/* NOTE : Layout applique deja un paddingBottom pour le BottomNav.
           Les pages NE doivent PAS ajouter leur propre pb-* sur le wrapper principal. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
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