import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, ScanLine, MessageCircle, Dumbbell, Stethoscope } from "lucide-react";

const tabs = [
  { label: "Accueil", icon: Home, page: "Home" },
  { label: "Scanner", icon: ScanLine, page: "Scan" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Vétos", icon: Stethoscope, page: "FindVet" },
  { label: "Dressage", icon: Dumbbell, page: "Training" },
];

export default function BottomNav({ currentPage }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bottom-nav bg-white border-t border-border shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ label, icon: Icon, page }) => {
          const active = currentPage === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl tap-scale transition-all duration-200 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  active ? "bg-secondary" : ""
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`}
                />
              </div>
              <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}