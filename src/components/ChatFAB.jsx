import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatFAB() {
  return (
    <Link to={createPageUrl("Chat")}>
      <motion.div
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full gradient-primary shadow-lg shadow-primary/30 flex items-center justify-center"
        style={{ boxShadow: "0 4px 20px rgba(45,159,130,0.35)" }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.div>
    </Link>
  );
}