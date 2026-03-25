import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ScanLine, Route, Dumbbell, SquarePen } from "lucide-react";

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { id: "scan", label: "Scan", icon: ScanLine, path: "Scan" },
    { id: "track", label: "Track", icon: Route, path: "Activite" },
    { id: "train", label: "Train", icon: Dumbbell, path: "Training" },
    { id: "log", label: "Log", icon: SquarePen, path: "Sante" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => navigate(createPageUrl(action.path))}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-14 h-14 bg-surface-container-lowest rounded-2xl shadow-sm flex items-center justify-center text-[#00382b] group-hover:bg-[#00382b] group-hover:text-white transition-all duration-300 active:scale-95">
            <action.icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-on-surface">{action.label}</span>
        </button>
      ))}
    </div>
  );
}