import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function EnhancedCard({ 
  children, 
  className,
  hover = true,
  image,
  gradient = false,
  ...props 
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-white border border-border",
        "transition-all duration-300",
        hover && "shadow-md hover:shadow-xl",
        className
      )}
      {...props}
    >
      {/* Image background */}
      {image && (
        <div className="absolute inset-0">
          <img
            src={image}
            alt="card background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Gradient overlay for depth */}
      {gradient && !image && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}