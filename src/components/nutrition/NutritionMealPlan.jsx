import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShoppingCart, BookmarkPlus } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

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

export default function NutritionMealPlan({ dog, recentScans, isPremium, user, dietPrefs }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!dog) {
    return <p className="text-muted-foreground text-sm text-center py-10">Aucun chien trouvé.</p>;
  }

  const savePlan = async () => {
    if (!plan || !dog || !user) return;
    setSaving(true);
    try {
      await base44.entities.NutritionPlan.create({
        dog_id: dog.id,
        owner_email: user.email,
        plan_text: plan,
        generated_at: new Date().toISOString(),
        dog_weight_at_generation: dog.weight,
        is_active: true,
        notes: "",
      });
      toast.success("Plan sauvegardé ! Retrouve-le dans 'Mes plans'.");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    setPlan(null);

    const activityMap = { faible: "Faible (< 30 min/jour)", modere: "Modérée (30-60 min/jour)", eleve: "Élevée (1-2h/jour)", tres_eleve: "Très élevée (> 2h/jour)" };
    const dietMap = { kibble: "Croquettes sèches", barf: "BARF (viande crue)", mixed: "Mixte (croquettes + ménager)", homemade: "Ration ménagère" };

    const ageMonths = dog.birth_date ? Math.floor((Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30)) : null;
    const lifeStage = !ageMonths ? "adulte" : ageMonths < 12 ? "chiot" : ageMonths > 84 ? "senior" : "adulte";

    const scansContext = recentScans.length > 0
      ? `\nScans alimentaires récents: ${recentScans.map(s => `${s.food_name} (${s.verdict})`).join(", ")}`
      : "";

    const prefsContext = dietPrefs
      ? `\n## PRÉFÉRENCES ALIMENTAIRES DU PROPRIÉTAIRE\n- Marques préférées: ${dietPrefs.preferred_brands ? JSON.parse(dietPrefs.preferred_brands).join(", ") : "non précisées"}\n- Aliments refusés par le chien: ${dietPrefs.disliked_foods || "aucun"}\n- Horaires repas: matin ${dietPrefs.meal_times ? JSON.parse(dietPrefs.meal_times).morning : "07:30"}, soir ${dietPrefs.meal_times ? JSON.parse(dietPrefs.meal_times).evening : "18:30"}\n- Budget mensuel: ${({ low: "économique (<30€)", medium: "standard (30-70€)", high: "premium (>70€)" })[dietPrefs.budget_monthly] || "standard"}\n- Préférence bio: ${dietPrefs.organic_preference ? "Oui" : "Non"}\n- Notes: ${dietPrefs.notes || "aucune"}`
      : "";

    const prompt = `Tu es un nutritionniste vétérinaire expert. Génère un plan alimentaire hebdomadaire ultra-précis pour ce chien.

## PROFIL DU CHIEN
- Nom: ${dog.name}
- Race: ${dog.breed || "inconnue"}
- Stade de vie: ${lifeStage} (${getAge(dog.birth_date) || "âge inconnu"})
- Poids actuel: ${dog.weight ? dog.weight + " kg" : "inconnu"}
- Niveau d'activité: ${activityMap[dog.activity_level] || "modéré"}
- Stérilisé(e): ${dog.neutered ? "Oui (besoin calorique réduit de 20-25%)" : "Non"}
- Type d'alimentation actuel: ${dietMap[dog.diet_type] || "non précisé"}
- Marque actuelle: ${dog.diet_brand || "non précisée"}
- Allergies/intolérances: ${dog.allergies || "aucune connue"}
- Problèmes de santé: ${dog.health_issues || "aucun"}
- Restrictions alimentaires: ${dog.diet_restrictions || "aucune"}
${scansContext}${prefsContext}

## FORMAT DE RÉPONSE ATTENDU

### 🔥 Besoins caloriques journaliers
Calcule le RER (Resting Energy Requirement) = 70 × (poids en kg)^0.75, puis multiplie par le facteur adapté (stérilisé, activité, stade de vie). Donne le total en kcal/jour.

### 📊 Quantités recommandées
Selon le type d'alimentation (${dietMap[dog.diet_type] || "croquettes"}) :
- Si croquettes : grammes/jour (basé sur ~3500 kcal/kg de croquettes standard, à ajuster selon la marque)
- Si BARF : % du poids corporel (2-3% pour adulte) avec répartition muscles/abats/os
- Si ration ménagère : grammes totaux avec sources de protéines, féculents, légumes
- Répartition matin/soir en pourcentage

### 📅 Plan semaine (Lundi → Dimanche)
Pour chaque jour : repas matin (heure, aliment, quantité en g) + repas soir (heure, aliment, quantité en g) + éventuelles friandises/compléments.
Varie les sources de protéines au cours de la semaine.

### 🥩 Aliments recommandés en complément
Liste des légumes, fruits et suppléments bénéfiques pour cette race/âge avec quantités max hebdomadaires.

### ❌ Aliments strictement interdits
Pour ${dog.name} spécifiquement (prends en compte la race, l'âge et les allergies renseignées).

### 🛒 3 marques recommandées
Pour chaque marque : nom, gamme adaptée, kcal/100g, pourquoi elle convient à ${dog.name}, fourchette de prix.

### 💡 Conseil du nutritionniste
1 conseil personnalisé spécifique au profil de ${dog.name} (race, âge, santé).

Sois très précis avec les grammes et calories. Adapte tout au profil exact.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setPlan(typeof response === "string" ? response : JSON.stringify(response));
    } catch (e) {
      setPlan("Erreur lors de la génération. Réessaie !");
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
          <h3 className="font-bold text-foreground">Plan de repas personnalisé IA</h3>
          <p className="text-sm text-muted-foreground px-4">
            Génère un plan hebdomadaire complet adapté au profil exact de {dog.name}, avec quantités, marques recommandées et aliments à éviter.
          </p>
          <Button onClick={generate} className="bg-safe hover:bg-safe/90 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-safe/30">
            ✨ Générer mon plan de repas
          </Button>
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
          {/* Meal plan content */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <ReactMarkdown
              className="prose prose-sm max-w-none prose-headings:text-foreground prose-strong:text-foreground"
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-safe mt-4 mb-2 first:mt-0 flex items-center gap-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h3>,
                p: ({ children }) => <p className="text-sm text-foreground my-1.5 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>,
                li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              }}
            >
              {plan}
            </ReactMarkdown>
          </div>

          {/* Affiliate brands */}
          <div className="bg-accent/10 rounded-2xl border border-accent/20 p-4">
            <p className="text-xs font-bold text-accent flex items-center gap-1.5 mb-3">
              <ShoppingCart className="w-3.5 h-3.5" /> Marques recommandées – Liens partenaires
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
                    <span className="text-xs text-accent font-medium">Voir →</span>
                    </motion.a>
              ))}
            </div>
            <p className="text-[10px] text-accent mt-2 text-center">🤝 Liens affiliés – soutient PawCoach sans surcoût</p>
          </div>

          {/* Regenerate */}
          <Button
            onClick={generate}
            variant="outline"
            className="w-full h-11 rounded-2xl border-safe/20 text-safe font-semibold gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Régénérer le plan
          </Button>
        </div>
      )}
    </div>
  );
}