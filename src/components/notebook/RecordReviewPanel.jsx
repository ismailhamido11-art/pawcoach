import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

/**
 * RecordReviewPanel
 *
 * Two variants:
 *  - variant="badge"  : compact button for the chat header (shows pending count)
 *  - variant="action" : full-width button for the input area (shown when isFinished)
 */
export default function RecordReviewPanel({ pendingRecords = [], hasSaved = false, onSave, variant = "badge" }) {
  if (variant === "badge") {
    if (pendingRecords.length === 0 || hasSaved) return null;
    return (
      <Button
        size="sm"
        onClick={onSave}
        className="rounded-full bg-safe hover:bg-safe/90 text-white text-xs h-8 shadow-md"
      >
        <Check className="w-3.5 h-3.5 mr-1" /> Sauver ({pendingRecords.length})
      </Button>
    );
  }

  if (variant === "action") {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
        <Button
          onClick={onSave}
          className="w-full rounded-full bg-safe hover:bg-safe/90 text-white h-11 text-sm font-medium shadow-md"
        >
          <Check className="w-4 h-4 mr-2" />
          Enregistrer {pendingRecords.length} entr&eacute;e{pendingRecords.length > 1 ? "s" : ""} dans le carnet
        </Button>
      </motion.div>
    );
  }

  return null;
}
