import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle, Siren, ClipboardList } from "lucide-react";

const URGENCY_CONFIG = {
  low: { label: "Faible", color: "bg-green-100 text-green-800", icon: CheckCircle },
  medium: { label: "Modéré", color: "bg-emerald-100 text-emerald-800", icon: AlertTriangle },
  high: { label: "Élevé", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
  emergency: { label: "Urgence", color: "bg-red-100 text-red-800", icon: Siren },
};

export default function DiagnosisStep2Questions({ phase1, userAnswers, setUserAnswers, onSubmit, dogName }) {
  const urgency = URGENCY_CONFIG[phase1.preliminary_urgency] || URGENCY_CONFIG.medium;
  const UrgencyIcon = urgency.icon;

  const questions = Array.isArray(phase1.followup_questions) ? phase1.followup_questions : [];
  const answeredCount = questions.filter(q => userAnswers[q.id]?.trim()).length;
  const totalCount = questions.length;

  const handleAnswer = (id, value) => {
    setUserAnswers(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-4 mt-2">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">✓</div>
          <span className="text-xs text-green-700">Symptômes</span>
        </div>
        <div className="flex-1 h-px bg-green-300" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</div>
          <span className="text-xs font-medium text-primary">Questions</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">3</div>
          <span className="text-xs text-muted-foreground">Rapport</span>
        </div>
      </div>

      {/* Preliminary urgency */}
      <div className={`flex items-center gap-2 p-3 rounded-xl ${urgency.color}`}>
        <UrgencyIcon className="w-4 h-4 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold">Première estimation : {urgency.label}</p>
          <p className="text-[10px] mt-0.5">{phase1.preliminary_observations}</p>
        </div>
      </div>

      {/* Questions header */}
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Questions complémentaires</h3>
        <Badge variant="outline" className="text-[10px] ml-auto">{answeredCount}/{totalCount}</Badge>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-2">
        Reponds a ces questions pour obtenir un diagnostic plus precis pour {dogName || "ton chien"}.
      </p>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="space-y-1.5">
            <label className="text-xs font-medium flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              {q.question}
            </label>

            {q.type === "yes_no" && (
              <div className="flex gap-2 ml-7">
                {["Oui", "Non"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                      userAnswers[q.id] === opt
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-border hover:border-primary/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === "choice" && q.options && (
              <div className="flex flex-wrap gap-2 ml-7">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      userAnswers[q.id] === opt
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-border hover:border-primary/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === "text" && (
              <div className="ml-7">
                <Textarea
                  value={userAnswers[q.id] || ""}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="Ta réponse..."
                  className="min-h-[60px] text-xs"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={answeredCount === 0}
        className="w-full gradient-primary text-white"
      >
        Obtenir le rapport complet
      </Button>
    </div>
  );
}