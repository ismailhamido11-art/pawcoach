import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatFAB() {
  return (
    <Link to={createPageUrl("Chat")} aria-label="Ouvrir le chat">
      <motion.div
        whileTap={{ scale: 0.92 }}
        className="fixed right-4 z-30 w-14 h-14 rounded-full gradient-primary shadow-lg shadow-primary/30 flex items-center justify-center"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))", boxShadow: "0 4px 20px rgba(45,159,130,0.35)" }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.div>
    </Link>
  );
}