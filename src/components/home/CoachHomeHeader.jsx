import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationCenter from "../notifications/NotificationCenter";
import { PawPrint, Settings, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function CoachHomeHeader({ user, dog }) {
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Propriétaire";

  return (
    <header className="relative overflow-hidden">
      {/* Premium Gradient background */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-[#1A4D3E] px-5 safe-pt-12 pb-8">
        {/* Decorative elements */}
        <div className="absolute top-2 right-8 opacity-10">
          <PawPrint className="w-16 h-16 text-white rotate-[-20deg]" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Top row: greeting + actions */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex flex-col">
            <p className="text-[14px] text-white/90 font-medium">Bonjour {firstName} 👋</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <p className="text-[12px] text-white/70 font-medium italic">Une belle journée avec {dog?.name || "ton chien"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter transparent={true} />
            <button
              onClick={() => navigate(createPageUrl("Profile"))}
              className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-sm"
              aria-label="Paramètres">
              
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main row: dog info + photo */}
        <div className="flex items-center gap-4 relative z-10">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl("DogProfile"))}
            className="flex-shrink-0 relative group">
            
            <div className="absolute inset-0 bg-white/20 rounded-[1.25rem] blur-md group-hover:bg-white/30 transition-all" />
            {dog?.photo ?
            <img
              src={dog.photo}
              alt={dog?.name}
              className="w-[72px] h-[72px] rounded-[1.25rem] border-[3px] border-white/40 object-cover shadow-xl relative z-10" /> :


            <div className="w-[72px] h-[72px] rounded-[1.25rem] bg-white/10 border-[3px] border-white/30 flex items-center justify-center shadow-xl backdrop-blur-sm relative z-10">
                <span className="text-3xl">🐶</span>
              </div>
            }
          </motion.button>

          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] font-black text-white leading-tight drop-shadow-md">
              {dog?.name || "Mon chien"}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/90 border border-white/10 backdrop-blur-sm shadow-sm">
                {dog?.breed || "Compagnon"}
              </span>
              {dog?.weight &&
              <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/90 border border-white/10 backdrop-blur-sm shadow-sm">
                  {dog.weight} kg
                </span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Curved bottom */}
      
    </header>);

}