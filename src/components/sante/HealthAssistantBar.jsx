import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const spring = { type: "spring", stiffness: 400, damping: 30 };

export default function HealthAssistantBar({ onClick }) {
  return (
    <div
      className="fixed right-4 z-50 pointer-events-none"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.2 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        aria-label="Ouvrir l'assistant sante"
        className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-bold"
        style={{
          background: "linear-gradient(135deg, #1A4D3E 0%, #2D9F82 100%)",
          boxShadow: "0 4px 20px rgba(45,159,130,0.40)",
        }}
      >
        <span>Assistance Sante</span>
        <MessageCircle className="w-5 h-5 flex-shrink-0" />
      </motion.button>
    </div>
  );
}
