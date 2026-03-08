import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";

const spring = { type: "spring", stiffness: 400, damping: 30 };

export default function HealthAssistantBar({ onClick }) {
  return (
    <div
      className="fixed left-0 right-0 z-20 flex justify-center pointer-events-none"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.2 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        aria-label="Ouvrir l'assistant sante"
        className="pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-full shadow-lg text-white text-sm font-bold"
        style={{
          background: "linear-gradient(135deg, #1A4D3E 0%, #2D9F82 100%)",
          boxShadow: "0 4px 20px rgba(45,159,130,0.40)",
        }}
      >
        <Sparkles className="w-4 h-4 flex-shrink-0" />
        <span>Assistance Sante</span>
        <MessageCircle className="w-4 h-4 flex-shrink-0 opacity-70" />
      </motion.button>
    </div>
  );
}
