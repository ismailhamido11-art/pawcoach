import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Check, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export default function TrackerImportCSV({ dog, user, onImported }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setParsing(true);
    setPreview(null);
    setDone(false);

    const text = await f.text();
    // Upload file and use AI to extract metrics
    const uploadedFile = await base44.integrations.Core.UploadFile({ file: f });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: uploadedFile.file_url,
      json_schema: {
        type: "object",
        properties: {
          rows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", description: "Date au format YYYY-MM-DD" },
                walk_minutes: { type: "number", description: "Minutes de marche ou d'activité" },
                steps: { type: "number", description: "Nombre de pas si disponible" },
                distance_km: { type: "number", description: "Distance en km si disponible" },
                calories: { type: "number", description: "Calories brûlées si disponible" },
              }
            }
          },
          summary: { type: "string", description: "Résumé en 1 phrase de ce que contient ce fichier" }
        }
      }
    });

    if (result.status === "success" && result.output?.rows?.length > 0) {
      setPreview(result.output);
    } else {
      // Fallback: parse CSV manually
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0]?.toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
      const rows = [];
      for (let i = 1; i < lines.length && i <= 31; i++) {
        const vals = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx]; });
        const dateKey = headers.find(h => h.includes("date") || h.includes("jour"));
        const minutesKey = headers.find(h => h.includes("minute") || h.includes("active") || h.includes("activit") || h.includes("walk") || h.includes("duration"));
        if (dateKey && minutesKey) {
          const rawDate = row[dateKey];
          const rawMin = parseFloat(row[minutesKey]);
          if (rawDate && !isNaN(rawMin)) {
            rows.push({ date: rawDate.substring(0, 10), walk_minutes: rawMin });
          }
        }
      }
      if (rows.length > 0) {
        setPreview({ rows, summary: `${rows.length} jours détectés depuis le CSV` });
      } else {
        setPreview({ rows: [], summary: "Aucune donnée reconnue dans ce fichier." });
      }
    }
    setParsing(false);
  };

  const handleSave = async () => {
    if (!dog || !preview?.rows?.length) return;
    setSaving(true);
    let saved = 0;
    for (const row of preview.rows) {
      if (!row.date || !row.walk_minutes) continue;
      const existing = await base44.entities.DailyLog.filter({ dog_id: dog.id, date: row.date });
      const payload = {
        dog_id: dog.id,
        date: row.date,
        owner: user?.email || "",
        walk_minutes: row.walk_minutes,
        notes: [
          row.steps ? `${row.steps} pas` : null,
          row.distance_km ? `${row.distance_km} km` : null,
          row.calories ? `${row.calories} kcal` : null,
        ].filter(Boolean).join(" · ") || undefined,
      };
      if (existing?.length > 0) {
        await base44.entities.DailyLog.update(existing[0].id, payload);
      } else {
        await base44.entities.DailyLog.create(payload);
      }
      saved++;
    }
    setSaving(false);
    setDone(true);
    toast.success(`${saved} jours importés avec succès !`);
    onImported?.();
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Info */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
        <p className="font-bold text-sm text-emerald-700 mb-1">📂 Import CSV universel</p>
        <p className="text-xs text-emerald-600 leading-relaxed">
          Compatible avec <strong>Tractive, FitBark, Whistle, Garmin, PetPace, GPS Alibaba</strong> ou tout export CSV. L'IA détecte automatiquement les colonnes.
        </p>
      </div>

      {/* Upload zone */}
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 bg-white transition-all hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          {file ? <FileText className="w-7 h-7 text-primary" /> : <Upload className="w-7 h-7 text-muted-foreground" />}
        </div>
        <div className="text-center">
          <p className="font-bold text-sm text-foreground">{file ? file.name : "Glisse ou sélectionne ton fichier"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">CSV, Excel ou JSON — n'importe quel format</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.json,.xls"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {/* Parsing */}
      {parsing && (
        <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-foreground">Analyse IA en cours...</p>
            <p className="text-xs text-muted-foreground">Détection automatique des colonnes</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && !parsing && (
        <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            {preview.rows.length > 0
              ? <Check className="w-4 h-4 text-safe" />
              : <AlertCircle className="w-4 h-4 text-amber-500" />
            }
            <p className="text-sm font-bold text-foreground">{preview.summary}</p>
          </div>

          {preview.rows.length > 0 && (
            <>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {preview.rows.slice(0, 10).map((row, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
                    <span className="text-xs text-muted-foreground">{row.date}</span>
                    <div className="flex gap-3 text-xs font-semibold text-foreground">
                      {row.walk_minutes && <span>🦶 {row.walk_minutes} min</span>}
                      {row.steps && <span>👟 {row.steps}</span>}
                      {row.distance_km && <span>📍 {row.distance_km} km</span>}
                    </div>
                  </div>
                ))}
                {preview.rows.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+{preview.rows.length - 10} jours supplémentaires</p>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || done}
                className="w-full h-11 rounded-xl font-bold gap-2"
                style={{ background: done ? "#10b981" : "linear-gradient(135deg, #0f4c3a, #2d9f82)" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : null}
                {done ? "Importé !" : saving ? "Enregistrement..." : `Importer ${preview.rows.length} jours`}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Format guide */}
      <div className="bg-muted/40 rounded-2xl p-4">
        <p className="text-xs font-bold text-muted-foreground mb-2">📌 Colonnes reconnues automatiquement</p>
        <div className="grid grid-cols-2 gap-1">
          {["date / jour", "minutes / duration", "steps / pas", "distance_km", "calories", "activity"].map(col => (
            <span key={col} className="text-[10px] bg-white border border-border px-2 py-1 rounded-lg text-muted-foreground font-mono">{col}</span>
          ))}
        </div>
      </div>
    </div>
  );
}