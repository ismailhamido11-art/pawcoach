import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const startY = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);

  const canPull = () => {
    const el = containerRef.current;
    return el ? el.scrollTop === 0 : true;
  };

  const handleTouchStart = (e) => {
    if (canPull()) startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPullDistance(Math.min(dy * 0.45, THRESHOLD + 20));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.7);
      if (navigator.vibrate) navigator.vibrate(30);
      await onRefresh();
      setRefreshing(false);
    }
    startY.current = null;
    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 8 || refreshing;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showIndicator && (
        <motion.div
          animate={{ height: refreshing ? THRESHOLD * 0.7 : pullDistance }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex items-center justify-center overflow-hidden"
        >
          <motion.div
            animate={{ rotate: refreshing ? 360 : progress * 360 }}
            transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
          >
            <RefreshCw
              className="w-6 h-6"
              style={{ color: `hsl(160 50% ${22 + (1 - progress) * 30}%)`, opacity: 0.5 + progress * 0.5 }}
            />
          </motion.div>
        </motion.div>
      )}
      {children}
    </div>
  );
}