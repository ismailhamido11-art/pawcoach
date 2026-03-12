import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, BarChart2, ChevronDown, ChevronUp, Trophy, AlertTriangle, CheckCircle2, Loader2, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";
import { spring } from "@/lib/animations";

const SCORE_COLOR = (s) => {
  if (s >= 7.5) return { ring: "#22c55e", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
  if (s >= 5)   return { ring: "#f59e0b", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" };
  return              { ring: "#ef4444", bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200"   };
};

function CircleScore({ score, size = 60 }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const filled = score != null ? (score / 10) * circ : 0;
  const col = score != null ? SCORE_COLOR(score).ring : "#e5e7eb";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth="7" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={col} strokeWidth="7" fill="none"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold text-foreground leading-none" style={{ fontSize: size * 0.22 }}>{score ?? "?"}</span>
        <span className="text-muted-foreground" style={{ fontSize: size * 0.14 }}>/10</span>
      </div>
    </div>
  );
}

function ProductSlot({ index, product, onAdd, onRemove }) {
  const [fileInput, setFileInput] = useState(null);

  if (!product) {
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={spring}
        onClick={() => fileInput?.click()}
        className="flex-1 min-h-[140px] rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-secondary/40 transition-colors"
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={el => setFileInput(el)}
          onChange={e => e.target.files[0] && onAdd(e.target.files[0], index)}
        />
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground text-center px-2">
          Ajouter<br />produit {index + 1}
        </p>
      </motion.button>
    );
  }

  const { state, preview, result } = product;
  const col = result?.score != null ? SCORE_COLOR(result.score) : null;

  return (
    <div className={`flex-1 rounded-2xl border-2 overflow-hidden ${col ? col.border : "border-border"} ${col ? col.bg : "bg-muted/20"}`}>
      {/* Image + remove */}
      <div className="relative">
        <img src={preview} alt="" className="w-full h-28 object-cover" />
        <button onClick={() => onRemove(index)}
          className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1 shadow">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      {/* Info */}
      <div className="p-3">
        {state === "analyzing" && (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground text-center">Analyse IA…</p>
          </div>
        )}
        {state === "done" && result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CircleScore score={result.score} size={52} />
              <p className="text-xs font-bold text-foreground leading-tight">{result.food_name}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{result.summary}</p>
          </div>
        )}
        {state === "error" && (
          <p className="text-xs text-red-600 font-medium">Analyse échouée. Réessaie.</p>
        )}
      </div>
    </div>
  );
}

