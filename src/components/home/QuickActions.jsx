import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Activity, Utensils, HeartPulse, ScanLine } from "lucide-react";

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { 
      id: "track", 
      label: "Lancer la\nbalade", 
      icon: Activity, 
      path: "Activite",
      colorClass: "text-secondary bg-secondary/10"
    },
    { 
      id: "food", 
      label: "Noter le\nrepas", 
      icon: Utensils, 
      path: "Nutri",
      colorClass: "text-orange-600 bg-orange-500/10"
    },
    { 
      id: "health", 
      label: "Suivi de\nsanté", 
      icon: HeartPulse, 
      path: "Sante",
      colorClass: "text-blue-600 bg-blue-500/10"
    },
    { 
      id: "scan", 
      label: "Scanner un\nproduit", 
      icon: ScanLine, 
      path: "Scan",
      colorClass: "text-premium-purple bg-premium-purple/10"
    },
  ];

  return (
    <section className="space-y-6 mt-8">
      <h3 className="font-extrabold text-2xl text-forest-green px-1">Actions Rapides</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(createPageUrl(action.path))}
            className="group relative bg-white hover:bg-emerald-50 transition-all p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-emerald-50/50 active:scale-95"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 action-icon-layered ${action.colorClass}`}>
              <action.icon className="w-8 h-8" />
            </div>
            <span className="text-forest-green font-extrabold text-sm text-center leading-tight whitespace-pre-line">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}