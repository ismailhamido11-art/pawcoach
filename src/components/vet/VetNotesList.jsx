import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, Lightbulb, Pill, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORY_CONFIG = {
  observation: { label: "Observation", icon: Eye, color: "bg-blue-50 text-blue-700" },
  recommendation: { label: "Recommandation", icon: Lightbulb, color: "bg-green-50 text-green-700" },
  prescription: { label: "Prescription", icon: Pill, color: "bg-purple-50 text-purple-700" },
  follow_up: { label: "Suivi", icon: CalendarCheck, color: "bg-emerald-50 text-emerald-700" },
};

export default function VetNotesList({ notes }) {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Aucune note vétérinaire</p>
      </div>
    );
  }

  const sorted = [...notes].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-3">
      {sorted.map(note => {
        const config = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.observation;
        const Icon = config.icon;
        return (
          <div key={note.id} className={`p-4 rounded-xl border ${note.is_urgent ? "border-red-300 bg-red-50/50" : "border-border bg-white"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className={`${config.color} text-[10px]`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
                {note.is_urgent && (
                  <Badge className="bg-red-100 text-red-700 text-[10px]">
                    <AlertTriangle className="w-3 h-3 mr-1" />Urgent
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {note.created_date ? format(new Date(note.created_date), "d MMM yyyy", { locale: fr }) : ""}
              </span>
            </div>
            <h4 className="font-semibold text-sm mt-2">{note.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{note.content}</p>
            <p className="text-[10px] text-muted-foreground mt-2">— Dr. {note.vet_name || note.vet_email}</p>
          </div>
        );
      })}
    </div>
  );
}