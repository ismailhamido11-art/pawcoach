import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Camera, Plus, TrendingUp, Weight, Ruler, Sparkles, ChevronRight, Trash2, Check, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { format, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

// Breed reference curves (weight in kg by age in months)
const BREED_REFERENCES = {
  default:      { adult_weight: 20, adult_height: 50, curve: [0.3, 1, 2.5, 4.5, 7, 9.5, 12, 14, 16, 18, 19, 20, 20] },
  small:        { adult_weight: 6,  adult_height: 28, curve: [0.1, 0.5, 1.2, 2, 2.8, 3.5, 4, 5, 5.5, 5.8, 6, 6, 6] },
  large:        { adult_weight: 35, adult_height: 65, curve: [0.5, 2, 5, 9, 14, 19, 24, 28, 31, 33, 35, 35, 35] },
  giant:        { adult_weight: 55, adult_height: 80, curve: [1, 4, 9, 16, 24, 32, 38, 43, 47, 51, 53, 55, 55] },
};

function getBreedCategory(breed = "") {
  const b = breed.toLowerCase();
  if (b.match(/chihuahua|yorkshire|maltais|bichon|toy|mini|nain/)) return "small";
  if (b.match(/labrador|berger|golden|husky|boxer|border|malinois|doberman|rottweiler|akita/)) return "large";
  if (b.match(/saint-bernard|dogue|grande pyrenees|leonberg|terre-neuve|dogue de bordeaux/)) return "giant";
  return "default";
}

function getRefWeight(ageMonths, category) {
  const ref = BREED_REFERENCES[category];
  const idx = Math.min(Math.floor(ageMonths / 2), ref.curve.length - 1);
  return ref.curve[idx];
}

function getBcsLabel(score) {
  if (score <= 3) return { label: "Trop maigre", color: "text-blue-600" };
  if (score <= 4) return { label: "Sous le poids idéal", color: "text-sky-500" };
  if (score === 5) return { label: "Poids idéal", color: "text-emerald-500" };
  if (score <= 6) return { label: "Légèrement en surpoids", color: "text-amber-500" };
  if (score <= 7) return { label: "En surpoids", color: "text-amber-500" };
  return { label: "Obèse", color: "text-red-500" };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl p-3 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(1)} {p.name.includes("kg") || p.name.includes("Poids") ? "kg" : "cm"}</p>
      ))}
    </div>
  );
};

