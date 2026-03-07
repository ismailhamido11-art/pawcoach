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

// Pages with independent navigation stacks
const STACK_PAGES = ["Sante", "Activite", "Nutri"];

// Build nav URL — include saved sub-tab for stack pages
function getNavUrl(page) {
  const base = createPageUrl(page);
  if (STACK_PAGES.includes(page)) {
    const saved = sessionStorage.getItem(`tab_${page}`);
    if (saved) return `${base}?tab=${saved}`;
  }
  return base;
}

export default function BottomNav({ currentPage }) {
  const navigate = useNavigate();

  // Restore scroll position when the page mounts
  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll_${currentPage}`);
    if (saved) {
      requestAnimationFrame(() => window.scrollTo({ top: parseInt(saved, 10), behavior: "instant" }));
    }
  }, [currentPage]);

  const handleTabClick = (e, page) => {
    // Save current scroll position before leaving
    sessionStorage.setItem(`scroll_${currentPage}`, window.scrollY);

    if (currentPage === page) {
      e.preventDefault();
      // Active tab double-tap: reset to root page and clear stack state
      sessionStorage.removeItem(`scroll_${page}`);
      sessionStorage.removeItem(`tab_${page}`);
      sessionStorage.removeItem(`journey_${page}`);
      sessionStorage.removeItem(`exercise_${page}`);
      // Navigate to clean URL (removes ?tab query param, resets to default sub-tab)
      navigate(createPageUrl(page), { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-40 bottom-nav bg-background border-t border-border shadow-2xl">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ label, icon: Icon, page }) => {
          const active = currentPage === page;
          return (
            <Link
              key={page}
              to={getNavUrl(page)}
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