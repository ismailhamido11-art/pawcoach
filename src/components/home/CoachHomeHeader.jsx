import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationCenter from "../notifications/NotificationCenter";

import { Settings } from "lucide-react";

export default function CoachHomeHeader({ user, dog }) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 w-full z-50 px-6 py-5 bg-white/60 backdrop-blur-2xl border-b border-white/20">
      <div className="flex justify-between items-center w-full max-w-screen-xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => navigate(createPageUrl("DogProfile"))}
              className="w-12 h-12 organic-mask overflow-hidden bg-forest-green shadow-xl flex-shrink-0 active:scale-95 transition-transform"
            >
              {dog?.photo_url || dog?.photo ? (
                <img
                  src={dog.photo_url || dog.photo}
                  alt={dog.name}
                  className="w-full h-full object-cover scale-110"
                />
              ) : (
                <div className="w-full h-full bg-forest-green flex items-center justify-center">
                  <span className="text-xl">🐶</span>
                </div>
              )}
            </button>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-forest-green font-extrabold text-2xl tracking-tight leading-none">{dog?.name || "Mon chien"}</h1>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">
              {dog?.breed ? `${dog.breed} • ` : ""}{dog?.birth_date ? `${new Date().getFullYear() - new Date(dog.birth_date).getFullYear()} ans` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationCenter />
          <button 
            onClick={() => navigate(createPageUrl("Profile"))}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-forest-green transition-all active:scale-90"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}