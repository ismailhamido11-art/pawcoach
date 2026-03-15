import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationCenter from "./components/notifications/NotificationCenter";

export default function Layout({ children, currentPageName }) {
  // Force light mode — dark mode not QA'd, disabled to avoid broken rendering
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <>
      <style>{`
        /* Prevent decorative elements from being draggable */
        img[class*="drop-shadow"], [class*="illustration"] {
          pointer-events: none;
          -webkit-user-drag: none;
        }
      `}</style>
      {/* Floating bell button top-right — hidden on DogProfile */}
      {currentPageName !== "DogProfile" && (
        <div
          className="fixed top-0 right-0 z-50 flex items-center"
          style={{ paddingTop: "calc(max(env(safe-area-inset-top, 0px), 12px) + 28px)", paddingRight: "max(12px, env(safe-area-inset-right, 0px))" }}
        >
          <NotificationCenter />
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPageName}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}