import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShoppingCart, BookmarkPlus, Check, Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

const MONTHLY_FREE_LIMIT = 2;

function getAge(birthDate) {
  if (!birthDate) return null;
  const months = Math.floor((Date.now() - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30));
  return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
}

const AFFILIATE_BRANDS = [
  { name: "Royal Canin", url: "https://amzn.to/royalcanin", emoji: "\uD83D\uDC51" },
  { name: "Hill's Science Plan", url: "https://amzn.to/hills", emoji: "\uD83D\uDD2C" },
  { name: "Orijen", url: "https://www.zooplus.fr", emoji: "\uD83E\uDD8C" },
  { name: "Purina Pro Plan", url: "https://amzn.to/proplan", emoji: "\u2B50" },
  { name: "Acana", url: "https://www.zooplus.fr", emoji: "\uD83C\uDF3F" },
];

export default function NutritionMealPlan({ dog, recentScans, isPremium: _isPremiumProp, user, dietPrefs, checkins = [], healthRecords = [], dailyLogs = [], activePlan, monthlyPlanCount = 0, onPlanSaved }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!dog) {
    return <p className="text-muted-foreground text-sm text-center py-10">Aucun chien trouv\u00e9.</p>;
  }

  const isMonthlyLimitReached = !isPremium && monthlyPlanCount >= MONTHLY_FREE_LIMIT;

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
        notes: "",
      });
      setSaved(true);
      onPlanSaved?.();
      toast.success("Programme activ\u00e9 ! Retrouve-le sur ton accueil.");
      setTimeout(() => setSaved(false), 3000);
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

    const activityMap = { faible: "Faible (< 30 min/jour)", modere: "Mod\u00e9r\u00e9e (30-60 min/jour)", eleve: "\u00c9lev\u00e9e (1-2h/jour)", tres_eleve: "Tr\u00e8s \u00e9lev\u00e9e (> 2h/jour)" };
    const dietMap = { kibble: "Croquettes s\u00e8ches", barf: "BARF (viande crue)", mixed: "Mixte (croquettes + m\u00e9nager)", homemade: "Ration m\u00e9nag\u00e8re" };

    const ageMonths = dog.birth_date ? Math.floor((Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30)) : null;
    const lifeStage = !ageMonths ? "adulte" : ageMonths < 12 ? "chiot" : ageMonths > 84 ? "senior" : "adulte";

    // --- Scans context ---
    const scansContext = recentScans.length > 0
      ? `\nScans alimentaires r\u00e9cents : ${recentScans.map(s => `${s.food_name} (${s.verdict})`).join(", ")}`
      : "";

    // --- Diet preferences context ---
    let prefsContext = "";
    if (dietPrefs) {
      let brands = "non pr\u00e9cis\u00e9es";
      try { brands = dietPrefs.preferred_brands ? JSON.parse(dietPrefs.preferred_brands).join(", ") : "non pr\u00e9cis\u00e9es"; } catch { /* invalid JSON */ }
      let mealTimesStr = "";
      try {
        const mt = dietPrefs.meal_times ? JSON.parse(dietPrefs.meal_times) : {};
        const parts = [];
        if (mt.morning) parts.push(`matin ${mt.morning}`);
        if (mt.noon) parts.push(`midi ${mt.noon}`);
        if (mt.evening) parts.push(`soir ${mt.evening}`);
        mealTimesStr = parts.length > 0 ? parts.join(", ") : "non pr\u00e9cis\u00e9s";
      } catch { mealTimesStr = "non pr\u00e9cis\u00e9s"; }
      const portions = dietPrefs.portions_per_day || 2;
      prefsContext = `\n## PR\u00c9F\u00c9RENCES ALIMENTAIRES DU PROPRI\u00c9TAIRE\n- Marques pr\u00e9f\u00e9r\u00e9es : ${brands}\n- Aliments refus\u00e9s par le chien : ${dietPrefs.disliked_foods || "aucun"}\n- Repas par jour : ${portions}\n- Horaires repas : ${mealTimesStr}\n- Budget mensuel : ${({ low: "\u00e9conomique (<30\u20ac)", medium: "standard (30-70\u20ac)", high: "premium (>70\u20ac)" })[dietPrefs.budget_monthly] || "standard"}\n- Pr\u00e9f\u00e9rence bio : ${dietPrefs.organic_preference ? "Oui" : "Non"}\n- Notes : ${dietPrefs.notes || "aucune"}`;
    }

    // --- Check-ins context (well-being trends, last 7 days) ---
    let checkinContext = "";
    const recentCheckins = (checkins || [])
      .filter(c => c.date && (Date.now() - new Date(c.date).getTime()) < 7 * 86400000)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (recentCheckins.length > 0) {
      const moodMap = { great: "excellent", good: "bon", neutral: "neutre", bad: "mauvais", terrible: "tr\u00e8s mauvais" };
      const appetiteMap = { normal: "normal", increased: "augment\u00e9", decreased: "diminu\u00e9", none: "aucun" };
      const energyMap = { high: "haute", medium: "moyenne", low: "basse" };
      const moods = recentCheckins.map(c => moodMap[c.mood] || c.mood).filter(Boolean);
      const appetites = recentCheckins.map(c => appetiteMap[c.appetite] || c.appetite).filter(Boolean);
      const energies = recentCheckins.map(c => energyMap[c.energy] || c.energy).filter(Boolean);
      checkinContext = `\n## BIEN-\u00caTRE R\u00c9CENT (${recentCheckins.length} check-ins, 7 derniers jours)\n- App\u00e9tit : ${appetites.join(", ")}\n- Humeur : ${moods.join(", ")}\n- \u00c9nergie : ${energies.join(", ")}`;
      const hasLowAppetite = appetites.some(a => a === "diminu\u00e9" || a === "aucun");
      if (hasLowAppetite) checkinContext += "\n- \u26a0\ufe0f APP\u00c9TIT EN BAISSE : adapter les repas (plus app\u00e9tissants, portions r\u00e9duites, fractionner)";
    }

    // --- Health context (weight trend + recent visits) ---
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
      healthContext = "\n## CONTEXTE SANT\u00c9";
      if (weightRecords.length >= 2) {
        const latest = parseFloat(weightRecords[0].value);
        const previous = parseFloat(weightRecords[1].value);
        const diff = (latest - previous).toFixed(1);
        healthContext += `\n- Tendance poids : ${latest} kg (${Number(diff) > 0 ? "+" : ""}${diff} kg r\u00e9cemment)${Number(diff) > 1 ? " \u2192 r\u00e9duire les calories" : Number(diff) < -1 ? " \u2192 augmenter les calories" : ""}`;
      }
      if (recentVetVisits.length > 0) {
        healthContext += `\n- Derni\u00e8re visite v\u00e9to : ${recentVetVisits[0].title || "visite"}${recentVetVisits[0].details ? ` — ${recentVetVisits[0].details.substring(0, 80)}` : ""}`;
      }
    }

    // --- Activity context (actual walk data, not just profile field) ---
    let activityContext = "";
    const recentLogs = (dailyLogs || [])
      .filter(l => l.date && (Date.now() - new Date(l.date).getTime()) < 7 * 86400000);
    if (recentLogs.length > 0) {
      const totalMin = recentLogs.reduce((s, l) => s + (l.walk_minutes || 0), 0);
      const avgMin = Math.round(totalMin / recentLogs.length);
      activityContext = `\n## ACTIVIT\u00c9 R\u00c9ELLE (7 derniers jours)\n- Moyenne : ${avgMin} min de balade/jour (${recentLogs.length} jours enregistr\u00e9s)\n- Adapter les calories selon l'activit\u00e9 r\u00e9elle, pas seulement le profil`;
    }

    // --- Previous plan context (for regeneration / variation) ---
    let previousPlanContext = "";
    if (activePlan) {
      try {
        const prevData = JSON.parse(activePlan.plan_text);
        if (prevData.days && Array.isArray(prevData.days)) {
          const prevFoods = prevData.days.map(d => `${d.morning?.food || ""}, ${d.evening?.food || ""}`).join("; ");
          previousPlanContext = `\n## PLAN PR\u00c9C\u00c9DENT (varie les repas !)\nRepas du plan pr\u00e9c\u00e9dent : ${prevFoods.substring(0, 300)}\nIMPORTANT : propose des repas DIFF\u00c9RENTS pour varier l'alimentation.`;
        }
      } catch { /* not JSON */ }
    }

    // --- Season context ---
    const month = new Date().getMonth();
    const season = month >= 2 && month <= 4 ? "printemps" : month >= 5 && month <= 7 ? "\u00e9t\u00e9 (adapter hydratation)" : month >= 8 && month <= 10 ? "automne" : "hiver (besoins \u00e9nerg\u00e9tiques plus \u00e9lev\u00e9s)";

    const prompt = `Tu es un nutritionniste v\u00e9t\u00e9rinaire expert. G\u00e9n\u00e8re un plan repas de 7 jours pour ce chien.

PROFIL : ${dog.name}, ${dog.breed || "race inconnue"}, ${lifeStage} (${getAge(dog.birth_date) || "\u00e2ge inconnu"}), ${dog.weight ? dog.weight + " kg" : "poids inconnu"}, ${dog.sex === "male" ? "m\u00e2le" : dog.sex === "female" ? "femelle" : "sexe inconnu"}, activit\u00e9 ${activityMap[dog.activity_level] || "mod\u00e9r\u00e9e"}, ${dog.neutered ? "st\u00e9rilis\u00e9(e)" : "non st\u00e9rilis\u00e9(e)"}, alimentation ${dietMap[dog.diet_type] || "croquettes"} ${dog.diet_brand ? `(${dog.diet_brand})` : ""}, allergies : ${dog.allergies || "aucune"}, sant\u00e9 : ${dog.health_issues || "aucun probl\u00e8me"}, environnement : ${dog.environment || "non pr\u00e9cis\u00e9"}${dog.status && dog.status !== "healthy" ? `, STATUT : ${dog.status === "recovering" ? "en convalescence (repas doux, faciles \u00e0 dig\u00e9rer)" : dog.status}` : ""}
Saison : ${season}${scansContext}${prefsContext}${checkinContext}${healthContext}${activityContext}${previousPlanContext}

R\u00c9PONDS UNIQUEMENT avec un objet JSON valide, sans texte avant ni apr\u00e8s, sans bloc markdown. Structure exacte :
{
  "calories_per_day": 850,
  "quantity_summary": "240g de croquettes par jour",
  "days": [
    {
      "day": "Lundi",
      "morning": { "food": "Croquettes + huile de saumon", "quantity": "145g + 1 c.c." },
      "evening": { "food": "Croquettes + courgette cuite", "quantity": "95g + 30g" }
    }
  ],
  "supplements": ["Carotte crue (2x/sem)", "Pomme sans p\u00e9pins (1x/sem)"],
  "avoid": ["Raisins", "Chocolat", "Oignons"],
  "tip": "Un conseil personnalis\u00e9 pour ce chien."
}

R\u00c8GLES :
- Le tableau "days" doit contenir exactement 7 jours : Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche
- Varie les prot\u00e9ines et compl\u00e9ments au fil de la semaine
- Adapte les quantit\u00e9s au poids, \u00e2ge, activit\u00e9, st\u00e9rilisation ET aux donn\u00e9es r\u00e9elles ci-dessus
- Si l'app\u00e9tit est en baisse, propose des repas plus app\u00e9tissants et fractionn\u00e9s
- Si le poids augmente, r\u00e9duis les calories ; s'il diminue, augmente-les
- Sois concis dans les descriptions (pas de phrases longues)
- Retourne UNIQUEMENT le JSON, rien d'autre`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      const raw = typeof response === "string" ? response : JSON.stringify(response);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.days && Array.isArray(parsed.days)) {
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
      toast.error("Erreur lors de la g\u00e9n\u00e9ration. R\u00e9essaie !");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Dog profile summary */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {dog.photo ? (
            <img src={dog.photo} alt={dog.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-safe/10 flex items-center justify-center text-2xl flex-shrink-0">{"\uD83D\uDC15"}</div>
          )}
          <div className="flex-1">
            <p className="font-bold text-foreground">{dog.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {dog.breed && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{dog.breed}</span>}
              {dog.weight && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{dog.weight} kg</span>}
              {dog.birth_date && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{getAge(dog.birth_date)}</span>}
              {dog.activity_level && <span className="text-[10px] bg-safe/10 text-safe px-2 py-0.5 rounded-full">{({ faible: "\uD83D\uDC22 Faible", modere: "\uD83D\uDEB6 Mod\u00e9r\u00e9", eleve: "\uD83C\uDFC3 \u00c9lev\u00e9", tres_eleve: "\u26A1 Tr\u00e8s \u00e9lev\u00e9" })[dog.activity_level]}</span>}
              {dog.neutered && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">St\u00e9rilis\u00e9(e)</span>}
              {recentScans.length > 0 && <span className="text-[10px] bg-safe/10 text-safe px-2 py-0.5 rounded-full">{"\uD83D\uDD0D"} {recentScans.length} scans</span>}
              {checkins.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{checkins.length} check-ins</span>}
            </div>
          </div>
        </div>
        {(!dog.weight || !dog.birth_date || !dog.activity_level) && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
            <span className="text-amber-500 text-sm">{"\u26A0\uFE0F"}</span>
            <p className="text-xs text-amber-700">Compl\u00e8te le profil de {dog.name} pour un plan plus pr\u00e9cis (poids, \u00e2ge, activit\u00e9).</p>
          </div>
        )}
      </div>

      {/* Generate button */}
      {!plan && !loading && (
        <div className="text-center space-y-3 py-6">
          <div className="text-5xl mb-2">{"\uD83C\uDF7D\uFE0F"}</div>
          <h3 className="font-bold text-foreground">Plan de repas personnalis\u00e9 IA</h3>
          <p className="text-sm text-muted-foreground px-4">
            G\u00e9n\u00e8re un plan hebdomadaire complet adapt\u00e9 au profil exact de {dog.name}, avec quantit\u00e9s, marques recommand\u00e9es et aliments \u00e0 \u00e9viter.
          </p>

          {/* Data richness indicator */}
          {(checkins.length > 0 || healthRecords.length > 0 || dietPrefs) && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {checkins.length > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Check-ins int\u00e9gr\u00e9s</span>}
              {healthRecords.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Sant\u00e9 int\u00e9gr\u00e9e</span>}
              {dietPrefs && <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">Pr\u00e9f\u00e9rences int\u00e9gr\u00e9es</span>}
              {dailyLogs.length > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Activit\u00e9 int\u00e9gr\u00e9e</span>}
            </div>
          )}

          {isMonthlyLimitReached ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mx-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-800">Limite atteinte</p>
              </div>
              <p className="text-xs text-amber-700">Tu as utilis\u00e9 tes {MONTHLY_FREE_LIMIT} g\u00e9n\u00e9rations gratuites ce mois-ci. Passe en Premium pour des plans illimit\u00e9s.</p>
              <UpgradePrompt type="action" from="nutrition-plan-monthly" />
            </div>
          ) : !isPremium && !hasCredits ? (
            <UpgradePrompt type="action" from="nutrition-plan" />
          ) : (
            <>
              {!isPremium && (
                <p className="text-xs text-muted-foreground">
                  {MONTHLY_FREE_LIMIT - monthlyPlanCount} g\u00e9n\u00e9ration{MONTHLY_FREE_LIMIT - monthlyPlanCount !== 1 ? "s" : ""} restante{MONTHLY_FREE_LIMIT - monthlyPlanCount !== 1 ? "s" : ""} ce mois
                </p>
              )}
              <Button onClick={generate} className="bg-safe hover:bg-safe/90 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-safe/30">
                {activePlan ? "\u2728 R\u00e9g\u00e9n\u00e9rer un nouveau plan" : "\u2728 G\u00e9n\u00e9rer mon plan de repas"}
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
                ? "Int\u00e9gration des donn\u00e9es sant\u00e9, activit\u00e9 et pr\u00e9f\u00e9rences"
                : "Cr\u00e9ation du plan personnalis\u00e9"}
            </p>
          </div>
        </div>
      )}

      {plan && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Plan 7 jours pour {dog.name}</p>
            <div className="flex gap-3 mt-2">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                {plan.calories_per_day} kcal/jour
              </span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                {plan.quantity_summary}
              </span>
            </div>
          </div>

          {/* Days */}
          <div className="space-y-2">
            {plan.days?.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border shadow-sm p-4">
                <p className="text-xs font-bold text-foreground mb-2">{d.day}</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">Matin</span>
                    <div className="flex-1">
                      <p className="text-xs text-foreground">{d.morning?.food}</p>
                      <p className="text-[10px] text-muted-foreground">{d.morning?.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">Soir</span>
                    <div className="flex-1">
                      <p className="text-xs text-foreground">{d.evening?.food}</p>
                      <p className="text-[10px] text-muted-foreground">{d.evening?.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Supplements + Avoid */}
          {plan.supplements?.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-4">
              <p className="text-xs font-bold text-foreground mb-2">Compl\u00e9ments utiles</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.supplements.map((s, i) => (
                  <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {plan.avoid?.length > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
              <p className="text-xs font-bold text-red-700 mb-2">\u00c0 \u00e9viter</p>
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

          {/* Affiliate brands */}
          <div className="bg-accent/10 rounded-2xl border border-accent/20 p-4">
            <p className="text-xs font-bold text-accent flex items-center gap-1.5 mb-3">
              <ShoppingCart className="w-3.5 h-3.5" /> Marques recommand\u00e9es
            </p>
            <div className="grid grid-cols-1 gap-2">
              {AFFILIATE_BRANDS.map((brand, i) => (
                <motion.a
                  key={i}
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-accent/20 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{brand.emoji}</span>
                    <span className="text-sm font-semibold text-foreground">{brand.name}</span>
                  </div>
                  <span className="text-xs text-accent font-medium">Voir</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Save + Regenerate */}
          <div className="flex gap-2">
            <motion.div className="flex-1" whileTap={!saving && !saved ? { scale: 0.97 } : {}}>
              <Button
                onClick={savePlan}
                disabled={saving || saved}
                className={`w-full h-11 rounded-2xl font-semibold gap-2 transition-all duration-300 ${
                  saved ? "bg-safe text-white" : "bg-primary text-white"
                }`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Activ\u00e9 !
                  </motion.div>
                ) : (
                  <><Home className="w-4 h-4" /> Activer ce programme</>
                )}
              </Button>
            </motion.div>
            <Button
              onClick={() => { setPlan(null); setSaved(false); }}
              variant="outline"
              className="h-11 px-4 rounded-2xl border-safe/20 text-safe font-semibold gap-2"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}