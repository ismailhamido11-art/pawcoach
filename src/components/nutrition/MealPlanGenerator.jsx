import { Button } from "@/components/ui/button";
import { Loader2, Check, Home, AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";
import { UpgradePrompt } from "@/components/ui/AICreditsGate";
import EmptyState from "@/components/ui/EmptyState";

const MONTHLY_FREE_LIMIT = 2;

/**
 * MealPlanGenerator — extracted from NutritionMealPlan.jsx renderGenerator()
 *
 * Props:
 * - activeData: parsed plan data | null (is there an active plan?)
 * - activePlan: raw plan entity | null
 * - showGenerator: boolean
 * - plan: newly generated plan | null
 * - loading: boolean
 * - saving: boolean
 * - saved: boolean
 * - dog: object
 * - checkins: array
 * - healthRecords: array
 * - dietPrefs: object | null
 * - dailyLogs: array
 * - generationNotes: string
 * - monthlyPlanCount: number
 * - isMonthlyLimitReached: boolean
 * - isPremium: boolean
 * - hasCredits: boolean
 * - onGenerate: () => void
 * - onSavePlan: () => void
 * - onSetPlan: (plan) => void
 * - onSetGenerationNotes: (notes: string) => void
 */
export default function MealPlanGenerator({
  activeData,
  activePlan,
  showGenerator,
  plan,
  loading,
  saving,
  saved,
  dog,
  checkins,
  healthRecords,
  dietPrefs,
  dailyLogs,
  generationNotes,
  monthlyPlanCount,
  isMonthlyLimitReached,
  isPremium,
  hasCredits,
  onGenerate,
  onSavePlan,
  onSetPlan,
  onSetGenerationNotes,
}) {
  // If there's an active plan and generator not explicitly opened, don't show
  if (activeData && !showGenerator && !plan) return null;

  return (
    <div className="space-y-4">
      {!plan && !loading && (
        <div className={`bg-white rounded-2xl border border-border p-5 space-y-4 ${activeData ? "" : "text-center"}`}>
          {!activeData && (
            <EmptyState
              mascot="chef"
              title={`Pas encore de plan pour ${dog.name}`}
              description="Genere un plan repas personnalise 7 jours avec quantites precises, adapte a son profil et son activite."
              className="py-4"
            />
          )}

          {/* Data richness badges */}
          {(checkins.length > 0 || healthRecords.length > 0 || dietPrefs) && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {checkins.length > 0 && <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Check-ins integres</span>}
              {healthRecords.length > 0 && <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Sante integree</span>}
              {dietPrefs && <span className="text-[11px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">Preferences integrees</span>}
              {dailyLogs.length > 0 && <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Activite integree</span>}
            </div>
          )}

          {/* Notes for AI before generating */}
          <div>
            <p className="text-xs font-medium text-foreground mb-1.5 text-left">Instructions speciales (optionnel)</p>
            <textarea
              value={generationNotes}
              onChange={e => onSetGenerationNotes(e.target.value)}
              placeholder={`Ex : ${dog.name} mange trop vite, plus de legumes, eviter les sous-produits...`}
              className="w-full text-sm rounded-xl border border-border p-3 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {isMonthlyLimitReached ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-800">Limite atteinte</p>
              </div>
              <p className="text-xs text-amber-700">Tu as utilise tes {MONTHLY_FREE_LIMIT} generations gratuites ce mois-ci. Passe en Premium pour des plans illimites.</p>
              <UpgradePrompt type="action" from="nutrition-plan-monthly" />
            </div>
          ) : !isPremium && !hasCredits ? (
            <UpgradePrompt type="action" from="nutrition-plan" />
          ) : (
            <>
              {!isPremium && (
                <p className="text-xs text-muted-foreground text-center">
                  {MONTHLY_FREE_LIMIT - monthlyPlanCount} generation{MONTHLY_FREE_LIMIT - monthlyPlanCount !== 1 ? "s" : ""} restante{MONTHLY_FREE_LIMIT - monthlyPlanCount !== 1 ? "s" : ""} ce mois
                </p>
              )}
              <Button onClick={onGenerate} className="w-full bg-safe hover:bg-safe/90 text-white font-bold h-14 rounded-2xl shadow-lg shadow-safe/30">
                {activePlan ? "Regenerer un nouveau plan" : "Generer mon plan de repas"}
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
                ? "Integration des donnees sante, activite et preferences"
                : "Creation du plan personnalise"}
            </p>
          </div>
        </div>
      )}

      {plan && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white">
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">Nouveau plan pour {dog.name}</p>
            <div className="flex gap-3 mt-2">
              {plan.calories_per_day && (
                <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  {plan.calories_per_day} kcal/jour
                </span>
              )}
              {plan.quantity_summary && (
                <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
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
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">Matin</span>
                      <div className="flex-1">
                        <p className="text-xs text-foreground">{d.morning.food}</p>
                        <p className="text-[11px] text-muted-foreground">{d.morning.quantity}</p>
                      </div>
                    </div>
                  )}
                  {d.noon && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">Midi</span>
                      <div className="flex-1">
                        <p className="text-xs text-foreground">{d.noon.food}</p>
                        <p className="text-[11px] text-muted-foreground">{d.noon.quantity}</p>
                      </div>
                    </div>
                  )}
                  {d.evening && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">Soir</span>
                      <div className="flex-1">
                        <p className="text-xs text-foreground">{d.evening.food}</p>
                        <p className="text-[11px] text-muted-foreground">{d.evening.quantity}</p>
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
              <p className="text-xs font-bold text-foreground mb-2">Complements</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.supplements.map((s, i) => (
                  <span key={i} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {plan.avoid?.length > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
              <p className="text-xs font-bold text-red-700 mb-2">A eviter</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.avoid.map((a, i) => (
                  <span key={i} className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {plan.tip && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
              <p className="text-xs text-amber-800">{plan.tip}</p>
            </div>
          )}

          {/* Rationale */}
          {plan.rationale?.length > 0 && (
            <div className="bg-primary/5 rounded-2xl border border-primary/15 p-4">
              <p className="text-xs font-bold text-primary mb-2">Pourquoi ce plan pour {dog.name} ?</p>
              <div className="space-y-1.5">
                {plan.rationale.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[11px] text-primary mt-0.5 font-bold">{i + 1}.</span>
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
                onClick={onSavePlan}
                disabled={saving || saved}
                className={`w-full h-14 rounded-2xl font-semibold gap-2 transition-all duration-300 ${
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
              onClick={() => onSetPlan(null)}
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
}
