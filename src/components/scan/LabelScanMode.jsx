import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { FoodScan } from "@/api/entities";
import { Button } from "@/components/ui/button";
import {
  Tag, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, AlertCircle, Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";
import { spring } from "@/lib/animations";
import { toast } from "sonner";

const LABEL_VERDICT_CONFIG = {
  excellent: { label: "Excellent choix", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle, iconColor: "text-emerald-500" },
  good:      { label: "Bon choix",       color: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-200",  icon: CheckCircle, iconColor: "text-blue-500" },
  caution:   { label: "Avec précaution", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle, iconColor: "text-amber-500" },
  avoid:     { label: "À éviter",        color: "text-red-700",   bg: "bg-red-50",   border: "border-red-200",   icon: AlertCircle, iconColor: "text-red-500" },
};

function ScoreBar({ label, value, colorClass }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

/**
 * LabelScanMode — composant extrait de Scan.jsx
 *
 * Props:
 * - dog: objet chien actif
 * - user: objet utilisateur
 * - dietPreferences: preferences alimentaires du chien
 * - checkScanLimit: (user) => boolean — verifie si le quota est atteint
 * - incrementScanCount: (user) => Promise<void> — incremente le compteur
 * - setScanLimitReached: (boolean) => void — pour remonter l'etat de limite
 * - onLabelSaved: () => void — callback apres sauvegarde (optionnel)
 */
export default function LabelScanMode({ dog, user, dietPreferences, checkScanLimit, incrementScanCount, setScanLimitReached, onLabelSaved }) {
  const [labelPreview, setLabelPreview] = useState(null);
  const [labelFile, setLabelFile] = useState(null);
  const [labelScanning, setLabelScanning] = useState(false);
  const [labelResult, setLabelResult] = useState(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [labelSaved, setLabelSaved] = useState(false);
  const labelFileRef = useRef();

  const handleLabelFile = (f) => {
    if (checkScanLimit(user)) { setScanLimitReached(true); return; }
    setScanLimitReached(false);
    setLabelFile(f);
    setLabelResult(null);
    setShowIngredients(false);
    const reader = new FileReader();
    reader.onload = e => setLabelPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const analyzeLabel = async () => {
    if (!labelFile || !dog) return;
    const freshUser = await base44.auth.me();
    if (checkScanLimit(freshUser)) { setScanLimitReached(true); return; }
    setLabelScanning(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: labelFile });
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
- Aliments indésirables (préférences) : ${dietPreferences?.disliked_foods || "aucun"}

Extrait les informations nutritionnelles et analyse leur compatibilité avec ce chien.
Si des ingrédients de la liste correspondent aux aliments indésirables, les lister dans allergen_alerts avec la mention "(préférence)".
Retourne uniquement un JSON valide avec : product_name, calories_per_100g, protein_pct, fat_pct, fiber_pct, moisture_pct, ingredients_list (array string, 10 premiers), allergen_alerts (array string, ingrédients problématiques pour ce chien), compatibility_score (1-10), compatibility_verdict ("excellent"|"good"|"caution"|"avoid"), daily_portion_g (portion recommandée pour ce chien), pros (array string max 3), cons (array string max 3), recommendation (conseil 2-3 phrases en français tutoiement pour ${dog.name}).`;

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
      setLabelResult(ai);
      await incrementScanCount(freshUser);
      if (ai.allergen_alerts?.length > 0 && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {
      console.error(e);
      toast.error("Impossible d'analyser cette étiquette. Assure-toi que l'image est nette.");
    } finally {
      setLabelScanning(false);
    }
  };

  const saveLabelResult = async () => {
    if (!labelResult || !dog || !user || labelSaved) return;
    try {
      await FoodScan.create({
        dog_id: dog.id,
        food_name: labelResult.product_name || "Etiquette analysee",
        verdict: labelResult.compatibility_verdict === "excellent" || labelResult.compatibility_verdict === "good" ? "safe" : labelResult.compatibility_verdict === "avoid" ? "toxic" : "caution",
        score: labelResult.compatibility_score,
        details: `${labelResult.recommendation || ""}\nProteines: ${labelResult.protein_pct ?? "?"}%, Graisses: ${labelResult.fat_pct ?? "?"}%, Fibres: ${labelResult.fiber_pct ?? "?"}%`,
        recommendation: labelResult.recommendation,
        timestamp: new Date().toISOString(),
      });
      setLabelSaved(true);
      toast.success("Analyse sauvegardée !");
      onLabelSaved?.();
    } catch (e) {
      console.error(e);
      toast.error("Impossible de sauvegarder l'analyse. Réessaie.");
    }
  };

  const resetLabel = () => {
    setLabelFile(null);
    setLabelPreview(null);
    setLabelResult(null);
    setShowIngredients(false);
    setLabelSaved(false);
  };

  const labelCfg = labelResult ? LABEL_VERDICT_CONFIG[labelResult.compatibility_verdict] || LABEL_VERDICT_CONFIG.caution : null;

  return (
    <>
      {!labelResult && (
        <>
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={() => labelFileRef.current.click()}
            className="w-full rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/50 py-10 flex flex-col items-center gap-4 hover:border-violet-500 hover:bg-violet-50 transition-colors"
          >
            {labelPreview ? (
              <div className="relative w-full px-4">
                <img src={labelPreview} alt="Aperçu" loading="lazy" className="w-full max-h-56 object-contain rounded-2xl" />
                <button
                  onClick={e => { e.stopPropagation(); resetLabel(); }}
                  className="absolute top-2 right-6 bg-white rounded-full p-1 shadow"
                >
                  <span className="sr-only">Supprimer</span>
                  &#x2715;
                </button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
                  <Tag className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground text-base">Photo de l'étiquette nutritionnelle</p>
                  <p className="text-sm text-muted-foreground mt-1">Ingrédients · Calories · Macros · Allergènes</p>
                  <p className="text-xs text-muted-foreground mt-1">Croquettes, friandises, conserves...</p>
                </div>
              </>
            )}
          </motion.button>
          <input
            ref={labelFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => e.target.files[0] && handleLabelFile(e.target.files[0])}
          />

          {labelPreview && (
            <Button
              onClick={analyzeLabel}
              disabled={labelScanning}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 border-0 text-white font-bold text-base shadow-lg"
            >
              {labelScanning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extraction en cours...
                </span>
              ) : "Analyser cette étiquette"}
            </Button>
          )}
        </>
      )}

      {/* Label Result */}
      {labelResult && labelCfg && (
        <div className="space-y-3">
          {/* Header verdict */}
          <div className={`rounded-2xl border-2 ${labelCfg.border} ${labelCfg.bg} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="font-black text-foreground text-base leading-tight">{labelResult.product_name || "Produit analysé"}</p>
                <div className={`inline-flex items-center gap-1 text-xs font-bold mt-1 ${labelCfg.color}`}>
                  <labelCfg.icon className={`w-3.5 h-3.5 ${labelCfg.iconColor}`} />
                  {labelCfg.label}
                </div>
              </div>
              <div className="text-center bg-white rounded-xl px-3 py-2 shadow-sm ml-3">
                <p className="text-2xl font-black text-foreground leading-none">{labelResult.compatibility_score}</p>
                <p className="text-[11px] text-muted-foreground">/10</p>
              </div>
            </div>

            {/* Allergen alert */}
            {labelResult.allergen_alerts?.length > 0 && (
              <div className="bg-red-100 border border-red-300 rounded-xl p-3 mb-3">
                <p className="text-xs font-bold text-red-700 mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alertes pour {dog?.name}</p>
                <div className="flex flex-wrap gap-1">
                  {labelResult.allergen_alerts.map((a, i) => (
                    <span key={`allergen-${i}`} className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-semibold">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Calories + portion */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-black text-foreground">{labelResult.calories_per_100g ?? "?"}</p>
                <p className="text-[11px] text-muted-foreground">kcal / 100g</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-black text-violet-600">{labelResult.daily_portion_g ?? "?"}<span className="text-sm font-bold">g</span></p>
                <p className="text-[11px] text-muted-foreground">Portion/jour {dog?.name}</p>
              </div>
            </div>

            {/* Macros */}
            <div className="bg-white rounded-xl p-3 space-y-2 mb-3">
              <p className="text-xs font-bold text-foreground">Composition</p>
              {labelResult.protein_pct != null && <ScoreBar label="Protéines" value={labelResult.protein_pct} colorClass="bg-blue-500" />}
              {labelResult.fat_pct != null && <ScoreBar label="Matières grasses" value={labelResult.fat_pct} colorClass="bg-amber-400" />}
              {labelResult.fiber_pct != null && <ScoreBar label="Fibres" value={labelResult.fiber_pct} colorClass="bg-green-500" />}
              {labelResult.moisture_pct != null && <ScoreBar label="Humidité" value={labelResult.moisture_pct} colorClass="bg-sky-400" />}
            </div>

            {/* Pros / Cons */}
            {(labelResult.pros?.length > 0 || labelResult.cons?.length > 0) && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {labelResult.pros?.length > 0 && (
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-[11px] font-bold text-emerald-700 mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Points positifs</p>
                    <ul className="space-y-1">{labelResult.pros.map((p, i) => <li key={`pro-${i}`} className="text-xs text-foreground/80">{p}</li>)}</ul>
                  </div>
                )}
                {labelResult.cons?.length > 0 && (
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-[11px] font-bold text-red-600 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Points négatifs</p>
                    <ul className="space-y-1">{labelResult.cons.map((c, i) => <li key={`con-${i}`} className="text-xs text-foreground/80">{c}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-white/80 rounded-xl p-3 mb-2">
              <p className="text-xs font-bold text-violet-600 mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Avis NutriCoach pour {dog?.name}</p>
              <p className="text-sm text-foreground leading-relaxed">{labelResult.recommendation}</p>
            </div>

            {/* Ingredients toggle */}
            {labelResult.ingredients_list?.length > 0 && (
              <>
                <button onClick={() => setShowIngredients(s => !s)} className="flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                  {showIngredients ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showIngredients ? "Masquer les ingrédients" : `Voir les ${labelResult.ingredients_list.length} ingrédients`}
                </button>
                {showIngredients && (
                  <div className="bg-white rounded-xl p-3 mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {labelResult.ingredients_list.map((ing, i) => (
                        <span key={`ing-${i}`} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          labelResult.allergen_alerts?.some(a => ing.toLowerCase().includes(a.toLowerCase()))
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-muted text-muted-foreground"
                        }`}>{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={saveLabelResult}
              disabled={labelSaved}
              className={`flex-1 h-14 rounded-2xl font-semibold ${labelSaved ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "gradient-primary border-0 text-white"}`}
            >
              {labelSaved ? "Sauvegardée" : "Sauvegarder"}
            </Button>
            <Button variant="outline" onClick={resetLabel} className="flex-1 h-14 rounded-2xl font-semibold">
              Nouvelle analyse
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
