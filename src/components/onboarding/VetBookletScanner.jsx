import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2, CheckCircle, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VetBookletScanner({ dogName: _dogName, onDataExtracted }) {
  const [phase, setPhase] = useState("idle"); // idle | scanning | review
  const [preview, setPreview] = useState(null);
  const [_extracted, setExtracted] = useState(null);
  const [editedVaccines, setEditedVaccines] = useState([]);
  const [editedTreatments, setEditedTreatments] = useState([]);
  const [editedWeights, setEditedWeights] = useState([]);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setPhase("scanning");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract all veterinary information from this French pet health booklet page. 
Return ONLY a JSON object with these fields:
- vaccines: array of {name: string, date: string} (YYYY-MM-DD)
- treatments: array of {name: string, date: string} (YYYY-MM-DD)  
- weight_records: array of {weight_kg: number, date: string} (YYYY-MM-DD)
If something is unreadable, use "illisible" as the value. Return nothing except the JSON.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          vaccines: { type: "array", items: { type: "object", properties: { name: { type: "string" }, date: { type: "string" } } } },
          treatments: { type: "array", items: { type: "object", properties: { name: { type: "string" }, date: { type: "string" } } } },
          weight_records: { type: "array", items: { type: "object", properties: { weight_kg: { type: "number" }, date: { type: "string" } } } },
        }
      }
    });

    setExtracted(result);
    setEditedVaccines(result.vaccines || []);
    setEditedTreatments(result.treatments || []);
    setEditedWeights(result.weight_records || []);
    setPhase("review");
  };

  const confirm = () => {
    onDataExtracted({
      vaccines: editedVaccines,
      treatments: editedTreatments,
      weight_records: editedWeights,
    });
    setPhase("done");
  };

  if (phase === "done") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">Carnet de santé scanné ✓</p>
          <p className="text-xs text-green-600 mt-0.5">Les données ont été extraites et seront sauvegardées.</p>
        </div>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="gradient-primary px-4 py-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-white" />
          <p className="text-white text-sm font-semibold">Voici ce qu'on a trouvé</p>
          <span className="text-white/70 text-xs ml-1">— Corrige si besoin</span>
        </div>

        <div className="p-4 space-y-5">
          {/* Vaccines */}
          <Section
            title="Vaccins"
            emoji="💉"
            items={editedVaccines}
            onChange={setEditedVaccines}
            fields={[
              { key: "name", placeholder: "Nom du vaccin", className: "flex-1" },
              { key: "date", type: "date", className: "w-36" },
            ]}
          />

          {/* Treatments */}
          <Section
            title="Traitements"
            emoji="💊"
            items={editedTreatments}
            onChange={setEditedTreatments}
            fields={[
              { key: "name", placeholder: "Traitement", className: "flex-1" },
              { key: "date", type: "date", className: "w-36" },
            ]}
          />

          {/* Weights */}
          <Section
            title="Poids"
            emoji="⚖️"
            items={editedWeights}
            onChange={setEditedWeights}
            fields={[
              { key: "weight_kg", placeholder: "Poids (kg)", type: "number", className: "w-28" },
              { key: "date", type: "date", className: "flex-1" },
            ]}
          />

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => { setPhase("idle"); setPreview(null); }}>
              Recommencer
            </Button>
            <Button size="sm" className="flex-1 rounded-xl gradient-primary border-0 text-white" onClick={confirm}>
              Confirmer ✓
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {phase === "idle" && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-primary/40 rounded-2xl p-5 flex items-center gap-4 bg-secondary/30 hover:bg-secondary/50 transition-all tap-scale text-left"
        >
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Scanner le carnet de santé</p>
            <p className="text-xs text-muted-foreground mt-0.5">Prends en photo une page de ton carnet vétérinaire. L'IA extrait automatiquement les vaccins, dates et traitements.</p>
          </div>
        </button>
      )}

      {phase === "scanning" && (
        <div className="border border-border rounded-2xl p-5 flex items-center gap-4 bg-white shadow-sm">
          {preview && <img src={preview} alt="scan" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">Analyse en cours...</p>
            <p className="text-xs text-muted-foreground mt-0.5">L'IA lit ton carnet vétérinaire</p>
          </div>
          <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

function Section({ title, emoji, items, onChange, fields }) {
  const update = (idx, key, value) => {
    const next = items.map((item, i) => i === idx ? { ...item, [key]: value } : item);
    onChange(next);
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, fields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {})]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-semibold text-foreground">{emoji} {title} ({items.length})</Label>
        <button onClick={add} className="text-xs text-primary flex items-center gap-0.5 hover:underline">
          <Plus className="w-3 h-3" /> Ajouter
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Aucun trouvé</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              {fields.map(f => (
                <Input
                  key={f.key}
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={item[f.key] || ""}
                  onChange={e => update(idx, f.key, e.target.value)}
                  className={`h-9 rounded-xl text-xs border-border ${f.className}`}
                />
              ))}
              <button onClick={() => remove(idx)} className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}