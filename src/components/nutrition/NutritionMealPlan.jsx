import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShoppingCart, Lock } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

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

export default function NutritionMealPlan({ dog, recentScans, isPremium }) {
  const [plan, setPlan] = useState(null);
  const [brands, setBrands] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!dog) {
    return <p className="text-muted-foreground text-sm text-center py-10">Aucun chien trouvé.</p>;
  }

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    setBrands(null);

    const activityMap = { faible: "Faible", modere: "Modérée", eleve: "Élevée", tres_eleve: "Très élevée" };
    const scansContext = recentScans.length > 0
      ? `\nScans récents: ${recentScans.map(s => `${s.food_name} (${s.verdict})`).join(", ")}`
      : "";

    const prompt = `Génère un plan de repas hebdomadaire complet et détaillé pour ce chien :
Nom: ${dog.name}
Race: ${dog.breed || "inconnue"}
Âge: ${getAge(dog.birth_date) || "inconnu"}
Poids: ${dog.weight ? dog.weight + " kg" : "inconnu"}
Niveau d'activité: ${activityMap[dog.activity_level] || "inconnu"}
Stérilisé: ${dog.neutered ? "Oui" : "Non"}
Allergies: ${dog.allergies || "aucune"}
Problèmes de santé: ${dog.health_issues || "aucun"}
${scansContext}

Inclus :
1. **Plan semaine** (lundi à dimanche) avec repas matin et soir, quantités en grammes
2. **Calories journalières recommandées**
3. **3 marques de croquettes adaptées** avec justification (note: indique "🛒 Disponible en ligne")
4. **Aliments sains en complément** (légumes, fruits ok pour cette race/âge)
5. **Aliments strictement interdits** pour ce chien

Sois très précis, pratique et personnalisé pour ${dog.name}.`;

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
      {/* Dog summary */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-safe/10 flex items-center justify-center text-2xl">🐕</div>
          <div>
            <p className="font-bold text-foreground">{dog.name}</p>
            <p className="text-xs text-muted-foreground">
              {dog.breed}{dog.weight ? ` · ${dog.weight} kg` : ""}{dog.allergies ? ` · Allergies: ${dog.allergies}` : ""}
            </p>
          </div>
          {recentScans.length > 0 && (
            <div className="ml-auto bg-safe/10 px-2.5 py-1 rounded-full border border-safe/20">
              <span className="text-safe text-xs font-medium">🔍 {recentScans.length} scans intégrés</span>
            </div>
          )}
        </div>
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