export default function GrowthTrackerContent({ dog, user }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [savedAnalysis, setSavedAnalysis] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [manualForm, setManualForm] = useState({ date: format(new Date(), "yyyy-MM-dd"), weight_kg: "", height_cm: "" });
  const [activeChart, setActiveChart] = useState("weight");
  const fileRef = useRef();

  useEffect(() => {
    if (dog?.id) loadEntries();
  }, [dog]);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await base44.entities.GrowthEntry.filter({ dog_id: dog.id }, "-date", 50);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPremium && !hasCredits) {
      toast.error("Plus d'actions IA disponibles aujourd'hui");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const resp = await base44.functions.invoke("analyzeGrowthPhoto", {
        dogId: dog.id,
        photoUrl: file_url,
        dogBreed: dog.breed,
        dogBirthDate: dog.birth_date,
        currentWeight: dog.weight,
      });
      const analysis = resp.data?.analysis;
      setAnalysisResult({ ...analysis, photo_url: file_url });
      if (!isPremium) await consume();
    } catch (err) {
      toast.error("Erreur lors de l'analyse. Réessaie.");
      setPreviewUrl(null);
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveAnalysis() {
    if (!analysisResult) return;
    setSavedAnalysis(true);
    await base44.entities.GrowthEntry.create({
      dog_id: dog.id,
      owner_email: user.email,
      date: format(new Date(), "yyyy-MM-dd"),
      weight_kg: analysisResult.weight_kg,
      height_cm: analysisResult.height_cm,
      body_condition_score: analysisResult.body_condition_score,
      growth_stage: analysisResult.growth_stage,
      ai_notes: analysisResult.ai_notes,
      photo_url: analysisResult.photo_url,
      source: "photo_ai",
    });
    toast.success("Mesure enregistrée !");
    setTimeout(() => {
      setSavedAnalysis(false);
      setAnalysisResult(null);
      setPreviewUrl(null);
      loadEntries();
    }, 1200);
  }

  async function saveManual() {
    if (!manualForm.weight_kg && !manualForm.height_cm) return;
    setSavingManual(true);
    await base44.entities.GrowthEntry.create({
      dog_id: dog.id,
      owner_email: user.email,
      date: manualForm.date,
      weight_kg: manualForm.weight_kg ? parseFloat(manualForm.weight_kg) : undefined,
      height_cm: manualForm.height_cm ? parseFloat(manualForm.height_cm) : undefined,
      source: "manual",
    });
    toast.success("Mesure ajoutée !");
    setSavingManual(false);
    setShowAddManual(false);
    setManualForm({ date: format(new Date(), "yyyy-MM-dd"), weight_kg: "", height_cm: "" });
    loadEntries();
  }

  async function deleteEntry(id) {
    await base44.entities.GrowthEntry.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  // Build chart data
  const category = getBreedCategory(dog?.breed);
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const chartData = sorted.map(e => {
    let ageM = null;
    if (dog?.birth_date) {
      ageM = differenceInMonths(new Date(e.date), new Date(dog.birth_date));
    }
    return {
      label: format(new Date(e.date), "dd MMM yy", { locale: fr }),
      weight: e.weight_kg || null,
      height: e.height_cm || null,
      ref_weight: ageM !== null ? getRefWeight(ageM, category) : null,
      bcs: e.body_condition_score || null,
    };
  });

  const latest = sorted[sorted.length - 1];
  const bcsInfo = latest?.body_condition_score ? getBcsLabel(latest.body_condition_score) : null;

  return (
    <div className="px-4 py-4 pb-8 space-y-4">
      {/* Header stats */}
      {latest && (
        <div className="grid grid-cols-3 gap-2">
          {latest.weight_kg && (
            <div className="bg-white rounded-2xl p-3 text-center border border-border shadow-sm">
              <Weight className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{latest.weight_kg} kg</p>
              <p className="text-[10px] text-muted-foreground">Poids actuel</p>
            </div>
          )}
          {latest.height_cm && (
            <div className="bg-white rounded-2xl p-3 text-center border border-border shadow-sm">
              <Ruler className="w-4 h-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{latest.height_cm} cm</p>
              <p className="text-[10px] text-muted-foreground">Hauteur</p>
            </div>
          )}
          {bcsInfo && (
            <div className="bg-white rounded-2xl p-3 text-center border border-border shadow-sm">
              <TrendingUp className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className={`text-sm font-black ${bcsInfo.color}`}>{latest.body_condition_score}/9</p>
              <p className="text-[10px] text-muted-foreground">{bcsInfo.label}</p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-foreground">Courbe de croissance</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveChart("weight")}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${activeChart === "weight" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
              >Poids</button>
              <button
                onClick={() => setActiveChart("height")}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${activeChart === "height" ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`}
              >Taille</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,50%,22%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(160,50%,22%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRef" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38,92%,55%)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(38,92%,55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              {activeChart === "weight" && (
                <>
                  <Area type="monotone" dataKey="weight" name="Poids (kg)" stroke="hsl(160,50%,22%)" fill="url(#gWeight)" strokeWidth={2} dot={{ r: 3, fill: "hsl(160,50%,22%)" }} connectNulls />
                  {chartData.some(d => d.ref_weight) && (
                    <Area type="monotone" dataKey="ref_weight" name="Réf. race (kg)" stroke="hsl(38,92%,55%)" fill="url(#gRef)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls />
                  )}
                </>
              )}
              {activeChart === "height" && (
                <Area type="monotone" dataKey="height" name="Hauteur (cm)" stroke="hsl(162,55%,42%)" fill="url(#gWeight)" strokeWidth={2} dot={{ r: 3, fill: "hsl(162,55%,42%)" }} connectNulls />
              )}
            </AreaChart>
          </ResponsiveContainer>
          {activeChart === "weight" && chartData.some(d => d.ref_weight) && (
            <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block rounded" /> {dog?.name}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-caution inline-block rounded border-dashed" /> Référence race</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <label className="cursor-pointer">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
          <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-primary to-accent rounded-2xl p-4 text-white text-center shadow-md">
            <Camera className="w-6 h-6" />
            <span className="text-xs font-bold">Analyser une photo</span>
            <span className="text-[10px] text-white/70">IA morphologique</span>
          </div>
        </label>
        <button onClick={() => setShowAddManual(true)} className="flex flex-col items-center gap-2 bg-white border border-border rounded-2xl p-4 text-foreground text-center shadow-sm">
          <Plus className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs font-bold">Mesure manuelle</span>
          <span className="text-[10px] text-muted-foreground">Poids / taille</span>
        </button>
      </div>

      {/* Photo analysis preview */}
      <AnimatePresence>
        {(previewUrl || analyzing || analysisResult) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-md"
          >
            {previewUrl && (
              <img src={previewUrl} alt="Analyse" className="w-full h-40 object-cover" />
            )}
            {analyzing && (
              <div className="flex items-center gap-3 p-4">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="font-bold text-sm">Analyse en cours…</p>
                  <p className="text-xs text-muted-foreground">L'IA étudie la morphologie de {dog?.name}</p>
                </div>
              </div>
            )}
            {analysisResult && !analyzing && (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="font-bold text-sm">Résultat de l'analyse</p>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${analysisResult.confidence === "high" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {analysisResult.confidence === "high" ? "Haute confiance" : "Confiance moyenne"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {analysisResult.weight_kg && (
                    <div className="bg-secondary rounded-xl p-2 text-center">
                      <p className="text-base font-black text-primary">{analysisResult.weight_kg} kg</p>
                      <p className="text-[10px] text-muted-foreground">Poids estimé</p>
                    </div>
                  )}
                  {analysisResult.height_cm && (
                    <div className="bg-secondary rounded-xl p-2 text-center">
                      <p className="text-base font-black text-accent">{analysisResult.height_cm} cm</p>
                      <p className="text-[10px] text-muted-foreground">Hauteur</p>
                    </div>
                  )}
                  {analysisResult.body_condition_score && (
                    <div className="bg-secondary rounded-xl p-2 text-center">
                      <p className={`text-base font-black ${getBcsLabel(analysisResult.body_condition_score).color}`}>{analysisResult.body_condition_score}/9</p>
                      <p className="text-[10px] text-muted-foreground">Score BCS</p>
                    </div>
                  )}
                </div>
                {analysisResult.ai_notes && (
                  <p className="text-xs text-muted-foreground bg-secondary rounded-xl p-3 leading-relaxed">{analysisResult.ai_notes}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className={`flex-1 transition-all duration-300 ${savedAnalysis ? "bg-green-500 hover:bg-green-500" : ""}`} onClick={saveAnalysis} disabled={savedAnalysis}>
                    <Check className="w-4 h-4 mr-1" /> {savedAnalysis ? "Enregistré !" : "Enregistrer"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAnalysisResult(null); setPreviewUrl(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual form */}
      <AnimatePresence>
        {showAddManual && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3"
          >
            <p className="font-bold text-sm">Ajouter une mesure</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground font-bold">Date</label>
                <input type="date" value={manualForm.date} onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full mt-1 text-xs border border-border rounded-lg px-2 py-2 bg-background" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold">Poids (kg)</label>
                <input type="number" step="0.1" placeholder="ex: 12.5" value={manualForm.weight_kg}
                  onChange={e => setManualForm(p => ({ ...p, weight_kg: e.target.value }))}
                  className="w-full mt-1 text-xs border border-border rounded-lg px-2 py-2 bg-background" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold">Taille (cm)</label>
                <input type="number" step="0.5" placeholder="ex: 45" value={manualForm.height_cm}
                  onChange={e => setManualForm(p => ({ ...p, height_cm: e.target.value }))}
                  className="w-full mt-1 text-xs border border-border rounded-lg px-2 py-2 bg-background" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={saveManual} disabled={savingManual}>
                {savingManual ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin mr-1" />Enregistrement...</> : "Enregistrer"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddManual(false)}>Annuler</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Historique</p>
          {sorted.slice().reverse().map(entry => (
            <div key={entry.id} className="bg-white border border-border rounded-2xl p-3 flex items-center gap-3 shadow-sm">
              {entry.photo_url ? (
                <img src={entry.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">{format(new Date(entry.date), "d MMMM yyyy", { locale: fr })}</p>
                <div className="flex gap-2 mt-0.5">
                  {entry.weight_kg && <span className="text-[10px] text-muted-foreground">{entry.weight_kg} kg</span>}
                  {entry.height_cm && <span className="text-[10px] text-muted-foreground">{entry.height_cm} cm</span>}
                  {entry.body_condition_score && <span className={`text-[10px] font-bold ${getBcsLabel(entry.body_condition_score).color}`}>BCS {entry.body_condition_score}/9</span>}
                </div>
                {entry.ai_notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{entry.ai_notes}</p>}
              </div>
              <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Aucune mesure enregistrée</p>
          <p className="text-xs mt-1">Prends une photo de {dog?.name} pour commencer</p>
        </div>
      )}
    </div>
  );
}