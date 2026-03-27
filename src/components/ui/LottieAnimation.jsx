import { useEffect, useMemo, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PawPrint } from "lucide-react";
export default function LottieAnimation({
  src,
  size = 120,
  loop = true,
  autoplay = true,
  className = "",
  ariaLabel = "Animation",
}) {
  const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [failed, setFailed] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const style = useMemo(() => {
    const resolvedSize = typeof size === "number" ? `${size}px` : size;
    return { width: resolvedSize, height: resolvedSize };
  }, [size]);

  if (!src || failed) {
    return (
      <div
        className="inline-flex items-center justify-center"
        style={style}
        aria-label={ariaLabel}
        aria-hidden="true"
      >
        <PawPrint className="w-8 h-8 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
      className={cn("inline-flex items-center justify-center", className)}
      style={style}
      aria-label={ariaLabel}
    >
      <DotLottieReact
        src={src}
        loop={reduceMotion ? false : loop}
        autoplay={reduceMotion ? false : autoplay}
        style={{ width: "100%", height: "100%" }}
        renderConfig={{ autoResize: true }}
        useFrameInterpolation={!reduceMotion}
        onEvent={(event) => {
          if (!mountedRef.current) return;
          if (event === "loadError") setFailed(true);
        }}
      />
    </motion.div>
  );
}
