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
    <nav aria-label="Navigation principale" className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg flex justify-between items-center px-4 py-3 bg-black/90 backdrop-blur-3xl rounded-[2.5rem] z-50 shadow-2xl border border-white/10">
      {tabs.map(({ label, icon: Icon, page }) => {
        const active = currentPage === page;
        return (
          <Link
            key={page}
            to={getNavUrl(page)}
            onClick={(e) => handleTabClick(e, page)}
            className={`relative flex flex-col items-center justify-center h-14 w-14 transition-all duration-300 ${
              active 
                ? "bg-white text-forest-green rounded-[1.8rem] scale-105" 
                : "text-white/50 hover:text-white"
            }`}
          >
            <motion.div
              whileHover={{ scale: active ? 1 : 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center"
            >
              <Icon className={`w-6 h-6 ${active ? "fill-current" : ""}`} />
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}