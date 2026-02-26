import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, ChevronRight, AlertTriangle, CheckCircle, AlertCircle, X } from "lucide-react";

const VERDICT_CONFIG = {
  safe: {
    label: "✅ Sans danger",
    color: "text-safe",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: CheckCircle,
    iconColor: "text-safe",
  },
  caution: {
    label: "⚠️ Avec précaution",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  toxic: {
    label: "🚫 DANGEREUX",
    color: "text-toxic",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertCircle,
    iconColor: "text-toxic",
  },
};

export default function Scan() {
  const [dog, setDog] = useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadDogAndHistory();
  }, []);

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
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const analyzeFood = async () => {
    if (!file || !dog) return;
    setScanning(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const prompt = `Tu es un expert en nutrition canine. Analyse cet aliment/cette étiquette pour un chien nommé ${dog.name} (${dog.breed}, ${dog.weight ? dog.weight + " kg" : ""}, allergies: ${dog.allergies || "aucune"}).

Identifie l'aliment et détermine s'il est dangereux pour ce chien spécifiquement.

Réponds UNIQUEMENT avec ce JSON :
{
  "food_name": "nom de l'aliment identifié",
  "verdict": "toxic" ou "caution" ou "safe",
  "score": nombre entre 0 et 10 (10 = parfaitement sûr),
  "details": "explication courte des risques ou bénéfices (2-3 phrases)",
  "recommendation": "conseil personnalisé pour ${dog.name} (1 phrase)"
}

Aliments TOXIQUES pour les chiens : raisins, chocolat, oignons, ail, xylitol, avocat, macadamia, alcool, noix de muscade.
Note: ${dog.allergies ? `${dog.name} est allergique à : ${dog.allergies}` : "pas d'allergie connue"}`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          food_name: { type: "string" },
          verdict: { type: "string" },
          score: { type: "number" },
          details: { type: "string" },
          recommendation: { type: "string" },
        },
      },
    });

    const scan = {
      dog_id: dog.id,
      photo_url: file_url,
      food_name: aiResult.food_name,
      verdict: aiResult.verdict,
      score: aiResult.score,
      details: aiResult.details,
      recommendation: aiResult.recommendation,
      timestamp: new Date().toISOString(),
    };

    await base44.entities.FoodScan.create(scan);
    setResult(scan);
    setHistory(prev => [scan, ...prev]);
    setScanning(false);
  };

  const verdictCfg = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      <div className="gradient-primary pt-10 pb-6 px-5">
        <h1 className="text-white font-bold text-xl mb-1">Scanner un aliment</h1>
        <p className="text-white/70 text-sm">
          {dog ? `Analyse personnalisée pour ${dog.name}` : "Chargement..."}
        </p>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Upload zone */}
        {!result && (
          <Card className="shadow-none border-dashed border-2 border-border">
            <CardContent className="p-0">
              <label className="flex flex-col items-center justify-center gap-4 py-10 cursor-pointer tap-scale">
                {preview ? (
                  <div className="relative w-full">
                    <img
                      src={preview}
                      alt="Aperçu"
                      className="w-full max-h-56 object-contain rounded-xl"
                    />
                    <button
                      onClick={e => { e.preventDefault(); setPreview(null); setFile(null); }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">Prendre ou importer une photo</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Emballage, étiquette ou aliment
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Upload className="w-3 h-3" />
                      <span>Appuyez pour choisir</span>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                />
              </label>
            </CardContent>
          </Card>
        )}

        {preview && !result && (
          <Button
            onClick={analyzeFood}
            disabled={scanning}
            className="w-full h-13 rounded-xl gradient-primary border-0 text-white font-semibold text-base shadow-lg shadow-primary/30 gap-2"
          >
            {scanning ? (
              <span className="animate-pulse">Analyse en cours...</span>
            ) : (
              <>Analyser cet aliment</>
            )}
          </Button>
        )}

        {/* Result */}
        {result && verdictCfg && (
          <div className="space-y-3 animate-slide-up">
            <Card className={`shadow-none border-2 ${verdictCfg.border} ${verdictCfg.bg}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <verdictCfg.icon className={`w-8 h-8 ${verdictCfg.iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <p className={`text-lg font-bold ${verdictCfg.color}`}>{verdictCfg.label}</p>
                    <p className="text-foreground font-semibold text-base mt-0.5">{result.food_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-white/70 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${
                            result.verdict === "safe" ? "bg-safe" : result.verdict === "caution" ? "bg-caution" : "bg-toxic"
                          }`}
                          style={{ width: `${result.score * 10}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${verdictCfg.color}`}>{result.score}/10</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mt-4 leading-relaxed">{result.details}</p>
                <div className="mt-3 p-3 bg-white/60 rounded-xl border border-white">
                  <p className="text-xs font-semibold text-primary mb-1">💡 Pour {dog?.name}</p>
                  <p className="text-sm text-foreground">{result.recommendation}</p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => { setResult(null); setPreview(null); setFile(null); }}
              variant="outline"
              className="w-full h-11 rounded-xl"
            >
              Scanner un autre aliment
            </Button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(s => !s)}
              className="flex items-center justify-between w-full py-2"
            >
              <h2 className="text-sm font-bold text-foreground">
                Historique ({history.length})
              </h2>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showHistory ? "rotate-90" : ""}`} />
            </button>

            {showHistory && (
              <div className="space-y-2 animate-slide-up">
                {history.slice(0, 10).map((scan, i) => {
                  const cfg = VERDICT_CONFIG[scan.verdict];
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                      <cfg.icon className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{scan.food_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(scan.timestamp).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${cfg.color}`}>{scan.score}/10</span>
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