export default function FoodComparator({ dog, dietPreferences }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const dislikedFoods = dietPreferences?.disliked_foods || "aucun";
  const [products, setProducts] = useState([null, null]);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const [compSaved, setCompSaved] = useState(false);

  const saveComparison = async () => {
    if (!comparison || comparison.error || compSaved) return;
    try {
      const user = await base44.auth.me();
      const [a, b] = products;
      const content = `# Comparaison : ${a?.result?.food_name || "Produit 1"} vs ${b?.result?.food_name || "Produit 2"}\n\n**Gagnant** : ${comparison.winner_name}\n${comparison.winner_reason}\n\n## Bilan\n${comparison.comparison_summary}\n\n**Recommandation** : ${comparison.recommendation}`;
      await base44.entities.Bookmark.create({
        dog_id: dog?.id,
        owner: user.email,
        content,
        source: "compare",
        title: `${a?.result?.food_name || "?"} vs ${b?.result?.food_name || "?"}`.slice(0, 60),
        created_at: new Date().toISOString(),
      });
      setCompSaved(true);
      toast.success("Comparaison sauvegardee !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const analyzeProduct = async (file, index) => {
    if (!isPremium && !hasCredits) return;

    const preview = await new Promise(resolve => {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.readAsDataURL(file);
    });

    setProducts(prev => {
      const next = [...prev];
      next[index] = { state: "analyzing", preview, result: null, file };
      return next;
    });

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const ageText = dog?.birth_date
        ? (() => {
            const months = Math.floor((Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30));
            return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
          })()
        : "âge inconnu";

      const prompt = `Tu es PawCoach, expert en nutrition canine. Analyse cette étiquette ou photo d'aliment pour chien.
Chien : ${dog?.name || "chien"}, race : ${dog?.breed || "inconnue"}, âge : ${ageText}, poids : ${dog?.weight ? dog.weight + "kg" : "inconnu"}, allergies : ${dog?.allergies || "aucune"}, aliments indésirables : ${dislikedFoods}, régime : ${dog?.diet_type || "inconnu"}.
Si un ingrédient correspond aux aliments indésirables, le signaler dans l'analyse.
Si l'image ne montre pas clairement un produit ou une étiquette lisible, utilise food_name = 'Produit non identifié', score = 0, summary = 'Image non lisible — essayez avec une photo plus nette de l\'étiquette'.
Fournis une analyse nutritionnelle détaillée en JSON. Réponds UNIQUEMENT en français. Sois précis sur la composition.`;

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            food_name: { type: "string" },
            verdict: { type: "string" },
            score: { type: "number" },
            summary: { type: "string" },
            pros: { type: "array", items: { type: "string" } },
            cons: { type: "array", items: { type: "string" } },
            details: { type: "string" },
            recommendation: { type: "string" },
            key_ingredients: { type: "array", items: { type: "string" } },
            allergen_alert: { type: "boolean" },
          },
        },
      });

      setProducts(prev => {
        const next = [...prev];
        next[index] = { ...next[index], state: "done", result: { ...aiResult, photo_url: file_url } };
        return next;
      });
      // Consume action credit on success
      if (!isPremium) await consume();
    } catch {
      setProducts(prev => {
        const next = [...prev];
        next[index] = { ...next[index], state: "error" };
        return next;
      });
    }
  };

  const removeProduct = (index) => {
    setProducts(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setComparison(null);
  };

  const compare = async () => {
    const [a, b] = products;
    if (!a?.result || !b?.result) return;
    setComparing(true);
    setComparison(null);
    try {
      const nameA = a.result.food_name || "Produit A";
      const nameB = b.result.food_name || "Produit B";
      const prompt = `Tu es PawCoach, expert nutrition canine. Compare ces deux produits pour le chien ${dog?.name || "ce chien"} (${dog?.breed || ""}, ${dog?.weight ? dog.weight + "kg" : ""}, allergies : ${dog?.allergies || "aucune"}, aliments indésirables : ${dislikedFoods}).

Produit A — ${nameA} (score ${a.result.score}/10)
- Points forts : ${(a.result.pros || []).join(", ")}
- Points faibles : ${(a.result.cons || []).join(", ")}
- Composition : ${a.result.details}

Produit B — ${nameB} (score ${b.result.score}/10)
- Points forts : ${(b.result.pros || []).join(", ")}
- Points faibles : ${(b.result.cons || []).join(", ")}
- Composition : ${b.result.details}

Le champ winner doit valoir EXACTEMENT 'A' ou 'B', rien d'autre.
Fournis une comparaison personnalisée avec un verdict clair. Réponds en JSON, en français, en tutoyant l'utilisateur.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            winner: { type: "string" },
            winner_name: { type: "string" },
            winner_reason: { type: "string" },
            comparison_summary: { type: "string" },
            product_a_analysis: { type: "string" },
            product_b_analysis: { type: "string" },
            recommendation: { type: "string" },
          },
        },
      });
      setComparison(res);
    } catch {
      setComparison({ error: true });
    } finally {
      setComparing(false);
    }
  };

  const readyCount = products.filter(p => p?.state === "done").length;
  const anyAnalyzing = products.some(p => p?.state === "analyzing");

  if (!isPremium && !hasCredits) {
    return <UpgradePrompt type="action" from="comparateur" />;
  }

  return (
    <div className="space-y-4">
      {!isPremium && credits != null && <CreditBadge remaining={credits} />}
      {/* Product slots */}
      <div className="flex gap-3">
        {products.map((product, i) => (
          <ProductSlot
            key={i}
            index={i}
            product={product}
            onAdd={analyzeProduct}
            onRemove={removeProduct}
          />
        ))}
      </div>

      {/* Individual pros/cons */}
      {products.some(p => p?.result) && (
        <div className="space-y-3">
          {products.map((p, i) => {
            if (!p?.result) return null;
            const col = SCORE_COLOR(p.result.score);
            const open = showDetails[i];
            return (
              <Card key={i} className={`shadow-none border-2 ${col.border}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircleScore score={p.result.score} size={48} />
                      <div>
                        <p className="font-bold text-foreground text-sm leading-tight">{p.result.food_name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>
                          Produit {i + 1}
                        </span>
                      </div>
                    </div>
                    {p.result.allergen_alert && (
                      <div className="flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Allergène
                      </div>
                    )}
                  </div>

                  {/* Pros */}
                  {p.result.pros?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide">✅ Avantages</p>
                      {p.result.pros.map((pro, j) => (
                        <div key={j} className="flex gap-2 items-start">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground/80">{pro}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cons */}
                  {p.result.cons?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">❌ Inconvénients</p>
                      {p.result.cons.map((con, j) => (
                        <div key={j} className="flex gap-2 items-start">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground/80">{con}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="bg-white/80 rounded-xl p-2.5 border border-border/50">
                    <p className="text-[10px] font-bold text-primary mb-1">💡 Pour {dog?.name || "ton chien"}</p>
                    <p className="text-xs text-foreground/80">{p.result.recommendation}</p>
                  </div>

                  {/* Details toggle */}
                  <button onClick={() => setShowDetails(s => ({ ...s, [i]: !open }))}
                    className="flex items-center gap-1 text-xs font-semibold text-primary">
                    {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {open ? "Masquer la composition" : "Voir la composition"}
                  </button>
                  {open && (
                    <div className="text-xs text-foreground/70 border-t border-border/40 pt-2 leading-relaxed">
                      {p.result.details}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Compare button */}
      {readyCount === 2 && !comparison && (
        <Button
          onClick={compare}
          disabled={comparing || anyAnalyzing}
          className="w-full h-14 gradient-primary border-0 text-white font-bold rounded-2xl shadow-lg shadow-primary/25"
        >
          {comparing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Comparaison IA en cours…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Comparer les 2 produits
            </span>
          )}
        </Button>
      )}

      {/* Comparison result */}
      <AnimatePresence>
        {comparison && !comparison.error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <Card className="shadow-none border-2 border-primary/30 bg-gradient-to-b from-secondary/40 to-secondary/10">
              <CardContent className="p-4 space-y-4">
                {/* Winner banner */}
                <div className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-primary/20 shadow-sm">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Meilleur choix</p>
                    <p className="font-bold text-foreground text-sm">{comparison.winner_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{comparison.winner_reason}</p>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Bilan comparatif</p>
                  <div className="text-sm text-foreground/80 leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="my-1">{children}</p>,
                        ul: ({ children }) => <ul className="my-1 ml-3 list-disc">{children}</ul>,
                        li: ({ children }) => <li className="my-0.5 text-xs">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {comparison.comparison_summary}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Per-product analysis */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: products[0]?.result?.food_name || "Produit A", text: comparison.product_a_analysis, winner: comparison.winner === "A" },
                    { label: products[1]?.result?.food_name || "Produit B", text: comparison.product_b_analysis, winner: comparison.winner === "B" },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-xl p-3 border-2 ${item.winner ? "border-primary/40 bg-primary/5" : "border-border bg-white/60"}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.winner && <Trophy className="w-3 h-3 text-primary" />}
                        <p className="text-[10px] font-bold text-foreground">{item.label}</p>
                      </div>
                      <p className="text-xs text-foreground/70 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* Final recommendation */}
                <div className="bg-white rounded-xl p-3 border border-primary/20">
                  <p className="text-[10px] font-bold text-primary mb-1">🎯 Recommandation pour {dog?.name || "ton chien"}</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{comparison.recommendation}</p>
                </div>

                {/* Save + Reset */}
                <div className="flex gap-2">
                  <Button
                    onClick={saveComparison}
                    disabled={compSaved}
                    size="sm"
                    className={`flex-1 rounded-xl ${compSaved ? "bg-green-50 text-green-700 border border-green-200" : "gradient-primary border-0 text-white"}`}
                  >
                    {compSaved ? <BookmarkCheck className="w-3.5 h-3.5 mr-1.5" /> : <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />}
                    {compSaved ? "Sauvegardee" : "Sauvegarder"}
                  </Button>
                  <Button
                    onClick={() => { setProducts([null, null]); setComparison(null); setCompSaved(false); }}
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                  >
                    Nouvelle comparaison
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {comparison?.error && (
          <p className="text-center text-sm text-red-600">Erreur lors de la comparaison. Réessaie.</p>
        )}
      </AnimatePresence>
    </div>
  );
}