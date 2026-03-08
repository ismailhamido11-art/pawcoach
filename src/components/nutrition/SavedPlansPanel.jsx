import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, ChevronDown, ChevronUp, Pencil, Check, X, Home, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function parsePlanJSON(text) {
  if (!text) return null;
  try {
    const data = JSON.parse(text);
    if (data.days && Array.isArray(data.days)) return data;
  } catch {
    // Not JSON
  }
  return null;
}

function PlanContent({ planText }) {
  const parsed = parsePlanJSON(planText);

  if (!parsed) {
    // Old markdown plan — render as plain text
    return (
      <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
        {planText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      {(parsed.calories_per_day || parsed.quantity_summary) && (
        <div className="flex flex-wrap gap-1.5">
          {parsed.calories_per_day && (
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              {parsed.calories_per_day} kcal/jour
            </span>
          )}
          {parsed.quantity_summary && (
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              {parsed.quantity_summary}
            </span>
          )}
        </div>
      )}

      {/* Days */}
      {parsed.days.map((d, i) => (
        <div key={i} className="bg-white rounded-xl border border-border/60 p-3">
          <p className="text-xs font-bold text-foreground mb-1.5">{d.day}</p>
          <div className="space-y-1">
            {d.morning && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">Matin</span>
                <div>
                  <p className="text-[12px] text-foreground/80">{d.morning.food}</p>
                  <p className="text-[10px] text-muted-foreground">{d.morning.quantity}</p>
                </div>
              </div>
            )}
            {d.evening && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">Soir</span>
                <div>
                  <p className="text-[12px] text-foreground/80">{d.evening.food}</p>
                  <p className="text-[10px] text-muted-foreground">{d.evening.quantity}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Supplements */}
      {parsed.supplements?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-foreground mb-1">Compl&#233;ments</p>
          <div className="flex flex-wrap gap-1">
            {parsed.supplements.map((s, i) => (
              <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Avoid */}
      {parsed.avoid?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-red-700 mb-1">\u00c0 \u00e9viter</p>
          <div className="flex flex-wrap gap-1">
            {parsed.avoid.map((a, i) => (
              <span key={i} className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tip */}
      {parsed.tip && (
        <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 italic">{parsed.tip}</p>
      )}
    </div>
  );
}

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

  const handleActivate = async (planId) => {
    try {
      // Deactivate all, then activate the chosen one
      await Promise.all(plans.filter(p => p.is_active).map(p =>
        base44.entities.NutritionPlan.update(p.id, { is_active: false })
      ));
      await base44.entities.NutritionPlan.update(planId, { is_active: true });
      setPlans(prev => prev.map(p => ({ ...p, is_active: p.id === planId })));
      toast.success("Programme active ! Retrouve-le sur ton accueil.");
    } catch {
      toast.error("Erreur lors de l'activation");
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
      <p className="text-sm text-muted-foreground mt-1">G\u00e9n\u00e8re un plan dans l'onglet \u00ab Plan repas \u00bb pour le retrouver ici.</p>
    </div>
  );

  // Determine the single "true" active plan (most recent if multiple are marked active)
  const activePlans = plans.filter(p => p.is_active);
  const trueActiveId = activePlans.length === 1
    ? activePlans[0].id
    : activePlans.length > 1
      ? activePlans.sort((a, b) => (b.generated_at || "").localeCompare(a.generated_at || ""))[0]?.id
      : null;

  return (
    <div className="space-y-3 pb-4">
      <p className="text-xs text-muted-foreground font-medium">{plans.length} plan(s) sauvegardé(s)</p>
      {plans.map(plan => {
        const isTheActive = plan.id === trueActiveId;
        const planJSON = parsePlanJSON(plan.plan_text);
        const startDate = planJSON?.start_date;
        const elapsed = startDate ? Math.floor((new Date().setHours(0,0,0,0) - new Date(startDate + "T00:00:00")) / 86400000) : null;
        const dayNumber = elapsed !== null && elapsed >= 0 ? Math.min(elapsed + 1, 7) : null;
        const isExpired = elapsed !== null && elapsed >= 7;
        return (
        <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Header */}
          <div className={`p-4 ${isTheActive ? "bg-emerald-50/50" : ""}`}>
            {/* Active badge */}
            {isTheActive && (
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {isExpired ? "Plan termin\u00e9 — g\u00e9n\u00e8re un nouveau !" : `Plan actif — Jour ${dayNumber || "?"}/7`}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {plan.generated_at
                    ? format(new Date(plan.generated_at), "d MMMM yyyy 'a' HH:mm", { locale: fr })
                    : "Date inconnue"}
                  {dayNumber && !isExpired ? ` — J${dayNumber}/7` : ""}
                  {isExpired ? " — Termin\u00e9" : ""}
                </p>
                {plan.dog_weight_at_generation && (
                  <p className="text-xs text-primary font-medium mt-0.5">{plan.dog_weight_at_generation} kg lors de la g\u00e9n\u00e9ration</p>
                )}
              </div>
              <div className="flex gap-1.5">
                {!isTheActive && (
                  <button
                    onClick={() => handleActivate(plan.id)}
                    className="h-8 px-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 text-emerald-700 text-xs font-semibold"
                  >
                    <Home className="w-3.5 h-3.5" /> Choisir ce plan
                  </button>
                )}
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
                  <PlanContent planText={plan.plan_text} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        );
      })}
    </div>
  );
}