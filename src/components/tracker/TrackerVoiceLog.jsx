import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, Loader2, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const EXAMPLES = [
  "On a marché 45 minutes ce matin au parc",
  "Petite balade de 20 min + jeu dans le jardin 15 min",
  "Il a couru 1h aujourd'hui avec beaucoup d'énergie",
  "Juste 10 minutes ce soir, il faisait froid",
];

export default function TrackerVoiceLog({ dog, user, onLogged }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Reconnaissance vocale non supportée sur ce navigateur");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      setText(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  const parseText = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    setResult(null);
    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: `Extrait les données d'activité physique depuis ce texte en français: "${text}"
      
      Réponds UNIQUEMENT avec un JSON valide (sans markdown):
      {
        "walk_minutes": <nombre total de minutes d'activité/marche, null si absent>,
        "notes": "<résumé court de l'activité en français, max 60 caractères>"
      }
      
      Exemples: "45 min de balade" → 45, "1 heure de course" → 60, "20 min matin + 15 min soir" → 35`,
      response_json_schema: {
        type: "object",
        properties: {
          walk_minutes: { type: "number" },
          notes: { type: "string" }
        }
      }
    });
    setResult(parsed);
    setProcessing(false);
  };

  const handleSave = async () => {
    if (!dog || !result?.walk_minutes) return;
    setSaving(true);
    const today = getTodayString();
    const existing = await base44.entities.DailyLog.filter({ dog_id: dog.id, date: today });
    const payload = {
      dog_id: dog.id,
      date: today,
      owner: user?.email || "",
      walk_minutes: result.walk_minutes,
      notes: result.notes || text,
    };
    if (existing?.length > 0) {
      await base44.entities.DailyLog.update(existing[0].id, payload);
    } else {
      await base44.entities.DailyLog.create(payload);
    }
    setSaving(false);
    setDone(true);
    toast.success(`${result.walk_minutes} min enregistrées !`);
    onLogged?.();
    setTimeout(() => { setDone(false); setText(""); setResult(null); }, 2000);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Info */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
        <p className="font-bold text-sm text-violet-700 mb-1">🎙️ Dictée intelligente</p>
        <p className="text-xs text-violet-600 leading-relaxed">
          Décris l'activité de {dog?.name || "ton chien"} en langage naturel. L'IA extrait automatiquement les minutes et les enregistre.
        </p>
      </div>

      {/* Input area */}
      <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
        <textarea
          className="w-full resize-none text-sm text-foreground placeholder:text-muted-foreground/50 outline-none bg-transparent min-h-[80px]"
          placeholder="Ex: On a fait une balade de 45 minutes ce matin au parc..."
          value={text}
          onChange={e => { setText(e.target.value); setResult(null); setDone(false); }}
        />
        <div className="flex gap-2">
          <button
            onClick={startListening}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? "En écoute..." : "Dicter"}
          </button>
          <Button
            onClick={parseText}
            disabled={!text.trim() || processing}
            className="flex-1 h-10 rounded-xl font-bold gap-1.5 bg-primary"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Analyser
          </Button>
        </div>
      </div>

      {/* Examples */}
      {!text && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground px-1">💡 Exemples de saisie</p>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setText(ex)}
              className="w-full text-left text-xs bg-white border border-border rounded-xl px-3 py-2.5 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              "{ex}"
            </button>
          ))}
        </div>
      )}

      {/* Result */}
      {result && !processing && (
        <div className="bg-white border border-safe/30 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-safe">✅ Données extraites</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-safe/10 rounded-xl px-3 py-3 text-center">
              <p className="text-2xl font-black text-safe">{result.walk_minutes ?? "—"}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">MINUTES</p>
            </div>
            <div className="flex-1 bg-muted/40 rounded-xl px-3 py-3 flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center italic">"{result.notes}"</p>
            </div>
          </div>
          {result.walk_minutes ? (
            <Button
              onClick={handleSave}
              disabled={saving || done}
              className="w-full h-11 rounded-xl font-bold gap-2"
              style={{ background: done ? "#10b981" : "linear-gradient(135deg, #0f4c3a, #2d9f82)" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : null}
              {done ? "Enregistré !" : "Enregistrer pour aujourd'hui"}
            </Button>
          ) : (
            <p className="text-xs text-amber-600 text-center">Aucune durée détectée. Reformule ta description.</p>
          )}
        </div>
      )}
    </div>
  );
}