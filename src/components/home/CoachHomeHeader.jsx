import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationCenter from "../notifications/NotificationCenter";
import { PawPrint } from "lucide-react";

export default function CoachHomeHeader({ user, dog }) {
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <header className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-emerald-700 px-5 pt-4 pb-6">
        {/* Decorative paw prints */}
        <div className="absolute top-2 right-8 opacity-10">
          <PawPrint className="w-16 h-16 text-white rotate-[-20deg]" />
        </div>
        <div className="absolute bottom-3 left-6 opacity-[0.07]">
          <PawPrint className="w-12 h-12 text-white rotate-[15deg]" />
        </div>

        {/* Top row: greeting + notifications */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <p className="text-[13px] text-white/70 font-medium">Bonjour {firstName} 👋</p>
          <NotificationCenter />
        </div>

        {/* Main row: dog info + photo */}
        <div className="flex items-center gap-4 relative z-10">
          <button
            onClick={() => navigate(createPageUrl("DogProfile"))}
            className="active:scale-95 transition-transform flex-shrink-0"
          >
            {dog?.photo_url ? (
              <img
                src={dog.photo_url}
                alt={dog.name}
                className="w-[64px] h-[64px] rounded-2xl border-[3px] border-white/30 object-cover shadow-lg"
              />
            ) : (
              <div className="w-[64px] h-[64px] rounded-2xl bg-white/15 border-[3px] border-white/30 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <span className="text-3xl">🐶</span>
              </div>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-black text-white leading-tight">
              {dog?.name || "Mon chien"}
            </h1>
            <p className="text-[13px] text-white/60 mt-0.5">
              {dog?.breed || "Compagnon"} · {dog?.weight ? `${dog.weight} kg` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Curved bottom */}
      <div className="h-4 bg-gradient-to-br from-primary via-primary/95 to-emerald-700 rounded-b-[24px]" />
    </header>
  );
}
