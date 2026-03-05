import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SavedPlansPanel({ dog, user }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});
  const [tempNote, setTempNote] = useState("");

  useEffect(() => {
    if (!dog || !user) return;
    loadPlans();
  }, [dog?.id]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const p = await base44.entities.NutritionPlan.filter(
        { dog_id: dog.id, owner_email: user.email },
        "-generated_at",
        10
      );
      setPlans(p || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.NutritionPlan.delete(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success("Plan supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSaveNote = async (plan) => {
    try {
      await base44.entities.NutritionPlan.update(plan.id, { notes: tempNote });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, notes: tempNote } : p));
      setEditingNotes(prev => ({ ...prev, [plan.id]: false }));
      toast.success("Note sauvegardée");
    } catch {
      toast.error("Erreur");
    }
  };

  if (loading) return (
    <div className="space-y-3">
      {[1,2].map(i => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (plans.length === 0) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">📅</p>
      <p className="font-semibold text-foreground">Aucun plan sauvegardé</p>
      <p className="text-sm text-muted-foreground mt-1">Génère un plan dans l'onglet "Plan repas" pour le retrouver ici.</p>
    </div>
  );

  return (
    <div className="space-y-3 pb-4">
      <p className="text-xs text-muted-foreground font-medium">{plans.length} plan(s) sauvegardé(s)</p>
      {plans.map(plan => (
        <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {plan.generated_at
                    ? format(new Date(plan.generated_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                    : "Date inconnue"}
                </p>
                {plan.dog_weight_at_generation && (
                  <p className="text-xs text-primary font-medium mt-0.5">⚖️ {plan.dog_weight_at_generation} kg lors de la génération</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                  className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground"
                >
                  {expandedId === plan.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-3 pt-3 border-t border-border/40">
              {editingNotes[plan.id] ? (
                <div className="space-y-2">
                  <textarea
                    value={tempNote}
                    onChange={e => setTempNote(e.target.value)}
                    placeholder="Note personnelle sur ce plan..."
                    className="w-full text-xs rounded-xl border border-border p-2.5 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveNote(plan)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold">
                      <Check className="w-3 h-3" /> Sauvegarder
                    </button>
                    <button onClick={() => setEditingNotes(prev => ({ ...prev, [plan.id]: false }))}
                      className="px-3 py-1.5 rounded-lg bg-muted text-xs">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setTempNote(plan.notes || ""); setEditingNotes(prev => ({ ...prev, [plan.id]: true })); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  {plan.notes || "Ajouter une note..."}
                </button>
              )}
            </div>
          </div>

          {/* Expanded plan content */}
          <AnimatePresence>
            {expandedId === plan.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/40"
              >
                <div className="p-4 bg-muted/20 max-h-96 overflow-y-auto">
                  <ReactMarkdown
                    className="prose prose-sm max-w-none"
                    components={{
                      h2: ({ children }) => <h2 className="text-sm font-bold text-safe mt-3 mb-1 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="text-xs text-foreground my-1 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="my-1 ml-3 list-disc">{children}</ul>,
                      li: ({ children }) => <li className="text-xs text-foreground">{children}</li>,
                    }}
                  >
                    {plan.plan_text}
                  </ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}