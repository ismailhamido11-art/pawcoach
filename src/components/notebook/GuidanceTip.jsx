import { useState } from "react";
import { X, Lightbulb } from "lucide-react";

const VARIANTS = {
  primary: {
    bg: "bg-primary/5",
    border: "border-primary/15",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    titleColor: "text-primary",
  },
  accent: {
    bg: "bg-accent/5",
    border: "border-accent/15",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    titleColor: "text-accent",
  },
  subtle: {
    bg: "bg-secondary/60",
    border: "border-border",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    titleColor: "text-card-foreground",
  },
};

export default function GuidanceTip({ id, title, description, icon, variant = "primary", className = "" }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const v = VARIANTS[variant];

  return (
    <div className={`relative flex items-start gap-3 p-4 rounded-2xl border ${v.bg} ${v.border} transition-all ${className}`}>
      <div className={`w-9 h-9 rounded-xl ${v.iconBg} flex items-center justify-center flex-shrink-0 ${v.iconColor}`}>
        {icon || <Lightbulb className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <p className={`text-sm font-semibold ${v.titleColor}`}>{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}
