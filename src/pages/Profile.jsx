import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Dog, DogAchievement } from "@/api/entities";
import { isUserPremium } from "@/utils/premium";
import { useHomeCache } from "@/lib/HomeCacheContext";
import BottomNav from "../components/BottomNav";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BarChart2 } from "lucide-react";
import { toast } from "sonner";
import ProfileHeader from "../components/profile/ProfileHeader.jsx";
import DogSwitcher from "../components/profile/DogSwitcher.jsx";
import CoachSettings from "../components/profile/CoachSettings.jsx";
import VetSection from "../components/profile/VetSection.jsx";
import SubscriptionSection from "../components/profile/SubscriptionSection.jsx";
import SettingsSection from "../components/profile/SettingsSection.jsx";
import WalkReminderSettings from "../components/profile/WalkReminderSettings.jsx";
import AchievementsSection from "../components/profile/AchievementsSection.jsx";
import AchievementFeed from "../components/achievements/AchievementFeed.jsx";
import ChatFAB from "../components/ChatFAB";
import SkeletonPage from "@/components/ui/SkeletonPage";
import StorysetIllustration from "@/components/ui/StorysetIllustration";
import EmptyState from "@/components/ui/EmptyState";

export default function Profile() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { invalidateHome } = useHomeCache();
  const [user, setUser] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [activeDogId, setActiveDogId] = useState(() => localStorage.getItem("activeDogId") || null);
  const [loading, setLoading] = useState(true);
  const [achievementPoints, setAchievementPoints] = useState(null);

  const activeDog = dogs.find(d => d.id === activeDogId) || dogs[0];

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const d = await Dog.filter({ owner: u.email });
        setDogs(d || []);
        // Set active dog if not already set
        const firstDogId = activeDogId || d?.[0]?.id;
        if (!activeDogId && d?.length > 0) {
          setActiveDogId(d[0].id);
          localStorage.setItem("activeDogId", d[0].id);
        }
        // Load real achievement points from DogAchievement for the header
        if (firstDogId) {
          try {
            const achvs = await DogAchievement.filter({ dog_id: firstDogId });
            const pts = (achvs || []).reduce((s, a) => s + (a.points_awarded || 0), 0);
            setAchievementPoints(pts);
          } catch (_e) {
            setAchievementPoints(0);
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Impossible de charger le profil. Vérifie ta connexion.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reload points when active dog changes
  useEffect(() => {
    if (!activeDogId) return;
    DogAchievement
      .filter({ dog_id: activeDogId })
      .then(achvs => {
        const pts = (achvs || []).reduce((s, a) => s + (a.points_awarded || 0), 0);
        setAchievementPoints(pts);
      })
      .catch(() => {});
  }, [activeDogId]);

  const handleSwitchDog = (dogId) => {
    setActiveDogId(dogId);
    localStorage.setItem("activeDogId", dogId);
    // Invalidate Home cache so data reflects the new active dog immediately
    invalidateHome();
  };

  const handleAddDog = () => {
    if (!isUserPremium(user) && dogs.length >= 1) {
      navigate(createPageUrl("Premium") + "?from=profile");
    } else if (isUserPremium(user) && dogs.length >= 3) {
      toast.error("Tu as atteint la limite de 3 chiens.");
    } else {
      navigate(createPageUrl("Onboarding") + "?addDog=true");
    }
  };

  const handleSaveUser = async (updates) => {
    try {
      await base44.auth.updateMe(updates);
      setUser(prev => ({ ...prev, ...updates }));
    } catch (e) {
      console.error("Profile handleSaveUser error:", e);
      toast.error("Impossible de sauvegarder. Verifie ta connexion et reessaie.");
    }
  };

  if (loading) {
    return <SkeletonPage variant="detail" currentPage="Profile" />;
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.25, ease: "easeOut" },
    }),
  };

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader user={user} achievementPoints={achievementPoints} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="px-5 pt-4 space-y-5"
      >
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
          <DogSwitcher
            dogs={dogs}
            activeDogId={activeDogId}
            onSwitch={handleSwitchDog}
            onAdd={handleAddDog}
            isPremium={isUserPremium(user)}
          />
        </motion.div>

        {/* Welcome card */}
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
          <div className="bg-gradient-to-r from-blue-50 to-sky-50/50 rounded-3xl p-4 border border-blue-100/50 shadow-sm flex items-center gap-4">
            <StorysetIllustration name="community" className="w-24 h-24 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">Ton espace PawCoach</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Paramètres, vétérinaire, et suivi de ton compagnon</p>
            </div>
          </div>
        </motion.div>

        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
          <SubscriptionSection user={user} />
        </motion.div>

        {/* Premium card — hidden for existing premium users */}
        {!isUserPremium(user) && (
          <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
            <div className="bg-gradient-to-r from-amber-50 to-amber-50/50 rounded-3xl p-4 border border-amber-100/50 shadow-sm flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate(createPageUrl("Premium") + "?from=profile")}>
              <StorysetIllustration name="premium" className="w-24 h-24 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">Passe à Premium</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Accès illimité à toutes les fonctionnalités</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Achievement Feed — 5 derniers badges gagnés */}
        {dogs.length > 0 ? (
          <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="bg-white rounded-2xl border border-border shadow-sm px-4 py-3">
            <AchievementFeed dog={activeDog} />
          </motion.div>
        ) : (
          <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="bg-white rounded-2xl border border-border shadow-sm">
            <EmptyState
              mascot="trophy"
              title="Ajoute ton premier chien"
              description="Tes récompenses apparaîtront ici"
            />
          </motion.div>
        )}

        {/* Achievements — always visible, no accordion */}
        {dogs.length > 0 && (
          <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
            <AchievementsSection dog={activeDog} />
          </motion.div>
        )}

        {/* Lien vers le Dashboard statistiques */}
        {activeDog && (
          <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
            <Link
              to={createPageUrl("Dashboard")}
              className="flex items-center gap-3 w-full bg-white rounded-2xl border border-border shadow-sm px-4 py-3.5 hover:border-primary/40 transition-colors active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Voir les statistiques de {activeDog.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tableau de bord complet</p>
              </div>
              <span className="text-muted-foreground/50 text-lg leading-none">›</span>
            </Link>
          </motion.div>
        )}

        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible">
          <CoachSettings user={user} onSave={handleSaveUser} />
        </motion.div>

        <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible">
          <WalkReminderSettings user={user} onSave={handleSaveUser} dogName={activeDog?.name} />
        </motion.div>

        <motion.div custom={7} variants={sectionVariants} initial="hidden" animate="visible">
          <VetSection dogs={dogs} activeDogId={activeDogId} />
        </motion.div>

        <motion.div custom={8} variants={sectionVariants} initial="hidden" animate="visible">
          <SettingsSection />
        </motion.div>
      </motion.div>

      <ChatFAB />
      <BottomNav currentPage="Profile" />
    </div>
  );
}
