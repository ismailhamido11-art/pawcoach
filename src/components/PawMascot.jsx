import { motion } from "framer-motion";

const MASCOT_IMAGES = {
  happy:       "/mascot/paw-happy.jpg",
  curious:     "/mascot/paw-curious.jpg",
  sleepy:      "/mascot/paw-sleepy.jpg",
  excited:     "/mascot/paw-excited.jpg",
  proud:       "/mascot/paw-proud.jpg",
  encouraging: "/mascot/paw-encouraging.jpg",
  eating:      "/mascot/paw-eating.jpg",
  walking:     "/mascot/paw-walking.jpg",
  health:      "/mascot/paw-health.jpg",
  training:    "/mascot/paw-training.jpg",
};

const MASCOT_ANIMATIONS = {
  happy:       { animate: { y: [0, -4, 0] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  curious:     { animate: { rotate: [0, 3, -3, 0] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  sleepy:      { animate: { scale: [1, 1.02, 1] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  excited:     { animate: { y: [0, -6, 0], scale: [1, 1.05, 1] }, transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  proud:       { animate: { scale: [1, 1.03, 1] }, transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
  encouraging: { animate: { y: [0, -3, 0], rotate: [0, 2, -2, 0] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  eating:      { animate: { y: [0, -2, 0] }, transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
  walking:     { animate: { x: [0, 3, -3, 0] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  health:      { animate: { scale: [1, 1.02, 1] }, transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
  training:    { animate: { y: [0, -4, 0] }, transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } },
};

/**
 * PawMascot — the emotional companion throughout the app.
 *
 * @param {"happy"|"curious"|"sleepy"|"excited"|"proud"|"encouraging"|"eating"|"walking"|"health"|"training"} mood
 * @param {string} message  — speech-bubble text (optional)
 * @param {"sm"|"md"|"lg"|"xl"} size
 * @param {string} className
 */
export default function PawMascot({
  mood = "happy",
  message,
  size = "md",
  className = "",
  bubblePosition = "right",
}) {
  const sizeMap = { sm: 48, md: 72, lg: 96, xl: 128 };
  const px = sizeMap[size] || sizeMap.md;
  const anim = MASCOT_ANIMATIONS[mood] || MASCOT_ANIMATIONS.happy;
  const src = MASCOT_IMAGES[mood] || MASCOT_IMAGES.happy;

  return (
    <div className={`flex items-end gap-2.5 ${bubblePosition === "left" ? "flex-row-reverse" : ""} ${className}`}>
      <motion.div
        {...anim}
        className="flex-shrink-0 rounded-full overflow-hidden"
        style={{ width: px, height: px }}
      >
        <img
          src={src}
          alt={`Paw le mascot - ${mood}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
          className={`
            relative max-w-[220px] px-3.5 py-2.5 rounded-2xl
            bg-card border border-border/40 shadow-sm
            text-[13px] leading-snug text-foreground font-medium
            ${bubblePosition === "left" ? "rounded-br-md" : "rounded-bl-md"}
          `}
        >
          {message}
          {/* Bubble tail */}
          <div
            className={`absolute bottom-1.5 w-2.5 h-2.5 bg-card border-border/40 rotate-45
              ${bubblePosition === "left" ? "-right-1 border-r border-t" : "-left-1 border-l border-b"}
            `}
          />
        </motion.div>
      )}
    </div>
  );
}

/** Compact inline mascot — just the image, no bubble */
export function PawMascotInline({ mood = "happy", size = "sm", className = "" }) {
  const sizeMap = { sm: 28, md: 40, lg: 56 };
  const px = sizeMap[size] || sizeMap.sm;
  const anim = MASCOT_ANIMATIONS[mood] || MASCOT_ANIMATIONS.happy;
  const src = MASCOT_IMAGES[mood] || MASCOT_IMAGES.happy;

  return (
    <motion.img
      {...anim}
      src={src}
      alt={`Paw - ${mood}`}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
      draggable={false}
    />
  );
}
