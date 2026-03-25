import { Lightbulb } from "lucide-react";

export default function BriefingCard({ dog }) {
  return (
    <div className="bg-tertiary-container/10 border border-tertiary-container/20 rounded-3xl p-5 flex items-start gap-4">
      <div className="bg-tertiary-container text-white p-2 rounded-full shrink-0">
        <Lightbulb className="w-5 h-5" fill="currentColor" />
      </div>
      <div>
        <h3 className="font-bold text-tertiary mb-1">Briefing du jour</h3>
        <p className="text-on-surface-variant text-sm leading-[1.6]">
          Bonne nouvelle ! {dog?.name || "Ton chien"} a atteint ses objectifs d'activité hier. Aujourd'hui, on se concentre sur l'hydratation.
        </p>
      </div>
    </div>
  );
}