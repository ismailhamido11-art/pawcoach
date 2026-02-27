import { motion } from "framer-motion";
import AnimatedLogo from "./AnimatedLogo";

export default function HeaderWithLogo({ title, subtitle }) {
  return (
    <motion.div
      className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pt-6 pb-8 px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background elements */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-accent/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          {title && (
            <motion.h1
              className="text-2xl font-bold gradient-text"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              {title}
            </motion.h1>
          )}
          {subtitle && (
            <motion.p
              className="text-sm text-muted-foreground mt-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AnimatedLogo size="sm" />
        </motion.div>
      </div>
    </motion.div>
  );
}