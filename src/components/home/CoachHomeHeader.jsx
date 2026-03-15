import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CoachHomeHeader({ user, dog }) {
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <header className="bg-gradient-to-b from-[#FEF0E8] to-[#FAF6F1] px-5 pt-3 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-400">Bonjour {firstName}</p>
          <h1 className="text-[22px] font-bold text-[#1A4D3E] leading-tight truncate">
            {dog?.name || "Mon chien"} va bien
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate(createPageUrl("Notifications"))}
            className="w-9 h-9 rounded-full bg-white border border-[#E8E4DF] flex items-center justify-center active:scale-95 transition-transform"
          >
            <Bell className="w-[18px] h-[18px] text-gray-400" />
          </button>

          {dog?.photo_url ? (
            <img
              src={dog.photo_url}
              alt={dog.name}
              className="w-[52px] h-[52px] rounded-full border-[2.5px] border-[#2D9F82] object-cover"
            />
          ) : (
            <div className="w-[52px] h-[52px] rounded-full bg-[#E8F5F0] border-[2.5px] border-[#2D9F82] flex items-center justify-center">
              <span className="text-xl">🐕</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
