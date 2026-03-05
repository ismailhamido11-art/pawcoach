import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Check, ExternalLink, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const TRACKERS = [
  {
    id: "tractive",
    name: "Tractive GPS",
    logo: "🛰️",
    description: "GPS temps réel + activité",
    color: "bg-violet-50 border-violet-200",
    accent: "text-violet-600",
    popular: true,
    authUrl: "https://my.tractive.com/",
    exportUrl: "https://my.tractive.com/#/pet-tracker",
    exportInstructions: "Mon compte → Rapport d'activité → Exporter CSV",
  },
  {
    id: "fitbark",
    name: "FitBark",
    logo: "🐾",
    description: "Activité & santé détaillée",
    color: "bg-amber-50 border-amber-200",
    accent: "text-amber-600",
    popular: false,
    authUrl: "https://www.fitbark.com/",
    exportUrl: "https://www.fitbark.com/health-data-export/",
    exportInstructions: "Mon compte → Mes données → Exporter CSV",
  },
  {
    id: "whistle",
    name: "Whistle",
    logo: "📍",
    description: "GPS + bien-être",
    color: "bg-blue-50 border-blue-200",
    accent: "text-blue-600",
    popular: false,
    authUrl: "https://www.whistle.com/",
    exportUrl: "https://app.whistle.com/",
    exportInstructions: "Profil → Mon chien → Télécharger les données",
  },
  {
    id: "garmin",
    name: "Garmin Dog",
    logo: "🟠",
    description: "Trackers Garmin Alpha/Astro",
    color: "bg-red-50 border-red-200",
    accent: "text-red-600",
    popular: false,
    authUrl: "https://connect.garmin.com/",
    exportUrl: "https://connect.garmin.com/",
    exportInstructions: "Activités → Exporter → CSV",
  },
  {
    id: "generic",
    name: "Autre collier / GPS",
    logo: "📡",
    description: "N'importe quel tracker (CSV universel)",
    color: "bg-green-50 border-green-200",
    accent: "text-green-600",
    popular: false,
    authUrl: null,
    exportUrl: null,
    exportInstructions: "Utilise l'onglet 'Importer' avec ton fichier CSV",
  },
];

export default function TrackerConnect({ dog, user, onSynced }) {
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [minutesInput, setMinutesInput] = useState("");
  const [steps, setSteps] = useState("");

  const handleManualSync = async () => {
    if (!dog || !minutesInput) return;
    setSyncing(true);
    const today = getTodayString();
    const existing = await base44.entities.DailyLog.filter({ dog_id: dog.id, date: today });
    const payload = {
      dog_id: dog.id,
      date: today,
      owner: user?.email || "",
      walk_minutes: parseFloat(minutesInput),
      notes: `Synchronisé via ${selected?.name || "tracker"} — ${steps ? steps + " pas" : ""}`.trim(),
    };
    if (existing?.length > 0) {
      await base44.entities.DailyLog.update(existing[0].id, payload);
    } else {
      await base44.entities.DailyLog.create(payload);
    }
    setSyncing(false);
    toast.success(`${minutesInput} min enregistrées pour aujourd'hui !`);
    setMinutesInput("");
    setSteps("");
    onSynced?.();
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Explanation banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <p className="text-xs font-bold text-primary mb-1">🌐 Compatible avec tous les appareils</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sélectionne ton tracker ci-dessous pour obtenir le guide d'export personnalisé, ou utilise l'onglet <strong>Importer</strong> avec n'importe quel fichier CSV.
        </p>
      </div>

      {/* Tracker list */}
      <div className="space-y-2">
        {TRACKERS.map((tracker) => (
          <motion.button
            key={tracker.id}
            onClick={() => setSelected(selected?.id === tracker.id ? null : tracker)}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left border-2 rounded-2xl p-4 transition-all ${
              selected?.id === tracker.id
                ? "border-primary bg-primary/5"
                : tracker.color
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tracker.logo}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground">{tracker.name}</p>
                    {tracker.popular && (
                      <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">POPULAIRE</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{tracker.description}</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected?.id === tracker.id ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                {selected?.id === tracker.id && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selected tracker guide */}
      {selected && selected.id !== "generic" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-4 space-y-4"
        >
          <div>
            <p className="font-bold text-sm text-foreground mb-1">📋 Comment récupérer tes données depuis {selected.name}</p>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-mono">{selected.exportInstructions}</p>
            </div>
            {selected.exportUrl && (
              <a
                href={selected.exportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary font-semibold mt-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir {selected.name} →
              </a>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold text-foreground mb-2">✍️ Ou entre directement les données du jour</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted/40 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground font-bold mb-1">MINUTES DE MARCHE</p>
                <input
                  type="number"
                  placeholder="Ex: 45"
                  value={minutesInput}
                  onChange={e => setMinutesInput(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-foreground outline-none"
                  inputMode="numeric"
                />
              </div>
              <div className="flex-1 bg-muted/40 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground font-bold mb-1">PAS (optionnel)</p>
                <input
                  type="number"
                  placeholder="Ex: 3500"
                  value={steps}
                  onChange={e => setSteps(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-foreground outline-none"
                  inputMode="numeric"
                />
              </div>
            </div>
            <Button
              onClick={handleManualSync}
              disabled={!minutesInput || syncing}
              className="w-full mt-3 h-11 rounded-xl bg-primary font-bold gap-2"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Enregistrer pour aujourd'hui
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}