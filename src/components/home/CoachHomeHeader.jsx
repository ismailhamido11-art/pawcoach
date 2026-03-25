import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationCenter from "../notifications/NotificationCenter";

export default function CoachHomeHeader({ user, dog }) {
  const navigate = useNavigate();

  return (
    <header className="relative bg-[#00382b] rounded-b-[40px] pt-14 pb-8 px-6 text-white z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(createPageUrl("DogProfile"))}
            className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden flex-shrink-0 active:scale-95 transition-transform"
          >
            {dog?.photo_url || dog?.photo ? (
              <img
                src={dog.photo_url || dog.photo}
                alt={dog.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <span className="text-xl">🐶</span>
              </div>
            )}
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">{dog?.name || "Mon chien"}</h1>
            <p className="text-white/80 text-sm">Bon retour parmi nous !</p>
          </div>
        </div>
        <NotificationCenter />
      </div>
    </header>
  );
}