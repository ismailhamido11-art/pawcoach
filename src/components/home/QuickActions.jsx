import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin } from "lucide-react";
import { DogDoctor, DogChef, DogGrad, DogDetective } from "../ui/PawIllustrations";

const ACTIONS = [
  {
    page: "Notebook",
    Illustration: DogDoctor,
    label: "Carnet santé",
    sub: "Vaccins, poids, visites",
    bg: "bg-rose-50",
    iconColor: "#f43f5e",
  },
  {
    page: "Nutrition",
    Illustration: DogChef,
    label: "NutriCoach",
    sub: "Nutrition & repas IA",
    bg: "bg-emerald-50",
    iconColor: "#10b981",
  },
  {
    page: "Training",
    Illustration: DogGrad,
    label: "Dressage",
    sub: "Exercices guidés",
    bg: "bg-violet-50",
    iconColor: "#8b5cf6",
  },
  {
    page: "FindVet",
    icon: MapPin,
    label: "Trouver un véto",
    sub: "Cliniques proches",
    bg: "bg-blue-50",
    iconColor: "#3b82f6",
  },
];

const stagger = { show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

export default function QuickActions() {
  return (
    <div className="mx-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
        Accès rapide
      </p>
      <motion.div className="grid grid-cols-2 gap-3" variants={stagger} initial="hidden" animate="show">
        {ACTIONS.map(({ page, Illustration, icon: Icon, label, sub, bg, iconColor }) => (
          <motion.div key={page} variants={item} whileTap={{ scale: 0.96 }}>
            <Link
              to={createPageUrl(page)}
              className={`flex flex-col gap-2 p-4 rounded-2xl ${bg} border border-white/60 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="w-12 h-12">
                {Illustration ? (
                  <Illustration color={iconColor} />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${iconColor}18` }}
                  >
                    <Icon style={{ color: iconColor, width: 20, height: 20 }} strokeWidth={2} />
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}