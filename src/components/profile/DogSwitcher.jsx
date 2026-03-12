import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, ChevronRight, PawPrint, Dog } from "lucide-react";
import { motion } from "framer-motion";

export default function DogSwitcher({ dogs, activeDogId, onSwitch, onAdd, isPremium }) {
  const navigate = useNavigate();
  const maxDogs = isPremium ? 3 : 1;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dog className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Mes chiens</span>
        </div>
        <span className="text-xs text-muted-foreground">{dogs.length}/{maxDogs}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 py-4 pb-4">
        {dogs.map(dog => {
          const isActive = dog.id === activeDogId;
          return (
            <div key={dog.id} className="flex-shrink-0 flex flex-col items-center gap-2 relative">
              {/* Tap to switch */}
              <motion.button
                aria-label={`Sélectionner ${dog.name}`}
                whileTap={{ scale: 0.94 }}
                onClick={() => onSwitch(dog.id)}
                className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${
                  isActive ? "border-primary shadow-md shadow-primary/20" : "border-border"
                } bg-muted flex items-center justify-center`}
              >
                {dog.photo ? (
                  <img src={dog.photo} alt={dog.name} className="w-full h-full object-cover" />
                ) : (
                  <PawPrint className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                )}
              </motion.button>

              {/* Active dot */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}

              <p className={`text-xs font-semibold truncate max-w-[60px] text-center ${isActive ? "text-primary" : "text-foreground"}`}>
                {dog.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[60px] text-center -mt-1">{dog.breed}</p>

              {/* Arrow to DogProfile */}
              <button
                onClick={() => navigate(createPageUrl("DogProfile") + `?dogId=${dog.id}`)}
                className="flex items-center gap-0.5 text-[10px] text-primary font-semibold"
              >
                Profil <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add dog */}
        {dogs.length < maxDogs && (
          <motion.button
            aria-label="Ajouter un chien"
            whileTap={{ scale: 0.94 }}
            onClick={onAdd}
            className="flex-shrink-0 flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5">
              <Plus className="w-6 h-6 text-primary/60" />
            </div>
            <p className="text-xs font-semibold text-primary/70">Ajouter</p>
          </motion.button>
        )}

        {dogs.length >= maxDogs && !isPremium && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onAdd}
            className="flex-shrink-0 flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-accent/40 flex items-center justify-center bg-accent/5">
              <Plus className="w-6 h-6 text-accent/60" />
            </div>
            <p className="text-xs font-semibold text-accent/70">Premium</p>
          </motion.button>
        )}
      </div>
    </div>
  );
}