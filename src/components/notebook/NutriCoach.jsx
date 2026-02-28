import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Salad, Sparkles, Flame, Plus, Minus, ChevronDown, ChevronUp, RefreshCw, Apple, Fish, Beef, Wheat, Loader2, Check, Info } from "lucide-react";

const MEAL_ICONS = { "Matin": "🌅", "Midi": "☀️", "Soir": "🌙", "Collation": "🍖" };

function CalorieTracker({ recommended, dog }) {
  const [consumed, setConsumed] = useState(0);
  const [entries, setEntries] = useState([]);
  const [input, setInput] = useState("");
  const [inputCal, setInputCal] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const percent = recommended ? Math.min(100, Math.round((consumed / recommended) * 100)) : 0;
  const color = percent > 110 ? "#ef4444" : percent >= 90 ? "#10b981" : "#f59e0b";
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * percent / 100;

  const addEntry = () => {
    if (!input.trim() || !inputCal) return;
    const cal = parseInt(inputCal);
    setEntries(prev => [...prev, { label: input.trim(), cal }]);
    setConsumed(prev => prev + cal);
    setInput("");
    setInputCal("");
    setShowAdd(false);
  };

  const removeEntry = (i) => {
    setConsumed(prev => prev - entries[i].cal);
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-sm text-foreground">Suivi calorique du jour</p>
          <p className="text-[11px] text-muted-foreground">pour {dog?.name}</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Plus className="w-3 h-3" /> Ajouter
        </button>
      </div>

      {/* Circle gauge */}
      <div className="flex items-center gap-5 mb-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold text-lg text-foreground leading-none">{consumed}</span>
            <span className="text-[9px] text-muted-foreground">kcal</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Consommé</span>
            <span className="font-semibold text-foreground">{consumed} kcal</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Recommandé</span>
            <span className="font-semibold text-foreground">{recommended || "—"} kcal</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Restant</span>
            <span className={`font-semibold ${recommended - consumed < 0 ? "text-red-500" : "text-emerald-600"}`}>
              {recommended ? `${recommended - consumed} kcal` : "—"}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
          </div>
        </div>
      </div>

      {/* Add entry */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
            <div className="flex gap-2 pt-1">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Aliment (ex: Croquettes Royal Canin)" className="flex-1 text-xs border border-border rounded-xl px-3 py-2 bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={inputCal} onChange={e => setInputCal(e.target.value)} type="number" placeholder="kcal" className="w-16 text-xs border border-border rounded-xl px-2 py-2 bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={addEntry} className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries */}
      {entries.length > 0 && (
        <div className="space-y-1.5">
          {entries.map((e, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
              <span className="text-xs text-foreground">{e.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">{e.cal} kcal</span>
                <button onClick={() => removeEntry(i)} className="text-muted-foreground hover:text-red-500">
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NutriCoach({ dog, checkins = [] }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [recommendedCal, setRecommendedCal] = useState(null);
  const [showCalTracker, setShowCalTracker] = useState(false);

  // Calculate recommended calories based on dog data
  useEffect(() => {
    if (!dog) return;
    const weight = dog.weight || 15;
    // RER = 70 * weight^0.75, then multiply by activity factor
    const activityFactor = {
      faible: 1.2, modere: 1.5, eleve: 1.8, tres_eleve: 2.2
    }[dog.activity_level] || 1.5;
    const neuterFactor = dog.neutered ? 0.9 : 1;
    const rer = 70 * Math.pow(weight, 0.75);
    const cal = Math.round(rer * activityFactor * neuterFactor);
    setRecommendedCal(cal);
  }, [dog]);

  const generatePlan = async () => {
    if (!dog) return;
    setLoading(true);
    setPlan(null);

    const avgMood = checkins.length ? (checkins.slice(-7).reduce((s, c) => s + (c.mood || 0), 0) / Math.min(7, checkins.length)).toFixed(1) : null;
    const avgEnergy = checkins.length ? (checkins.slice(-7).reduce((s, c) => s + (c.energy || 0), 0) / Math.min(7, checkins.length)).toFixed(1) : null;

    const prompt = `Tu es un nutritionniste canin expert. Génère un plan repas hebdomadaire personnalisé et détaillé pour ce chien.

PROFIL DU CHIEN :
- Nom : ${dog.name}
- Race : ${dog.breed}
- Âge : ${dog.birth_date ? Math.floor((Date.now() - new Date(dog.birth_date)) / (365.25 * 864e5)) : "inconnu"} ans
- Poids : ${dog.weight || "inconnu"} kg
- Sexe : ${dog.sex === "male" ? "Mâle" : "Femelle"}${dog.neutered ? " (stérilisé)" : ""}
- Niveau d'activité : ${dog.activity_level || "modere"}
- Environnement : ${dog.environment || "maison"}
- Allergies connues : ${dog.allergies || "aucune"}
- Problèmes de santé : ${dog.health_issues || "aucun"}
- Apport calorique recommandé : ${recommendedCal} kcal/jour
${avgMood ? `- Humeur moyenne récente : ${avgMood}/4` : ""}
${avgEnergy ? `- Énergie moyenne récente : ${avgEnergy}/3` : ""}

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{
  "summary": "Résumé nutritionnel en 2 phrases",
  "daily_calories": ${recommendedCal || 800},
  "protein_percent": 30,
  "fat_percent": 18,
  "carb_percent": 52,
  "meals": [
    {
      "name": "Matin",
      "time": "7h00",
      "calories": 300,
      "foods": [
        {"name": "Croquettes premium adulte", "quantity": "150g", "calories": 250, "note": "Riches en protéines animales"},
        {"name": "Eau fraîche", "quantity": "à volonté", "calories": 0, "note": ""}
      ],
      "tip": "Conseil pratique pour ce repas"
    }
  ],
  "weekly_variety": ["Lundi: ...", "Mardi: ..."],
  "foods_to_avoid": ["aliment1", "aliment2"],
  "supplement_tips": "Conseils sur les compléments si nécessaire",
  "hydration_tip": "Conseil d'hydratation quotidien"
}`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            daily_calories: { type: "number" },
            protein_percent: { type: "number" },
            fat_percent: { type: "number" },
            carb_percent: { type: "number" },
            meals: { type: "array" },
            weekly_variety: { type: "array", items: { type: "string" } },
            foods_to_avoid: { type: "array", items: { type: "string" } },
            supplement_tips: { type: "string" },
            hydration_tip: { type: "string" },
          }
        }
      });
      setPlan(res);
      setExpanded(0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!dog) return null;

  return (
    <div className="space-y-3">
      {/* Header card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Salad className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">NutriCoach IA</p>
              <p className="text-[11px] text-white/70">Plan personnalisé pour {dog.name}</p>
            </div>
          </div>
          <button onClick={generatePlan} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all disabled:opacity-60">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Analyse..." : plan ? "Regénérer" : "Générer"}
          </button>
        </div>

        {/* Macros */}
        <div className="flex gap-2 mt-3">
          {[
            { label: "Protéines", val: plan?.protein_percent || "--", icon: Beef, color: "bg-red-400/30" },
            { label: "Lipides", val: plan?.fat_percent || "--", icon: Fish, color: "bg-amber-400/30" },
            { label: "Glucides", val: plan?.carb_percent || "--", icon: Wheat, color: "bg-yellow-400/30" },
            { label: "kcal/jour", val: recommendedCal || "--", icon: Flame, color: "bg-orange-400/30" },
          ].map((m, i) => (
            <div key={i} className={`flex-1 ${m.color} backdrop-blur-sm rounded-xl px-2 py-2 text-center`}>
              <p className="text-white font-bold text-sm leading-none">{m.val}{i < 3 && plan ? "%" : ""}</p>
              <p className="text-white/70 text-[9px] mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-border/40 p-6 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-muted-foreground text-center">L'IA analyse le profil de {dog.name}…</p>
        </div>
      )}

      {/* Plan summary */}
      {plan && !loading && (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-800">{plan.summary}</p>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-2">
            {plan.meals?.map((meal, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{MEAL_ICONS[meal.name] || "🍽️"}</span>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground">{meal.name}</p>
                      <p className="text-[11px] text-muted-foreground">{meal.time} · {meal.calories} kcal</p>
                    </div>
                  </div>
                  {expanded === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-3">
                        {meal.foods?.map((food, j) => (
                          <div key={j} className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-foreground">{food.name}</p>
                              {food.note && <p className="text-[10px] text-muted-foreground">{food.note}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-semibold text-primary">{food.quantity}</p>
                              {food.calories > 0 && <p className="text-[10px] text-muted-foreground">{food.calories} kcal</p>}
                            </div>
                          </div>
                        ))}
                        {meal.tip && (
                          <div className="mt-2 bg-emerald-50 rounded-xl p-2.5">
                            <p className="text-[11px] text-emerald-700">💡 {meal.tip}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Foods to avoid */}
          {plan.foods_to_avoid?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-700 mb-2">🚫 Aliments à éviter pour {dog.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.foods_to_avoid.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-medium">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Hydration & supplements */}
          {(plan.hydration_tip || plan.supplement_tips) && (
            <div className="space-y-2">
              {plan.hydration_tip && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2">
                  <span className="text-lg">💧</span>
                  <p className="text-xs text-blue-800">{plan.hydration_tip}</p>
                </div>
              )}
              {plan.supplement_tips && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
                  <span className="text-lg">💊</span>
                  <p className="text-xs text-amber-800">{plan.supplement_tips}</p>
                </div>
              )}
            </div>
          )}

          {/* Toggle calorie tracker */}
          <button onClick={() => setShowCalTracker(!showCalTracker)} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-border/40 shadow-sm">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-foreground">Suivi calorique du jour</span>
            </div>
            {showCalTracker ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </>
      )}

      {/* Calorie tracker (visible after plan OR if generated before) */}
      <AnimatePresence>
        {(showCalTracker || !plan) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CalorieTracker recommended={recommendedCal} dog={dog} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!plan && !loading && (
        <div className="bg-white rounded-2xl border border-dashed border-emerald-300 p-6 text-center">
          <p className="text-3xl mb-2">🥗</p>
          <p className="text-sm font-semibold text-foreground">Plan repas IA</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Génère un plan nutritionnel personnalisé basé sur le profil complet de {dog.name}</p>
          <button onClick={generatePlan} className="px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2 mx-auto">
            <Sparkles className="w-4 h-4" />
            Créer le plan de {dog.name}
          </button>
        </div>
      )}
    </div>
  );
}