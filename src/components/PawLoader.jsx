import { motion } from "framer-motion";

function PawIcon({ className }) {
  return (
    <svg viewBox="0 0 24 28" className={className} fill="currentColor">
      <ellipse cx="6.5" cy="4.5" rx="3" ry="3.5" />
      <ellipse cx="12" cy="2.5" rx="2.8" ry="3" />
      <ellipse cx="17.5" cy="4.5" rx="3" ry="3.5" />
      <ellipse cx="12" cy="16" rx="6.5" ry="7" />
      <ellipse cx="4" cy="10.5" rx="2.5" ry="3" />
      <ellipse cx="20" cy="10.5" rx="2.5" ry="3" />
    </svg>
  );
}

export default function PawLoader({ text = "Chargement..." }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-8 z-50">
      {/* Paw prints walking */}
      <div className="relative h-14 w-32 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute text-primary"
            style={{
              left: `${i * 38}px`,
              top: i % 2 === 0 ? "0px" : "20px",
              transform: `rotate(${i % 2 === 0 ? -20 : 20}deg)`,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1, 1, 0.5],
            }}
            transition={{
              duration: 1.6,
              delay: i * 0.35,
              repeat: Infinity,
              repeatDelay: 0.2,
              ease: "easeInOut",
            }}
          >
            <PawIcon className="w-7 h-7" />
          </motion.div>
        ))}
      </div>

      {/* Brand */}
      <div className="text-center">
        <motion.p
          className="text-primary font-black text-xl tracking-tight"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          PawCoach
        </motion.p>
        <p className="text-muted-foreground text-xs mt-1.5">{text}</p>
      </div>
    </div>
  );
}
