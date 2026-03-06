import { motion } from "framer-motion";
import { Lock, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Badge showing remaining credits.
 * type: "message" | "action"
 */
export function CreditBadge({ remaining, type = "action", className = "" }) {
  if (remaining === Infinity || remaining == null) return null;
  const label = type === "message"
    ? `credit${remaining !== 1 ? "s" : ""} message`
    : `action${remaining !== 1 ? "s" : ""} IA`;
  return (
    <div className={`inline-flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-full ${className}`}>
      <Zap className="w-3 h-3 text-primary" />
      <span className="text-[11px] font-semibold text-foreground">{remaining} {label}</span>
    </div>
  );
}

/**
 * Upgrade prompt shown when credits are exhausted.
 * from: source page for tracking (e.g. "scan", "diagnostic")
 */
export function UpgradePrompt({ type = "action", from = "", className = "" }) {
  const navigate = useNavigate();
  const msg = type === "message"
    ? "Tes messages IA gratuits sont epuises pour aujourd'hui."
    : "Tes actions IA gratuites sont epuisees pour aujourd'hui.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 text-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{msg}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Reviens demain pour de nouveaux credits, ou passe Premium pour un acces illimite.
      </p>
      <Button
        onClick={() => navigate(createPageUrl("Premium") + (from ? `?from=${from}` : ""))}
        className="gradient-primary border-0 text-white w-full"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Passer Premium
      </Button>
    </motion.div>
  );
}
