import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, AlertCircle, X, History } from "lucide-react";

const VERDICT_CONFIG = {
  safe: {
    label: "✅ Sans danger",
    badgeBg: "bg-green-100 text-green-700",
    cardBg: "bg-green-50",
    border: "border-green-200",
    ring: "#22c55e",
    icon: CheckCircle,
    iconColor: "text-green-500",
  },
  caution: {
    label: "⚠️ Avec précaution",
    badgeBg: "bg-amber-100 text-amber-700",
    cardBg: "bg-amber-50",
    border: "border-amber-200",
    ring: "#f59e0b",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  toxic: {
    label: "💀 TOXIQUE",
    badgeBg: "bg-red-100 text-red-700",
    cardBg: "bg-red-50",
    border: "border-red-200",
    ring: "#ef4444",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
};

function CircleScore({ score, color }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const filled = score != null ? (score / 10) * circ : 0;
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle
          cx="40" cy="40" r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-foreground leading-none">{score ?? "?"}</span>
        <span className="text-[10px] text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

export default function Scan() {
  const [dog, setDog] = useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadDogAndHistory(); }, []);

  const loadDogAndHistory = async () => {
    const user = await base44.auth.me();
    const dogs = await base44.entities.Dog.filter({ owner: user.email });
    if (dogs.length > 0) {
      setDog(dogs[0]);
      const scans = await base44.entities.FoodScan.filter({ dog_id: dogs[0].id });
      setHistory(scans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }
  };

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const analyzeFood = async () => {
    if (!file || !dog) return;
    setScanning(true);
    setShowDetails(false);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const ageText = dog.birth_date
      ? (() => {
          const months = Math.floor((Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30));
          return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
        })()
      : "âge inconnu";

    const prompt = `Tu es PawCoach, un analyseur de sécurité alimentaire pour chiens. Analyse cette image. Si c'est un aliment brut, identifie-le et classe-le en : TOXIQUE (avec emoji crâne), AVEC PRECAUTION (avec emoji avertissement), ou SANS DANGER (avec emoji coche verte). Si c'est une étiquette de croquettes/aliment pour animaux, analyse la composition nutritionnelle et donne un score sur 10. Personnalise pour ce chien : ${dog.name}, ${dog.breed || "race inconnue"}, ${ageText}, ${dog.weight ? dog.weight + "kg" : "poids inconnu"}, allergies : ${dog.allergies || "aucune"}. Réponds en français. Utilise le tutoiement. Formate ta réponse en JSON avec ces champs : food_name (string), verdict ("toxic", "caution", ou "safe"), score (number 1-10, null si aliment brut), summary (résumé de 2-3 lignes), details (analyse nutritionnelle ou explication détaillée), recommendation (conseil personnalisé pour ${dog.name}). Sois concis et chaleureux.`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          food_name: { type: "string" },
          verdict: { type: "string" },
          score: { type: "number" },
          summary: { type: "string" },
          details: { type: "string" },
          recommendation: { type: "string" },
        },
      },
    });

    setResult({ ...aiResult, photo_url: file_url, timestamp: new Date().toISOString() });
    setScanning(false);
  };

  const saveResult = async () => {
    if (!result || !dog) return;
    await base44.entities.FoodScan.create({
      dog_id: dog.id,
      photo_url: result.photo_url,
      food_name: result.food_name,
      verdict: result.verdict,
      score: result.score,
      details: result.details,
      recommendation: result.recommendation,
      timestamp: result.timestamp,
    });
    setSaved(true);
    setHistory(prev => [result, ...prev]);
  };

  const reset = () => { setResult(null); setPreview(null); setFile(null); setSaved(false); setShowDetails(false); };

  const verdictCfg = result ? VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.caution : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary pt-12 pb-6 px-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🐾</span>
          <span className="text-white font-bold text-base tracking-tight">PawCoach</span>
        </div>
        <h1 className="text-white font-bold text-2xl mt-3">Scan Bouffe</h1>
        <p className="text-white/70 text-sm mt-0.5">
          {dog ? `Analyse pour ${dog.name}` : "Chargement..."}
        </p>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Upload zone */}
        {!result && (
          <>
            <button
              onClick={() => fileRef.current.click()}
              className="w-full rounded-3xl border-2 border-dashed border-primary/30 bg-secondary/30 py-10 flex flex-col items-center gap-4 tap-scale hover:border-primary hover:bg-secondary/50 transition-all"
            >
              {preview ? (
                <div className="relative w-full px-4">
                  <img src={preview} alt="Aperçu" className="w-full max-h-56 object-contain rounded-2xl" />
                  <button
                    onClick={e => { e.stopPropagation(); reset(); }}
                    className="absolute top-2 right-6 bg-white rounded-full p-1 shadow"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center shadow-lg">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground text-base">Scanner un aliment</p>
                    <p className="text-sm text-muted-foreground mt-1">Photo depuis ta caméra ou galerie</p>
                    <p className="text-xs text-muted-foreground mt-1">Emballage, étiquette ou aliment brut</p>
                  </div>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

            {preview && (
              <Button
                onClick={analyzeFood}
                disabled={scanning}
                className="w-full h-14 rounded-2xl gradient-primary border-0 text-white font-bold text-base shadow-lg shadow-primary/30"
              >
                {scanning ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analyse en cours...
                  </span>
                ) : "Analyser cet aliment"}
              </Button>
            )}
          </>
        )}

        {/* Result card */}
        {result && verdictCfg && (
          <div className="space-y-3">
            <Card className={`shadow-none border-2 ${verdictCfg.border} ${verdictCfg.cardBg}`}>
              <CardContent className="p-5 space-y-4">
                {/* Top row: score + name + badge */}
                <div className="flex items-center gap-4">
                  <CircleScore score={result.score} color={verdictCfg.ring} />
                  <div className="flex-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${verdictCfg.badgeBg}`}>
                      {verdictCfg.label}
                    </span>
                    <p className="text-foreground font-bold text-lg mt-2 leading-tight">{result.food_name}</p>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>

                {/* Recommendation */}
                <div className="p-3 bg-white/70 rounded-2xl border border-white">
                  <p className="text-xs font-bold text-primary mb-1">💡 Pour {dog?.name}</p>
                  <p className="text-sm text-foreground">{result.recommendation}</p>
                </div>

                {/* Expandable details */}
                <button
                  onClick={() => setShowDetails(s => !s)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary"
                >
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showDetails ? "Masquer l'analyse" : "Voir l'analyse détaillée"}
                </button>
                {showDetails && (
                  <p className="text-sm text-foreground/70 leading-relaxed border-t border-white/60 pt-3">
                    {result.details}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={reset} className="h-12 rounded-2xl font-semibold">
                Nouveau scan
              </Button>
              <Button
                onClick={saveResult}
                disabled={saved}
                className="h-12 rounded-2xl gradient-primary border-0 text-white font-semibold"
              >
                {saved ? "✅ Sauvegardé" : "Sauvegarder"}
              </Button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && !result && (
          <div>
            <button
              onClick={() => setShowHistory(s => !s)}
              className="flex items-center justify-between w-full py-2"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">Historique ({history.length})</h2>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showHistory ? "rotate-180" : ""}`} />
            </button>

            {showHistory && (
              <div className="space-y-2">
                {history.slice(0, 10).map((scan, i) => {
                  const cfg = VERDICT_CONFIG[scan.verdict] || VERDICT_CONFIG.caution;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${cfg.border} ${cfg.cardBg}`}>
                      <Icon className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{scan.food_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(scan.timestamp).toLocaleDateString("fr-FR")}</p>
                      </div>
                      {scan.score != null && (
                        <span className="text-sm font-bold text-foreground">{scan.score}/10</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav currentPage="Scan" />
    </div>
  );
}