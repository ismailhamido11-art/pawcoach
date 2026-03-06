import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShoppingCart, BookmarkPlus, Check, Home } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

function getAge(birthDate) {
  if (!birthDate) return null;
  const months = Math.floor((Date.now() - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30));
  return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
}

const AFFILIATE_BRANDS = [
  { name: "Royal Canin", url: "https://amzn.to/royalcanin", emoji: "👑" },
  { name: "Hill's Science Plan", url: "https://amzn.to/hills", emoji: "🔬" },
  { name: "Orijen", url: "https://www.zooplus.fr", emoji: "🦌" },
  { name: "Purina Pro Plan", url: "https://amzn.to/proplan", emoji: "⭐" },
  { name: "Acana", url: "https://www.zooplus.fr", emoji: "🌿" },
];

export default function NutritionMealPlan({ dog, recentScans, isPremium: _isPremiumProp, user, dietPrefs }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!dog) {
    return <p className="text-muted-foreground text-sm text-center py-10">Aucun chien trouvé.</p>;
  }

  const savePlan = async () => {
    if (!plan || !dog || !user) return;
    setSaving(true);
    try {
      // Deactivate all existing plans before creating the new active one
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
      toast.success("Programme active ! Retrouve-le sur ton accueil.");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    if (!isPremium && !hasCredits) return;
    setLoading(true);
    setPlan(null);

    const activityMap = { faible: "Faible (< 30 min/jour)", modere: "Modérée (30-60 min/jour)", eleve: "Élevée (1-2h/jour)", tres_eleve: "Très élevée (> 2h/jour)" };
    const dietMap = { kibble: "Croquettes sèches", barf: "BARF (viande crue)", mixed: "Mixte (croquettes + ménager)", homemade: "Ration ménagère" };

    const ageMonths = dog.birth_date ? Math.floor((Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30)) : null;
    const lifeStage = !ageMonths ? "adulte" : ageMonths < 12 ? "chiot" : ageMonths > 84 ? "senior" : "adulte";

    const scansContext = recentScans.length > 0
      ? `\nScans alimentaires récents: ${recentScans.map(s => `${s.food_name} (${s.verdict})`).join(", ")}`
      : "";

    let prefsContext = "";
    if (dietPrefs) {
      let brands = "non précisées";
      try { brands = dietPrefs.preferred_brands ? JSON.parse(dietPrefs.preferred_brands).join(", ") : "non précisées"; } catch { /* invalid JSON */ }
      let mealMorning = "07:30", mealEvening = "18:30";
      try { const mt = dietPrefs.meal_times ? JSON.parse(dietPrefs.meal_times) : {}; mealMorning = mt.morning || "07:30"; mealEvening = mt.evening || "18:30"; } catch { /* invalid JSON */ }
      prefsContext = `\n## PRÉFÉRENCES ALIMENTAIRES DU PROPRIÉTAIRE\n- Marques préférées: ${brands}\n- Aliments refusés par le chien: ${dietPrefs.disliked_foods || "aucun"}\n- Horaires repas: matin ${mealMorning}, soir ${mealEvening}\n- Budget mensuel: ${({ low: "économique (<30€)", medium: "standard (30-70€)", high: "premium (>70€)" })[dietPrefs.budget_monthly] || "standard"}\n- Préférence bio: ${dietPrefs.organic_preference ? "Oui" : "Non"}\n- Notes: ${dietPrefs.notes || "aucune"}`;
    }

    const prompt = `Tu es un nutritionniste veterinaire expert. Genere un plan repas de 7 jours pour ce chien.

PROFIL: ${dog.name}, ${dog.breed || "race inconnue"}, ${lifeStage} (${getAge(dog.birth_date) || "age inconnu"}), ${dog.weight ? dog.weight + " kg" : "poids inconnu"}, activite ${activityMap[dog.activity_level] || "moderee"}, ${dog.neutered ? "sterilise" : "non sterilise"}, alimentation ${dietMap[dog.diet_type] || "croquettes"} ${dog.diet_brand ? `(${dog.diet_brand})` : ""}, allergies: ${dog.allergies || "aucune"}, sante: ${dog.health_issues || "aucun probleme"}${scansContext}${prefsContext}

REPONDS UNIQUEMENT avec un objet JSON valide, sans texte avant ni apres, sans bloc markdown. Structure exacte :
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
  "supplements": ["Carotte crue (2x/sem)", "Pomme sans pepins (1x/sem)"],
  "avoid": ["Raisins", "Chocolat", "Oignons"],
  "tip": "Un conseil personnalise pour ce chien."
}

REGLES :
- Le tableau "days" doit contenir exactement 7 jours : Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche
- Varie les proteines et complements au fil de la semaine
- Adapte les quantites au poids, age, activite et sterilisation
- Sois concis dans les descriptions (pas de phrases longues)
- Retourne UNIQUEMENT le JSON, rien d'autre`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      const raw = typeof response === "string" ? response : JSON.stringify(response);
      // Extract JSON from potential markdown code blocks
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
      toast.error("Erreur lors de la generation. Reessaie !");
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
            <div className="w-12 h-12 rounded-xl bg-safe/10 flex items-center justify-center text-2xl flex-shrink-0">🐕</div>
          )}
          <div className="flex-1">
            <p className="font-bold text-foreground">{dog.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {dog.breed && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{dog.breed}</span>}
              {dog.weight && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{dog.weight} kg</span>}
              {dog.birth_date && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{getAge(dog.birth_date)}</span>}
              {dog.activity_level && <span className="text-[10px] bg-safe/10 text-safe px-2 py-0.5 rounded-full">{({ faible: "🐢 Faible", modere: "🚶 Modéré", eleve: "🏃 Élevé", tres_eleve: "⚡ Très élevé" })[dog.activity_level]}</span>}
              {dog.neutered && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Stérilisé(e)</span>}
              {recentScans.length > 0 && <span className="text-[10px] bg-safe/10 text-safe px-2 py-0.5 rounded-full">🔍 {recentScans.length} scans</span>}
            </div>
          </div>
        </div>
        {(!dog.weight || !dog.birth_date || !dog.activity_level) && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
            <span className="text-amber-500 text-sm">⚠️</span>
            <p className="text-xs text-amber-700">Complète le profil de {dog.name} pour un plan plus précis (poids, âge, activité).</p>
          </div>
        )}
      </div>

      {/* Generate button */}
      {!plan && !loading && (
        <div className="text-center space-y-3 py-6">
          <div className="text-5xl mb-2">🍽️</div>
          <h3 className="font-bold text-foreground">Plan de repas personnalise IA</h3>
          <p className="text-sm text-muted-foreground px-4">
            Genere un plan hebdomadaire complet adapte au profil exact de {dog.name}, avec quantites, marques recommandees et aliments a eviter.
          </p>
          {!isPremium && !hasCredits ? (
            <UpgradePrompt type="action" from="nutrition-plan" />
          ) : (
            <>
              {!isPremium && credits != null && <CreditBadge remaining={credits} className="mb-2" />}
              <Button onClick={generate} className="bg-safe hover:bg-safe/90 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-safe/30">
                ✨ Generer mon plan de repas
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
            <p className="text-xs text-muted-foreground mt-1">Création du plan personnalisé</p>
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
              <p className="text-xs font-bold text-foreground mb-2">Complements utiles</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.supplements.map((s, i) => (
                  <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {plan.avoid?.length > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
              <p className="text-xs font-bold text-red-700 mb-2">A eviter</p>
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
              <ShoppingCart className="w-3.5 h-3.5" /> Marques recommandees
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
                    <Check className="w-4 h-4" /> Active !
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