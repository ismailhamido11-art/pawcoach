import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";

const TAB_ORDER = { Home: 0, Scan: 1, Chat: 2, Notebook: 3, Dashboard: 4 };

function getDirection(current, previous) {
  if (!previous) return 0;
  const curIdx = TAB_ORDER[current];
  const prevIdx = TAB_ORDER[previous];

  // Both are main tabs — slide based on tab position
  if (curIdx !== undefined && prevIdx !== undefined) {
    return curIdx > prevIdx ? 1 : curIdx < prevIdx ? -1 : 0;
  }
  // Going to a deeper page (Profile, Premium, etc.)
  if (curIdx === undefined) return 1;
  // Coming back to a tab from a deeper page
  return -1;
}

const variants = {
  initial: (dir) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir * 60,
    y: dir === 0 ? 8 : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir * -60,
    y: dir === 0 ? -8 : 0,
  }),
};

export default function Layout({ children, currentPageName }) {
  const prevPage = useRef(null);
  const direction = getDirection(currentPageName, prevPage.current);

  // Update after direction is computed
  if (prevPage.current !== currentPageName) {
    prevPage.current = currentPageName;
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={currentPageName}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
