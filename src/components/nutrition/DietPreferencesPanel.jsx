import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Plus, X, Clock, Leaf, Wallet, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const BUDGET_OPTIONS = [
  { id: "low",    label: "\u{00c9}conomique", desc: "< 30\u20ac/mois", emoji: "\u{1F49A}" },
  { id: "medium", label: "Standard",   desc: "30-70\u20ac/mois", emoji: "\u{1F49B}" },
  { id: "high",   label: "Premium",    desc: "> 70\u20ac/mois", emoji: "\u{1F49C}" },
];

const PORTIONS_OPTIONS = [1, 2, 3];

const POPULAR_BRANDS = [
  "Royal Canin", "Hill's", "Purina Pro Plan", "Orijen",
  "Acana", "Carnilove", "Edgard & Cooper", "Ownat",
  "Virbac", "Brit Care",
];

const COMMON_DISLIKES = [
  "Poulet", "Boeuf", "Porc", "Poisson",
  "Cereales", "Gluten", "Soja", "Mais",
];

export default function DietPreferencesPanel({ dog, user }) {
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Local form state
  const [preferredBrands, setPreferredBrands] = useState([]);
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [mealMorning, setMealMorning] = useState("07:30");
  const [mealNoon, setMealNoon] = useState("12:30");
  const [mealEvening, setMealEvening] = useState("18:30");
  const [portionsPerDay, setPortionsPerDay] = useState(2);
  const [budget, setBudget] = useState("medium");
  const [organic, setOrganic] = useState(false);
  const [notes, setNotes] = useState("");
  const [newBrand, setNewBrand] = useState("");

  useEffect(() => {
    if (!dog || !user) return;
    loadPrefs();
  }, [dog?.id]);

  const loadPrefs = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.DietPreferences.filter({ dog_id: dog.id, owner_email: user.email });
      if (existing?.length > 0) {
        const p = existing[0];
        setPrefs(p);
        setPreferredBrands(p.preferred_brands ? JSON.parse(p.preferred_brands) : []);
        setDislikedFoods(p.disliked_foods || "");
        const times = p.meal_times ? JSON.parse(p.meal_times) : {};
        setMealMorning(times.morning || "07:30");
        setMealNoon(times.noon || "12:30");
        setMealEvening(times.evening || "18:30");
        setPortionsPerDay(p.portions_per_day || 2);
        setBudget(p.budget_monthly || "medium");
        setOrganic(p.organic_preference || false);
        setNotes(p.notes || "");
      } else {
        // Pre-populate brand from dog profile if available
        if (dog.diet_brand && dog.diet_brand.trim()) {
          setPreferredBrands([dog.diet_brand.trim()]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const buildMealTimes = () => {
    if (portionsPerDay === 1) return { morning: mealMorning };
    if (portionsPerDay === 3) return { morning: mealMorning, noon: mealNoon, evening: mealEvening };
    return { morning: mealMorning, evening: mealEvening };
  };

  const handleSave = async () => {
    if (!dog || !user) return;
    setSaving(true);
    const data = {
      dog_id: dog.id,
      owner_email: user.email,
      preferred_brands: JSON.stringify(preferredBrands),
      disliked_foods: dislikedFoods,
      meal_times: JSON.stringify(buildMealTimes()),
      portions_per_day: portionsPerDay,
      budget_monthly: budget,
      organic_preference: organic,
      notes,
    };
    try {
      if (prefs?.id) {
        await base44.entities.DietPreferences.update(prefs.id, data);
      } else {
        const created = await base44.entities.DietPreferences.create(data);
        setPrefs(created);
      }
      setSaved(true);
      toast.success("Préférences sauvegardées !");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const addBrand = (name) => {
    const brand = (name || newBrand).trim();
    if (!brand || preferredBrands.includes(brand)) return;
    setPreferredBrands(prev => [...prev, brand]);
    setNewBrand("");
  };

  const toggleDislike = (food) => {
    const current = dislikedFoods.split(",").map(s => s.trim()).filter(Boolean);
    if (current.some(c => c.toLowerCase() === food.toLowerCase())) {
      setDislikedFoods(current.filter(c => c.toLowerCase() !== food.toLowerCase()).join(", "));
    } else {
      setDislikedFoods([...current, food].join(", "));
    }
  };

  const isDisliked = (food) => {
    return dislikedFoods.toLowerCase().includes(food.toLowerCase());
  };

  // Brands not yet selected, available as suggestions
  const suggestedBrands = POPULAR_BRANDS.filter(b => !preferredBrands.includes(b));

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h2 className="font-bold text-foreground text-base">Préférences alimentaires</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Ces données personnalisent les plans générés pour {dog?.name}</p>
      </div>

      {/* Marques pr\u00e9f\u00e9r\u00e9es */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">{"\u{1F3F7}\uFE0F"} Marques appréciées</p>

        {/* Selected brands */}
        {preferredBrands.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {preferredBrands.map((b, i) => (
              <motion.span key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                {b}
                <button onClick={() => setPreferredBrands(prev => prev.filter((_, idx) => idx !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </div>
        )}

        {/* Popular brand suggestions */}
        {suggestedBrands.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Marques populaires (appuie pour ajouter)</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedBrands.map(b => (
                <button key={b} onClick={() => addBrand(b)}
                  className="text-[11px] text-muted-foreground bg-muted/50 hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-full border border-border/50 transition-colors">
                  + {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom brand input */}
        <div className="flex gap-2">
          <Input value={newBrand} onChange={e => setNewBrand(e.target.value)}
            placeholder="Autre marque..." className="text-sm"
            onKeyDown={e => e.key === "Enter" && addBrand()} />
          <Button onClick={() => addBrand()} variant="outline" size="sm" className="flex-shrink-0"
            disabled={!newBrand.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Aliments refus\u00e9s */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">{"\u{1F624}"} Aliments refusés / non aimés</p>

        {/* Common dislikes quick-pick */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Allergènes et intolérances courants</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_DISLIKES.map(food => (
              <button key={food} onClick={() => toggleDislike(food)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  isDisliked(food)
                    ? "bg-red-50 text-red-700 border-red-200 font-semibold"
                    : "text-muted-foreground bg-muted/50 border-border/50 hover:bg-red-50 hover:text-red-600"
                }`}>
                {isDisliked(food) ? "\u2715 " : ""}{food}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={dislikedFoods}
          onChange={e => setDislikedFoods(e.target.value)}
          placeholder={`Autres : ${dog?.name} refuse le poulet, n'aime pas les carottes...`}
          className="w-full text-sm rounded-xl border border-border p-3 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Horaires & portions */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Repas par jour & horaires
        </p>

        {/* Portions selector FIRST — drives the time inputs */}
        <div>
          <div className="flex gap-2">
            {PORTIONS_OPTIONS.map(n => (
              <button key={n} onClick={() => setPortionsPerDay(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  portionsPerDay === n ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-muted-foreground"
                }`}>
                {n} repas
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic time inputs based on portions */}
        <div className={`grid gap-3 ${portionsPerDay === 3 ? "grid-cols-3" : portionsPerDay === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {portionsPerDay >= 1 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{portionsPerDay === 1 ? "\u{1F31E} Repas" : "\u{1F305} Matin"}</p>
              <Input type="time" value={mealMorning} onChange={e => setMealMorning(e.target.value)} className="text-sm" />
            </div>
          )}
          {portionsPerDay >= 3 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{"\u2600\uFE0F"} Midi</p>
              <Input type="time" value={mealNoon} onChange={e => setMealNoon(e.target.value)} className="text-sm" />
            </div>
          )}
          {portionsPerDay >= 2 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{"\u{1F307}"} Soir</p>
              <Input type="time" value={mealEvening} onChange={e => setMealEvening(e.target.value)} className="text-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Budget */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" /> Budget mensuel alimentation
        </p>
        <div className="flex gap-2">
          {BUDGET_OPTIONS.map(({ id, label, desc, emoji }) => (
            <button key={id} onClick={() => setBudget(id)}
              className={`flex-1 py-3 px-2 rounded-2xl text-center border-2 transition-all ${
                budget === id ? "border-primary bg-primary/10" : "border-border bg-white"
              }`}>
              <p className="text-lg">{emoji}</p>
              <p className={`text-xs font-bold mt-0.5 ${budget === id ? "text-primary" : "text-foreground"}`}>{label}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <button onClick={() => setOrganic(o => !o)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${organic ? "bg-green-100" : "bg-muted/50"}`}>
              <Leaf className={`w-4 h-4 ${organic ? "text-green-600" : "text-muted-foreground"}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Préférence bio / naturel</p>
              <p className="text-xs text-muted-foreground">Privilégier les ingrédients naturels</p>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full transition-all relative ${organic ? "bg-green-500" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${organic ? "left-5" : "left-0.5"}`} />
          </div>
        </button>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">{"\u{1F4DD}"} Notes personnelles</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Infos supplémentaires pour personnaliser les plans IA..."
          className="w-full text-sm rounded-xl border border-border p-3 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <Button onClick={handleSave} disabled={saving || saved}
        className={`w-full h-14 rounded-2xl text-white font-bold shadow-lg gap-2 transition-all duration-300 ${saved ? "bg-green-500 shadow-green-200" : "bg-safe hover:bg-safe/90 shadow-safe/20"}`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? "Sauvegarde..." : saved ? "Sauvegardé !" : "Sauvegarder mes préférences"}
      </Button>
    </div>
  );
}