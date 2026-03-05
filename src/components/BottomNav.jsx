import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Heart, Activity, Utensils, User } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

const tabs = [
  { label: "Accueil",    icon: Home,     page: "Home" },
  { label: "Santé",      icon: Heart,    page: "Sante" },
  { label: "Activité",   icon: Activity, page: "Activite" },
  { label: "Nutrition",  icon: Utensils, page: "Nutri" },
  { label: "Profil",     icon: User,     page: "Profile" },
];

export default function BottomNav({ currentPage }) {
  const navigate = useNavigate();

  const handleTabClick = (e, page) => {
    // Save current scroll position before leaving
    sessionStorage.setItem(`scroll_${currentPage}`, window.scrollY);

    if (currentPage === page) {
      e.preventDefault();
      // Active tab: reset to root (clear saved scroll/subtab)
      sessionStorage.removeItem(`scroll_${page}`);
      sessionStorage.removeItem(`subtab_${page}`);
      navigate(createPageUrl(page), { replace: true });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bottom-nav bg-gradient-to-t from-white via-white/95 to-white/90 backdrop-blur-xl border-t border-border shadow-2xl">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ label, icon: Icon, page }) => {
          const active = currentPage === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              onClick={(e) => handleTabClick(e, page)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
                active ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <motion.div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  active ? "bg-gradient-to-br from-secondary to-secondary/70 shadow-md" : "hover:bg-secondary/40"
                }`}
                whileHover={{ scale: active ? 1 : 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              </motion.div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-1.5 w-6 h-1 rounded-full bg-gradient-to-r from-primary to-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}