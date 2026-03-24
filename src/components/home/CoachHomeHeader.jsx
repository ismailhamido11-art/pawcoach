import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationCenter from "../notifications/NotificationCenter";

export default function CoachHomeHeader({ user, dog }) {
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <header className="bg-gradient-to-b from-amber-50 to-background px-5 pt-3 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[13px] text-muted-foreground">Bonjour {firstName}</p>
          <h1 className="text-[22px] font-bold text-foreground leading-tight">
            {dog?.name || "Mon chien"} va bien
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <NotificationCenter />

          <button
            onClick={() => navigate(createPageUrl("DogProfile"))}
            className="active:scale-95 transition-transform"
          >
            {dog?.photo_url ? (
              <img
                src={dog.photo_url}
                alt={dog.name}
                className="w-[52px] h-[52px] rounded-full border-2 border-primary object-cover shadow-sm"
              />
            ) : (
              <div className="w-[52px] h-[52px] rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shadow-sm">
                <span className="text-2xl drop-shadow-sm">🐶</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}