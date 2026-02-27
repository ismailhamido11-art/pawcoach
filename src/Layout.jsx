import { AnimatePresence, motion } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPageName}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}