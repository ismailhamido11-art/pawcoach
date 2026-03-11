import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShoppingCart, BookmarkPlus, Check, Home, AlertTriangle, ChevronDown, ChevronUp, Pencil, X, Trash2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MONTHLY_FREE_LIMIT = 2;
const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function getAge(birthDate) {
  if (!birthDate) return null;
  const months = Math.floor((Date.now() - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30));
  return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
}

function parsePlanJSON(text) {
  if (!text) return null;
  try {
    const data = JSON.parse(text);
    if (data.days && Array.isArray(data.days)) return data;
  } catch { /* not JSON */ }
  return null;
}

function getTodayDayName() {
  return DAYS_FR[new Date().getDay()];
}

function getPlanProgress(planData) {
  if (!planData?.start_date) return null;
  const start = new Date(planData.start_date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const elapsed = Math.floor((now - start) / 86400000);
  const dayNumber = Math.max(1, Math.min(elapsed + 1, 7));
  const isExpired = elapsed >= 7;
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + 6);
  return { dayNumber, isExpired, elapsed, startDate: start, endDate };
}

const AFFILIATE_BRANDS = [
  { name: "Royal Canin", url: "https://amzn.to/royalcanin", emoji: "\u{1F451}" },
  { name: "Hill's Science Plan", url: "https://amzn.to/hills", emoji: "\u{1F52C}" },
  { name: "Orijen", url: "https://www.zooplus.fr", emoji: "\u{1F98C}" },
  { name: "Purina Pro Plan", url: "https://amzn.to/proplan", emoji: "\u2B50" },
  { name: "Acana", url: "https://www.zooplus.fr", emoji: "\u{1F33F}" },
];

