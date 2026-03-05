import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, BellOff, Clock, Footprints } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return { value: `${h}:00`, label: `${h}h00` };
});

export default function WalkReminderSettings({ user, onSave, dogName }) {
  const [enabled, setEnabled] = useState(user?.walk_reminder_enabled || false);
  const [time, setTime] = useState(user?.walk_reminder_time || "18:00");
  const [saving, setSaving] = useState(false);

  const handleToggle = async (val) => {
    setEnabled(val);
    setSaving(true);
    try {
      await onSave({ walk_reminder_enabled: val, walk_reminder_time: time });
      toast.success(val ? `Rappel activé à ${time} 🐾` : "Rappel désactivé");
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (val) => {
    setTime(val);
    if (!enabled) return;
    setSaving(true);
    try {
      await onSave({ walk_reminder_time: val, walk_reminder_enabled: true });
      toast.success(`Rappel mis à jour à ${val}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Rappel balade</p>
            <p className="text-xs text-muted-foreground">Email si aucune activité ce jour</p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={saving}
        />
      </div>

      {/* Time picker — only when enabled */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-3 bg-amber-50/40">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-foreground">Heure du rappel</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["08:00", "10:00", "12:00", "14:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map(t => (
                  <button
                    key={t}
                    onClick={() => handleTimeChange(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      time === t
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-white border border-border text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <Footprints className="w-3 h-3" />
                Un email sera envoyé à {time} si {dogName || "votre chien"} n'a pas encore eu sa balade
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}