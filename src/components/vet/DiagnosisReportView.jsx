import { AlertTriangle, CheckCircle, AlertCircle, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const URGENCY_CONFIG = {
  low: { label: "Faible", color: "bg-green-100 text-green-800", icon: CheckCircle },
  medium: { label: "Modéré", color: "bg-amber-100 text-amber-800", icon: AlertTriangle },
  high: { label: "Élevé", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  emergency: { label: "Urgence", color: "bg-red-100 text-red-800", icon: Siren },
};

export default function DiagnosisReportView({ report, dogName, reportDate }) {
  if (!report) return null;

  const urgency = URGENCY_CONFIG[report.urgency_level] || URGENCY_CONFIG.medium;
  const UrgencyIcon = urgency.icon;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          Rapport pour {dogName || "votre chien"}
        </h3>
        <span className="text-[10px] text-muted-foreground">{reportDate}</span>
      </div>

      {/* Urgency */}
      <div className={`flex items-center gap-2 p-3 rounded-xl ${urgency.color}`}>
        <UrgencyIcon className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold">Urgence : {urgency.label}</p>
          <p className="text-xs mt-0.5">{report.urgency_explanation}</p>
        </div>
      </div>

      {/* Observations */}
      {report.observations && (
        <Section title="Observations cliniques">
          <p className="text-xs text-muted-foreground">{report.observations}</p>
        </Section>
      )}

      {/* Possible causes */}
      {report.possible_causes?.length > 0 && (
        <Section title="Pistes diagnostiques">
          <ol className="space-y-1">
            {report.possible_causes.map((cause, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <Badge variant="outline" className="text-[9px] px-1.5 flex-shrink-0">{i + 1}</Badge>
                {cause}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Immediate advice */}
      {report.immediate_advice?.length > 0 && (
        <Section title="Conseils immédiats">
          <ul className="space-y-1">
            {report.immediate_advice.map((advice, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {advice}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Vet questions */}
      {report.vet_questions?.length > 0 && (
        <Section title="Questions à préparer pour le véto">
          <ul className="space-y-1">
            {report.vet_questions.map((q, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {q}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Important note */}
      {report.important_note && (
        <div className="p-2 bg-muted rounded-lg">
          <p className="text-[10px] text-muted-foreground italic">{report.important_note}</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      {children}
    </div>
  );
}