export default function NutritionMealPlan({ dog, recentScans, isPremium: _isPremiumProp, user, dietPrefs, checkins = [], healthRecords = [], dailyLogs = [], activePlan, monthlyPlanCount = 0, onPlanSaved, allPlans = [], onSwitchToCoach }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generationNotes, setGenerationNotes] = useState("");
  const [showWeek, setShowWeek] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  if (!dog) {
    return <p className="text-muted-foreground text-sm text-center py-10">Aucun chien trouvé.</p>;
  }

  const isMonthlyLimitReached = !isPremium && monthlyPlanCount >= MONTHLY_FREE_LIMIT;
  const activeData = activePlan ? parsePlanJSON(activePlan.plan_text) : null;
  const progress = activeData ? getPlanProgress(activeData) : null;
  const todayName = getTodayDayName();
  const todayMeal = activeData?.days?.find(d => d.day === todayName);

  // Past plans = all except active, sorted by date
  const pastPlans = allPlans
    .filter(p => !activePlan || p.id !== activePlan.id)
    .sort((a, b) => (b.generated_at || "").localeCompare(a.generated_at || ""));

  const handleSaveNote = async () => {
    if (!activePlan) return;
    try {
      await base44.entities.NutritionPlan.update(activePlan.id, { notes: tempNote });
      setEditingNote(false);
      toast.success("Note sauvegardée");
      onPlanSaved?.(); // refresh to get updated notes without mutating props
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await base44.entities.NutritionPlan.delete(planId);
      onPlanSaved?.();
      toast.success("Plan supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleActivateOld = async (planId) => {
    try {
      if (activePlan) {
        await base44.entities.NutritionPlan.update(activePlan.id, { is_active: false });
      }
      await base44.entities.NutritionPlan.update(planId, { is_active: true });
      onPlanSaved?.();
      toast.success("Plan activé !");
    } catch {
      toast.error("Erreur");
    }
  };

  const savePlan = async () => {
    if (!plan || !dog || !user) return;
    setSaving(true);
    try {
      const existing = await base44.entities.NutritionPlan.filter(
        { dog_id: dog.id, owner_email: user.email }
      ).catch(() => []);
      await Promise.all(
        (existing || []).filter(p => p.is_active).map(p =>
          base44.entities.NutritionPlan.update(p.id, { is_active: false })
        )
      );
      await base44.entities.NutritionPlan.create({
        dog_id: dog.id,
        owner_email: user.email,
        plan_text: JSON.stringify({ ...plan, start_date: new Date().toISOString().split("T")[0], dog_name: dog.name }),
        generated_at: new Date().toISOString(),
        dog_weight_at_generation: dog.weight,
        is_active: true,
        notes: generationNotes || "",
      });
      setSaved(true);
      onPlanSaved?.();
      toast.success("Programme activé !");
      setTimeout(() => { setSaved(false); setPlan(null); setShowGenerator(false); setGenerationNotes(""); }, 2000);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    if (!isPremium && !hasCredits) return;
    if (isMonthlyLimitReached) return;
    setLoading(true);
    setPlan(null);

    const activityMap = { faible: "Faible (< 30 min/jour)", modere: "Modérée (30-60 min/jour)", eleve: "Élevée (1-2h/jour)", tres_eleve: "Très élevée (> 2h/jour)" };
    const dietMap = { kibble: "Croquettes sèches", barf: "BARF (viande crue)", mixed: "Mixte (croquettes + ménager)", homemade: "Ration ménagère" };

    const ageMonths = dog.birth_date ? Math.floor((Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30)) : null;
    const lifeStage = !ageMonths ? "adulte" : ageMonths < 12 ? "chiot" : ageMonths > 84 ? "senior" : "adulte";

    const scansContext = recentScans.length > 0
      ? `\nScans alimentaires récents : ${recentScans.map(s => `${s.food_name} (${s.verdict})`).join(", ")}`
      : "";

    let prefsContext = "";
    if (dietPrefs) {
      let brands = "non précisées";
      try { brands = dietPrefs.preferred_brands ? JSON.parse(dietPrefs.preferred_brands).join(", ") : "non précisées"; } catch { /* */ }
      let mealTimesStr = "";
      try {
        const mt = dietPrefs.meal_times ? JSON.parse(dietPrefs.meal_times) : {};
        const parts = [];
        if (mt.morning) parts.push(`matin ${mt.morning}`);
        if (mt.noon) parts.push(`midi ${mt.noon}`);
        if (mt.evening) parts.push(`soir ${mt.evening}`);
        mealTimesStr = parts.length > 0 ? parts.join(", ") : "non précisés";
      } catch { mealTimesStr = "non précisés"; }
      const portions = dietPrefs.portions_per_day || 2;
      prefsContext = `\n## PRÉFÉRENCES ALIMENTAIRES DU PROPRIÉTAIRE\n- Marques préférées : ${brands}\n- Aliments refusés par le chien : ${dietPrefs.disliked_foods || "aucun"}\n- Repas par jour : ${portions}\n- Horaires repas : ${mealTimesStr}\n- Budget mensuel : ${({ low: "économique (<30\u20ac)", medium: "standard (30-70\u20ac)", high: "premium (>70\u20ac)" })[dietPrefs.budget_monthly] || "standard"}\n- Préférence bio : ${dietPrefs.organic_preference ? "Oui" : "Non"}\n- Notes : ${dietPrefs.notes || "aucune"}`;
    }

    let checkinContext = "";
    const recentCheckins = (checkins || [])
      .filter(c => c.date && (Date.now() - new Date(c.date).getTime()) < 7 * 86400000)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (recentCheckins.length > 0) {
      const moodMap = { great: "excellent", good: "bon", neutral: "neutre", bad: "mauvais", terrible: "très mauvais" };
      const appetiteMap = { normal: "normal", increased: "augmenté", decreased: "diminué", none: "aucun" };
      const energyMap = { high: "haute", medium: "moyenne", low: "basse" };
      const moods = recentCheckins.map(c => moodMap[c.mood] || c.mood).filter(Boolean);
      const appetites = recentCheckins.map(c => appetiteMap[c.appetite] || c.appetite).filter(Boolean);
      const energies = recentCheckins.map(c => energyMap[c.energy] || c.energy).filter(Boolean);
      checkinContext = `\n## BIEN-ÊTRE RÉCENT (${recentCheckins.length} check-ins, 7 derniers jours)\n- Appétit : ${appetites.join(", ")}\n- Humeur : ${moods.join(", ")}\n- Énergie : ${energies.join(", ")}`;
      const hasLowAppetite = appetites.some(a => a === "diminué" || a === "aucun");
      if (hasLowAppetite) checkinContext += "\n- APPÉTIT EN BAISSE : adapter les repas (plus appétissants, portions réduites, fractionner)";
    }

    let healthContext = "";
    const weightRecords = (healthRecords || [])
      .filter(r => r.type === "weight" && r.value)
      .sort((a, b) => new Date(b.date || b.created_date) - new Date(a.date || a.created_date))
      .slice(0, 5);
    const recentVetVisits = (healthRecords || [])
      .filter(r => r.type === "vet_visit")
      .sort((a, b) => new Date(b.date || b.created_date) - new Date(a.date || a.created_date))
      .slice(0, 2);
    if (weightRecords.length >= 2 || recentVetVisits.length > 0) {
      healthContext = "\n## CONTEXTE SANTÉ";
      if (weightRecords.length >= 2) {
        const latest = parseFloat(weightRecords[0].value);
        const previous = parseFloat(weightRecords[1].value);
        const diff = (latest - previous).toFixed(1);
        healthContext += `\n- Tendance poids : ${latest} kg (${Number(diff) > 0 ? "+" : ""}${diff} kg récemment)${Number(diff) > 1 ? " → réduire les calories" : Number(diff) < -1 ? " → augmenter les calories" : ""}`;
      }
      if (recentVetVisits.length > 0) {
        healthContext += `\n- Dernière visite véto : ${recentVetVisits[0].title || "visite"}${recentVetVisits[0].details ? ` — ${recentVetVisits[0].details.substring(0, 80)}` : ""}`;
      }
    }

    let activityContext = "";
    const recentLogs = (dailyLogs || [])
      .filter(l => l.date && (Date.now() - new Date(l.date).getTime()) < 7 * 86400000);
    if (recentLogs.length > 0) {
      const totalMin = recentLogs.reduce((s, l) => s + (l.walk_minutes || 0), 0);
      const avgMin = Math.round(totalMin / recentLogs.length);
      activityContext = `\n## ACTIVITÉ RÉELLE (7 derniers jours)\n- Moyenne : ${avgMin} min de balade/jour (${recentLogs.length} jours enregistrés)\n- Adapter les calories selon l'activité réelle, pas seulement le profil`;
    }

    let previousPlanContext = "";
    if (activePlan) {
      try {
        const prevData = JSON.parse(activePlan.plan_text);
        if (prevData.days && Array.isArray(prevData.days)) {
          const prevFoods = prevData.days.map(d =>
            [d.morning?.food, d.noon?.food, d.evening?.food].filter(Boolean).join(", ")
          ).join("; ");
          previousPlanContext = `\n## PLAN PRÉCÉDENT (varie les repas !)\nRepas du plan précédent : ${prevFoods.substring(0, 300)}\nIMPORTANT : propose des repas DIFFÉRENTS pour varier l'alimentation.`;
        }
      } catch { /* not JSON */ }
    }

    // User notes for generation
    const userNotesContext = generationNotes.trim()
      ? `\n## INSTRUCTIONS SPÉCIALES DU PROPRIÉTAIRE\n${generationNotes.trim()}`
      : "";

    const month = new Date().getMonth();
    const season = month >= 2 && month <= 4 ? "printemps" : month >= 5 && month <= 7 ? "été (adapter hydratation)" : month >= 8 && month <= 10 ? "automne" : "hiver (besoins énergétiques plus élevés)";

    const prompt = `Tu es un nutritionniste vétérinaire expert. Génère un plan repas de 7 jours pour ce chien.

PROFIL : ${dog.name}, ${dog.breed || "race inconnue"}, ${lifeStage} (${getAge(dog.birth_date) || "âge inconnu"}), ${dog.weight ? dog.weight + " kg" : "poids inconnu"}, ${dog.sex === "male" ? "mâle" : dog.sex === "female" ? "femelle" : "sexe inconnu"}, activité ${activityMap[dog.activity_level] || "modérée"}, ${dog.neutered ? "stérilisé(e)" : "non stérilisé(e)"}, alimentation ${dietMap[dog.diet_type] || "croquettes"} ${dog.diet_brand ? `(${dog.diet_brand})` : ""}, allergies : ${dog.allergies || "aucune"}, santé : ${dog.health_issues || "aucun problème"}, environnement : ${dog.environment || "non précisé"}${dog.status && dog.status !== "healthy" ? `, STATUT : ${dog.status === "recovering" ? "en convalescence (repas doux, faciles à digérer)" : dog.status}` : ""}
Saison : ${season}${scansContext}${prefsContext}${checkinContext}${healthContext}${activityContext}${previousPlanContext}${userNotesContext}

RÉPONDS UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans bloc markdown. Structure exacte :
{
  "calories_per_day": 850,
  "quantity_summary": "240g de croquettes par jour",
  "days": [
    {
      "day": "Lundi",
      "morning": { "food": "Croquettes + huile de saumon", "quantity": "145g + 1 c.c." },
      "noon": { "food": "Crostille ou friandise faible en calories", "quantity": "10g" },
      "evening": { "food": "Croquettes + courgette cuite", "quantity": "95g + 30g" }
    }
  ],
  "supplements": ["Carotte crue (2x/sem)", "Pomme sans pepins (1x/sem)"],
  "avoid": ["Raisins", "Chocolat", "Oignons"],
  "tip": "Un conseil personnalise pour ce chien.",
  "rationale": [
    "Proteines variees pour couvrir tous les acides amines essentiels",
    "Calories adaptees au poids et au niveau d'activite",
    "Huile de saumon pour le pelage et les articulations"
  ]
}

RÈGLES :
- Le tableau "days" doit contenir exactement 7 jours : Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche
- Nombre de repas par jour : ${dietPrefs?.portions_per_day || 2}. Respecte EXACTEMENT ce nombre :
  * 1 repas/jour → inclure UNIQUEMENT "morning" (pas de noon ni evening)
  * 2 repas/jour → inclure UNIQUEMENT "morning" et "evening" (pas de noon)
  * 3 repas/jour → inclure "morning", "noon" ET "evening"
- Varie les protéines et compléments au fil de la semaine
- Adapte les quantités au poids, âge, activité, stérilisation ET aux données réelles ci-dessus
- Si l'appétit est en baisse, propose des repas plus appétissants et fractionnés
- Si le poids augmente, réduis les calories ; s'il diminue, augmente-les
- Sois concis dans les descriptions (pas de phrases longues)
- N'utilise PAS de caracteres speciaux, d'emojis ou de sequences Unicode dans le JSON
- Le champ "rationale" doit contenir 3 a 5 raisons courtes expliquant POURQUOI ce plan est adapte a ce chien specifiquement (basees sur ses donnees reelles : poids, age, activite, appetit, sante, preferences)
- Retourne UNIQUEMENT le JSON, rien d'autre`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      const raw = typeof response === "string" ? response : JSON.stringify(response);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let cleaned = jsonMatch[0];
        const parsed = JSON.parse(cleaned);
        if (parsed.days && Array.isArray(parsed.days)) {
          const portions = dietPrefs?.portions_per_day || 2;
          parsed.days.forEach(d => {
            if (portions < 3) delete d.noon;
            if (portions < 2) delete d.evening;
            if (portions >= 3 && !d.noon && d.morning) {
              d.noon = { food: d.morning.food, quantity: d.morning.quantity };
            }
          });
          setPlan(parsed);
        } else {
          throw new Error("Invalid structure");
        }
      } else {
        throw new Error("No JSON found");
      }
      if (!isPremium) await consume();
    } catch (e) {
      console.error("Nutrition plan parse error:", e);
      setPlan(null);
      toast.error("Erreur lors de la génération. Réessaie !");
    }

    setLoading(false);
  };

  // ==========================================
  // RENDER: Active plan view
  // ==========================================
  const renderActivePlan = () => {
    if (!activeData || !progress) return null;

    return (
      <div className="space-y-4">
        {/* Progress header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Plan actif</p>
              <p className="text-white font-bold text-lg">
                {progress.isExpired ? "Plan terminé" : `Jour ${progress.dayNumber}/7`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[10px]">
                {format(progress.startDate, "d MMM", { locale: fr })} → {format(progress.endDate, "d MMM", { locale: fr })}
              </p>
              {activeData.calories_per_day && (
                <p className="text-white font-bold text-sm">{activeData.calories_per_day} kcal/jour</p>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.isExpired ? 100 : (progress.dayNumber / 7) * 100}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className={`h-2 rounded-full ${progress.isExpired ? "bg-amber-300" : "bg-white"}`}
            />
          </div>
          {activeData.quantity_summary && (
            <p className="text-white/70 text-xs mt-2">{activeData.quantity_summary}</p>
          )}
        </div>

        {/* Today's meals */}
        {todayMeal && !progress.isExpired && (
          <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-bold text-foreground">Aujourd'hui ({todayName})</p>
            </div>
            <div className="space-y-2.5">
              {todayMeal.morning && (
                <div className="flex items-start gap-3 bg-emerald-50/50 rounded-xl p-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg mt-0.5">Matin</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{todayMeal.morning.food}</p>
                    <p className="text-xs text-muted-foreground">{todayMeal.morning.quantity}</p>
                  </div>
                </div>
              )}
              {todayMeal.noon && (
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none">&#x2600;&#xFE0F;</span>
                  <div>
                    <p className="text-xs font-bold text-amber-600 mb-0.5">Midi</p>
                    <p className="text-sm font-medium text-foreground">{todayMeal.noon.food}</p>
                    <p className="text-xs text-muted-foreground">{todayMeal.noon.quantity}</p>
                  </div>
                </div>
              )}
              {todayMeal.evening && (
                <div className="flex items-start gap-3 bg-blue-50/50 rounded-xl p-3">
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg mt-0.5">Soir</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{todayMeal.evening.food}</p>
                    <p className="text-xs text-muted-foreground">{todayMeal.evening.quantity}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {progress.isExpired && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-800">Ce plan est terminé !</p>
            <p className="text-xs text-amber-600 mt-1">Régénère un nouveau plan pour continuer.</p>
          </div>
        )}

        {/* Full week (expandable) */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <button onClick={() => setShowWeek(!showWeek)} className="w-full flex items-center justify-between p-4">
            <p className="text-sm font-semibold text-foreground">Semaine complète</p>
            {showWeek ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showWeek && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-2 border-t border-border/40 pt-3">
                  {activeData.days?.map((d, i) => {
                    const isToday = d.day === todayName;
                    return (
                      <div key={i} className={`rounded-xl p-3 ${isToday ? "bg-emerald-50 border border-emerald-200" : "bg-muted/30"}`}>
                        <p className={`text-xs font-bold mb-1.5 ${isToday ? "text-emerald-700" : "text-foreground"}`}>
                          {d.day} {isToday && "(Aujourd'hui)"}
                        </p>
                        <div className="space-y-1">
                          {d.morning && (
                            <div className="flex gap-2 items-start">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">Matin</span>
                              <div>
                                <p className="text-xs text-foreground">{d.morning.food}</p>
                                <p className="text-[10px] text-muted-foreground">{d.morning.quantity}</p>
                              </div>
                            </div>
                          )}
                          {d.noon && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">Midi</span>
                              <div>
                                <p className="text-xs text-foreground">{d.noon.food}</p>
                                <p className="text-[10px] text-muted-foreground">{d.noon.quantity}</p>
                              </div>
                            </div>
                          )}
                          {d.evening && (
                            <div className="flex gap-2 items-start">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">Soir</span>
                              <div>
                                <p className="text-xs text-foreground">{d.evening.food}</p>
                                <p className="text-[10px] text-muted-foreground">{d.evening.quantity}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Supplements + Avoid */}
        {activeData.supplements?.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-4">
            <p className="text-xs font-bold text-foreground mb-2">Compléments</p>
            <div className="flex flex-wrap gap-1.5">
              {activeData.supplements.map((s, i) => (
                <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {activeData.avoid?.length > 0 && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
            <p className="text-xs font-bold text-red-700 mb-2">À éviter</p>
            <div className="flex flex-wrap gap-1.5">
              {activeData.avoid.map((a, i) => (
                <span key={i} className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{a}</span>
              ))}
            </div>
          </div>
        )}

        {activeData.tip && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
            <p className="text-xs text-amber-800">{activeData.tip}</p>
          </div>
        )}

        {/* Rationale — why this plan */}
        {activeData.rationale?.length > 0 && (
          <div className="bg-primary/5 rounded-2xl border border-primary/15 p-4">
            <p className="text-xs font-bold text-primary mb-2">Pourquoi ce plan ?</p>
            <div className="space-y-1.5">
              {activeData.rationale.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-primary mt-0.5 font-bold">{i + 1}.</span>
                  <p className="text-xs text-foreground/80">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NutriCoach bridge */}
        {onSwitchToCoach && !progress.isExpired && (
          <button
            onClick={() => onSwitchToCoach(`Je suis au jour ${progress.dayNumber}/7 de mon plan (${activeData.calories_per_day || "?"} kcal/jour). J'aimerais un conseil ou un ajustement.`)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl py-3 text-sm font-semibold text-emerald-700 active:bg-emerald-100 transition-colors"
          >
            {"\u{1F4AC}"} Ajuster via NutriCoach
          </button>
        )}

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-border p-4">
          {editingNote ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground mb-1">Notes sur ce plan</p>
              <textarea
                value={tempNote}
                onChange={e => setTempNote(e.target.value)}
                placeholder="Observations, ajustements, réactions de ton chien..."
                className="w-full text-xs rounded-xl border border-border p-2.5 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleSaveNote} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold">
                  <Check className="w-3 h-3" /> Sauvegarder
                </button>
                <button onClick={() => setEditingNote(false)} className="px-3 py-1.5 rounded-lg bg-muted text-xs">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setTempNote(activePlan.notes || ""); setEditingNote(true); }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors w-full"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{activePlan.notes || "Ajouter une note sur ce plan..."}</span>
            </button>
          )}
        </div>

        {/* Regenerate section */}
        <div className="border-t border-border pt-4 space-y-3">
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <RefreshCw className="w-4 h-4" />
            {showGenerator ? "Masquer" : "Regénérer un nouveau plan"}
          </button>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER: Generator
  // ==========================================
  const renderGenerator = () => {
    // If there's an active plan and generator not explicitly opened, don't show
    if (activeData && !showGenerator && !plan) return null;

    return (
      <div className="space-y-4">
        {!plan && !loading && (
          <div className={`bg-white rounded-2xl border border-border p-5 space-y-4 ${activeData ? "" : "text-center"}`}>
            {!activeData && (
              <>
                <div className="text-5xl mb-1">{"\u{1F37D}\uFE0F"}</div>
                <h3 className="font-bold text-foreground">Plan de repas personnalisé IA</h3>
                <p className="text-sm text-muted-foreground px-2">
                  Génère un plan hebdomadaire adapté au profil de {dog.name}, avec quantités précises et aliments à éviter.
                </p>
              </>
            )}

            {/* Data richness badges */}
            {(checkins.length > 0 || healthRecords.length > 0 || dietPrefs) && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {checkins.length > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Check-ins intégrés</span>}
                {healthRecords.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Santé intégrée</span>}
                {dietPrefs && <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">Préférences intégrées</span>}
                {dailyLogs.length > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Activité intégrée</span>}
              </div>
            )}

            {/* Notes for AI before generating */}
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5 text-left">Instructions spéciales (optionnel)</p>
              <textarea
                value={generationNotes}
                onChange={e => setGenerationNotes(e.target.value)}
                placeholder={`Ex : ${dog.name} mange trop vite, plus de légumes, éviter les sous-produits...`}
                className="w-full text-sm rounded-xl border border-border p-3 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {isMonthlyLimitReached ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-800">Limite atteinte</p>
                </div>
                <p className="text-xs text-amber-700">Tu as utilisé tes {MONTHLY_FREE_LIMIT} générations gratuites ce mois-ci. Passe en Premium pour des plans illimités.</p>
                <UpgradePrompt type="action" from="nutrition-plan-monthly" />
              </div>
            ) : !isPremium && !hasCredits ? (
              <UpgradePrompt type="action" from="nutrition-plan" />
            ) : (
              <>
                {!isPremium && (
                  <p className="text-xs text-muted-foreground text-center">
                    {MONTHLY_FREE_LIMIT - monthlyPlanCount} génération{MONTHLY_FREE_LIMIT - monthlyPlanCount !== 1 ? "s" : ""} restante{MONTHLY_FREE_LIMIT - monthlyPlanCount !== 1 ? "s" : ""} ce mois
                  </p>
                )}
                <Button onClick={generate} className="w-full bg-safe hover:bg-safe/90 text-white font-bold h-14 rounded-2xl shadow-lg shadow-safe/30">
                  {activePlan ? "Régénérer un nouveau plan" : "Générer mon plan de repas"}
                </Button>
              </>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 text-safe animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-foreground">NutriCoach analyse le profil de {dog.name}...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {checkins.length > 0 || healthRecords.length > 0
                  ? "Intégration des données santé, activité et préférences"
                  : "Création du plan personnalisé"}
              </p>
            </div>
          </div>
        )}

        {plan && (
          <div className="space-y-4 animate-fade-in">
            {/* Summary */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Nouveau plan pour {dog.name}</p>
              <div className="flex gap-3 mt-2">
                {plan.calories_per_day && (
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {plan.calories_per_day} kcal/jour
                  </span>
                )}
                {plan.quantity_summary && (
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {plan.quantity_summary}
                  </span>
                )}
              </div>
            </div>

            {/* Days */}
            <div className="space-y-2">
              {plan.days?.map((d, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border shadow-sm p-4">
                  <p className="text-xs font-bold text-foreground mb-2">{d.day}</p>
                  <div className="space-y-1.5">
                    {d.morning && (
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">Matin</span>
                        <div className="flex-1">
                          <p className="text-xs text-foreground">{d.morning.food}</p>
                          <p className="text-[10px] text-muted-foreground">{d.morning.quantity}</p>
                        </div>
                      </div>
                    )}
                    {d.noon && (
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">Midi</span>
                        <div className="flex-1">
                          <p className="text-xs text-foreground">{d.noon.food}</p>
                          <p className="text-[10px] text-muted-foreground">{d.noon.quantity}</p>
                        </div>
                      </div>
                    )}
                    {d.evening && (
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">Soir</span>
                        <div className="flex-1">
                          <p className="text-xs text-foreground">{d.evening.food}</p>
                          <p className="text-[10px] text-muted-foreground">{d.evening.quantity}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Supplements + Avoid */}
            {plan.supplements?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4">
                <p className="text-xs font-bold text-foreground mb-2">Compléments</p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.supplements.map((s, i) => (
                    <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {plan.avoid?.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
                <p className="text-xs font-bold text-red-700 mb-2">À éviter</p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.avoid.map((a, i) => (
                    <span key={i} className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {plan.tip && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <p className="text-xs text-amber-800">{plan.tip}</p>
              </div>
            )}

            {/* Rationale — why this plan (generated) */}
            {plan.rationale?.length > 0 && (
              <div className="bg-primary/5 rounded-2xl border border-primary/15 p-4">
                <p className="text-xs font-bold text-primary mb-2">Pourquoi ce plan pour {dog.name} ?</p>
                <div className="space-y-1.5">
                  {plan.rationale.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] text-primary mt-0.5 font-bold">{i + 1}.</span>
                      <p className="text-xs text-foreground/80">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save + Discard */}
            <div className="flex gap-2">
              <motion.div className="flex-1" whileTap={!saving && !saved ? { scale: 0.97 } : {}}>
                <Button
                  onClick={savePlan}
                  disabled={saving || saved}
                  className={`w-full h-14 rounded-2xl font-semibold gap-2 transition-all duration-300 ${
                    saved ? "bg-safe text-white" : "bg-primary text-white"
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saved ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Activé !
                    </motion.div>
                  ) : (
                    <><Home className="w-4 h-4" /> Activer ce programme</>
                  )}
                </Button>
              </motion.div>
              <Button
                onClick={() => { setPlan(null); }}
                variant="outline"
                className="h-11 px-4 rounded-2xl border-red-200 text-red-500 font-semibold gap-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDER: History (compact)
  // ==========================================
  const renderHistory = () => {
    if (pastPlans.length === 0) return null;
    return (
      <div className="border-t border-border pt-4 mt-2">
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full mb-3">
          <p className="text-sm font-semibold text-foreground">Historique ({pastPlans.length})</p>
          {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
              {pastPlans.map(p => {
                const pData = parsePlanJSON(p.plan_text);
                const pProgress = pData ? getPlanProgress(pData) : null;
                const isExpanded = expandedHistoryId === p.id;
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-border overflow-hidden">
                    <div className="p-3 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {p.generated_at ? format(new Date(p.generated_at), "d MMM yyyy", { locale: fr }) : "Date inconnue"}
                          {pData?.calories_per_day ? ` • ${pData.calories_per_day} kcal` : ""}
                          {pProgress?.isExpired ? " • Terminé" : ""}
                        </p>
                        {p.notes && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{p.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleActivateOld(p.id)} className="h-7 px-2 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          Activer
                        </button>
                        <button onClick={() => setExpandedHistoryId(isExpanded ? null : p.id)} className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button onClick={() => handleDeletePlan(p.id)} className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && pData && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border/40">
                          <div className="p-3 bg-muted/20 space-y-2 max-h-64 overflow-y-auto">
                            {pData.days?.map((d, i) => (
                              <div key={i} className="bg-white rounded-lg p-2">
                                <p className="text-[10px] font-bold text-foreground mb-1">{d.day}</p>
                                {d.morning && <p className="text-[10px] text-foreground/70">Matin : {d.morning.food} ({d.morning.quantity})</p>}
                                {d.noon && <p className="text-[10px] text-foreground/70">Midi : {d.noon.food} ({d.noon.quantity})</p>}
                                {d.evening && <p className="text-[10px] text-foreground/70">Soir : {d.evening.food} ({d.evening.quantity})</p>}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="space-y-4 pb-4">
      {/* Dog profile summary (compact) */}
      <div className="bg-white rounded-2xl border border-border p-3 shadow-sm">
        <div className="flex items-center gap-3">
          {dog.photo ? (
            <img src={dog.photo} alt={dog.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-safe/10 flex items-center justify-center text-xl flex-shrink-0">{"\u{1F415}"}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm">{dog.name}</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {dog.breed && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{dog.breed}</span>}
              {dog.weight && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{dog.weight} kg</span>}
              {dog.birth_date && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{getAge(dog.birth_date)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Active plan OR Generator */}
      {renderActivePlan()}
      {renderGenerator()}

      {/* History */}
      {renderHistory()}
    </div>
  );
}
