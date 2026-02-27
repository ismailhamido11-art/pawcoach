import { motion } from "framer-motion";

export default function AnimatedLogo({ size = "md" }) {
  const sizes = {
    sm: { container: "w-12 h-12", paw: "w-8 h-8" },
    md: { container: "w-16 h-16", paw: "w-12 h-12" },
    lg: { container: "w-24 h-24", paw: "w-16 h-16" },
  };

  const s = sizes[size] || sizes.md;

  const pawVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      className={`${s.container} flex items-center justify-center`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <svg
        viewBox="0 0 100 100"
        className={`${s.paw} fill-primary drop-shadow-lg`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Centre paw pad */}
        <motion.circle
          cx="50"
          cy="65"
          r="16"
          variants={pawVariants}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />

        {/* Top left toe */}
        <motion.circle
          cx="25"
          cy="30"
          r="10"
          variants={pawVariants}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.05 }}
        />

        {/* Top center toe */}
        <motion.circle
          cx="50"
          cy="15"
          r="10"
          variants={pawVariants}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        />

        {/* Top right toe */}
        <motion.circle
          cx="75"
          cy="30"
          r="10"
          variants={pawVariants}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.15 }}
        />

        {/* Right toe */}
        <motion.circle
          cx="85"
          cy="55"
          r="10"
          variants={pawVariants}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        />
      </svg>

      {/* Subtle pulse background */}
      <motion.div
        className="absolute inset-0 rounded-full bg-accent/10 blur-xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}