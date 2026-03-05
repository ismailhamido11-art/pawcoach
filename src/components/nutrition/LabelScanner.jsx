import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Camera, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const spring = { type: "spring", stiffness: 400, damping: 30 };

function ScoreBar({ label, value, max = 100, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold text-foreground">{value}{max === 100 ? "%" : "g"}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
    </div>
  );
}

export default function LabelScanner({ dog }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file || !dog) return;
    setAnalyzing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const ageMonths = dog.birth_date
        ? Math.floor((Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30))
        : null;
      const ageText = ageMonths ? (ageMonths < 12 ? `${ageMonths} mois` : `${Math.floor(ageMonths / 12)} ans`) : "âge inconnu";

      const prompt = `Tu es un nutritionniste vétérinaire expert. Analyse cette photo d'étiquette nutritionnelle de nourriture pour chien.

Profil du chien :
- Nom : ${dog.name}
- Race : ${dog.breed || "inconnue"}
- Âge : ${ageText}
- Poids : ${dog.weight ? dog.weight + " kg" : "inconnu"}
- Allergies : ${dog.allergies || "aucune connue"}
- Régime : ${dog.diet_type || "non spécifié"}
- Restrictions : ${dog.diet_restrictions || "aucune"}

Extrait les informations nutritionnelles de l'étiquette et analyse leur compatibilité avec ce chien.

Retourne un JSON avec ces champs :
- product_name (string) : nom du produit détecté
- calories_per_100g (number) : kcal pour 100g
- protein_pct (number) : % protéines
- fat_pct (number) : % matières grasses
- fiber_pct (number) : % fibres
- moisture_pct (number) : % humidité
- ingredients_list (array of strings) : liste des 10 premiers ingrédients détectés
- allergen_alerts (array of strings) : ingrédients problématiques pour ce chien selon ses allergies/restrictions
- compatibility_score (number 1-10) : score global de compatibilité pour ce chien
- compatibility_verdict ("excellent" | "good" | "caution" | "avoid") : verdict
- daily_portion_g (number) : portion journalière recommandée en grammes pour ce chien
- pros (array of strings, max 3) : points positifs
- cons (array of strings, max 3) : points négatifs
- recommendation (string) : conseil personnalisé pour ${dog.name} en 2-3 phrases, en français, tutoiement

Réponds uniquement en JSON valide.`;

      const ai = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            calories_per_100g: { type: "number" },
            protein_pct: { type: "number" },
            fat_pct: { type: "number" },
            fiber_pct: { type: "number" },
            moisture_pct: { type: "number" },
            ingredients_list: { type: "array", items: { type: "string" } },
            allergen_alerts: { type: "array", items: { type: "string" } },
            compatibility_score: { type: "number" },
            compatibility_verdict: { type: "string" },
            daily_portion_g: { type: "number" },
            pros: { type: "array", items: { type: "string" } },
            cons: { type: "array", items: { type: "string" } },
            recommendation: { type: "string" },
          },
        },
      });

      setResult({ ...ai, photo_url: file_url });
      if (ai.allergen_alerts?.length > 0 && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {
      console.error("Label scan error:", e);
      toast.error("Impossible d'analyser cette étiquette. Assure-toi que l'image est nette.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setShowIngredients(false); };

  const verdictConfig = {
    excellent: { label: "Excellent choix", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle, iconColor: "text-green-500", barColor: "bg-green-500" },
    good:      { label: "Bon choix",       color: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-200",  icon: CheckCircle, iconColor: "text-blue-500",  barColor: "bg-blue-500" },
    caution:   { label: "Avec précaution", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle, iconColor: "text-amber-500", barColor: "bg-amber-500" },
    avoid:     { label: "À éviter",        color: "text-red-700",   bg: "bg-red-50",   border: "border-red-200",   icon: AlertCircle, iconColor: "text-red-500",   barColor: "bg-red-500" },
  };

  const cfg = result ? verdictConfig[result.compatibility_verdict] || verdictConfig.caution : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-foreground text-base">Scanner une étiquette nutritionnelle</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Prends en photo l'étiquette d'un paquet de croquettes ou friandises — l'IA extrait les ingrédients et vérifie la compatibilité avec {dog?.name || "ton chien"}.
        </p>
      </div>

      {/* Upload zone */}
      {!result && (
        <>
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => fileRef.current.click()}
            className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/30 py-8 flex flex-col items-center gap-3 hover:border-primary hover:bg-secondary/50 transition-colors"
          >
            {preview ? (
              <div className="relative w-full px-4">
                <img src={preview} alt="Aperçu" className="w-full max-h-48 object-contain rounded-xl" />
                <button onClick={e => { e.stopPropagation(); reset(); }}
                  className="absolute top-1 right-5 bg-white rounded-full p-1 shadow">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-md">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground text-sm">Photo de l'étiquette</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Ingrédients · Valeurs nutritionnelles · Allergènes</p>
                </div>
              </>
            )}
          </motion.button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

          {preview && (
            <Button onClick={analyze} disabled={analyzing}
              className="w-full h-12 rounded-xl gradient-primary border-0 text-white font-bold shadow-md">
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse en cours...
                </span>
              ) : "Analyser cette étiquette"}
            </Button>
          )}
        </>
      )}

      {/* Result */}
      {result && cfg && (
        <div className="space-y-3">
          {/* Verdict card */}
          <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-black text-foreground text-base leading-tight">{result.product_name || "Produit analysé"}</p>
                <div className={`inline-flex items-center gap-1 text-xs font-bold mt-1 ${cfg.color}`}>
                  <cfg.icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                  {cfg.label}
                </div>
              </div>
              <div className="text-center bg-white rounded-xl px-3 py-2 shadow-sm">
                <p className="text-2xl font-black text-foreground leading-none">{result.compatibility_score}</p>
                <p className="text-[10px] text-muted-foreground">/10</p>
              </div>
            </div>

            {/* Allergen alerts */}
            {result.allergen_alerts?.length > 0 && (
              <div className="bg-red-100 border border-red-300 rounded-xl p-3">
                <p className="text-xs font-bold text-red-700 mb-1">⚠️ Alertes allergènes pour {dog?.name}</p>
                <div className="flex flex-wrap gap-1">
                  {result.allergen_alerts.map((a, i) => (
                    <span key={i} className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-semibold">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Calories + portion */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-black text-foreground">{result.calories_per_100g ?? "?"}</p>
                <p className="text-[10px] text-muted-foreground">kcal / 100g</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-black text-primary">{result.daily_portion_g ?? "?"}<span className="text-sm font-bold">g</span></p>
                <p className="text-[10px] text-muted-foreground">Portion/jour {dog?.name}</p>
              </div>
            </div>

            {/* Macros */}
            <div className="bg-white rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-foreground mb-2">Composition nutritionnelle</p>
              {result.protein_pct != null && <ScoreBar label="Protéines" value={result.protein_pct} color="bg-blue-500" />}
              {result.fat_pct != null && <ScoreBar label="Matières grasses" value={result.fat_pct} color="bg-amber-400" />}
              {result.fiber_pct != null && <ScoreBar label="Fibres" value={result.fiber_pct} color="bg-green-500" />}
              {result.moisture_pct != null && <ScoreBar label="Humidité" value={result.moisture_pct} color="bg-sky-400" />}
            </div>

            {/* Pros / Cons */}
            {(result.pros?.length > 0 || result.cons?.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {result.pros?.length > 0 && (
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-[10px] font-bold text-green-700 mb-1.5">✅ Points positifs</p>
                    <ul className="space-y-1">
                      {result.pros.map((p, i) => <li key={i} className="text-[11px] text-foreground/80">{p}</li>)}
                    </ul>
                  </div>
                )}
                {result.cons?.length > 0 && (
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-[10px] font-bold text-red-600 mb-1.5">⚠️ Points négatifs</p>
                    <ul className="space-y-1">
                      {result.cons.map((c, i) => <li key={i} className="text-[11px] text-foreground/80">{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-white/80 rounded-xl p-3">
              <p className="text-xs font-bold text-primary mb-1">💡 Avis NutriCoach pour {dog?.name}</p>
              <p className="text-sm text-foreground leading-relaxed">{result.recommendation}</p>
            </div>

            {/* Ingredients toggle */}
            {result.ingredients_list?.length > 0 && (
              <>
                <button onClick={() => setShowIngredients(s => !s)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  {showIngredients ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showIngredients ? "Masquer les ingrédients" : `Voir les ${result.ingredients_list.length} ingrédients`}
                </button>
                {showIngredients && (
                  <div className="bg-white rounded-xl p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {result.ingredients_list.map((ing, i) => (
                        <span key={i} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          result.allergen_alerts?.some(a => ing.toLowerCase().includes(a.toLowerCase()))
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <Button variant="outline" onClick={reset} className="w-full h-11 rounded-xl font-semibold">
            Scanner une autre étiquette
          </Button>
        </div>
      )}
    </div>
  );
}