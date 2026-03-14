import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
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
import ReferralSection from "../components/profile/ReferralSection.jsx";
import SettingsSection from "../components/profile/SettingsSection.jsx";
import WalkReminderSettings from "../components/profile/WalkReminderSettings.jsx";
import AchievementsSection from "../components/profile/AchievementsSection.jsx";
import AchievementFeed from "../components/achievements/AchievementFeed.jsx";
import ChatFAB from "../components/ChatFAB";

export default function Profile() {
  const navigate = useNavigate();
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
        const d = await base44.entities.Dog.filter({ owner: u.email });
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
            const achvs = await base44.entities.DogAchievement.filter({ dog_id: firstDogId });
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
    base44.entities.DogAchievement
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
  };

  const handleAddDog = () => {
    if (!isUserPremium(user) && dogs.length >= 1) {
      navigate(createPageUrl("Premium") + "?from=profile");
    } else if (isUserPremium(user) && dogs.length >= 3) {
      return;
    } else {
      navigate(createPageUrl("Onboarding") + "?addDog=true");
    }
  };

  const handleSaveUser = async (updates) => {
    await base44.auth.updateMe(updates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="gradient-primary safe-pt-16 pb-8 px-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
              <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-5 pt-5 space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
        </div>
        <BottomNav currentPage="Profile" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <ProfileHeader user={user} achievementPoints={achievementPoints} />

      <div className="px-4 pt-4 space-y-4">
        <DogSwitcher
          dogs={dogs}
          activeDogId={activeDogId}
          onSwitch={handleSwitchDog}
          onAdd={handleAddDog}
          isPremium={isUserPremium(user)}
        />

        <SubscriptionSection user={user} />

        {/* Achievement Feed — 5 derniers badges gagnés */}
        {dogs.length > 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-sm px-4 py-3">
            <AchievementFeed dog={activeDog} />
          </div>
        )}

        {/* Achievements — always visible, no accordion */}
        {dogs.length > 0 && (
          <AchievementsSection dog={activeDog} />
        )}

        {/* Lien vers le Dashboard statistiques */}
        {activeDog && (
          <Link
            to={createPageUrl("Dashboard")}
            className="flex items-center gap-3 w-full bg-white rounded-2xl border border-border shadow-sm px-4 py-3.5 hover:border-primary/40 transition-colors"
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
        )}

        <CoachSettings user={user} onSave={handleSaveUser} />

        <WalkReminderSettings user={user} onSave={handleSaveUser} dogName={activeDog?.name} />

        <VetSection dogs={dogs} activeDogId={activeDogId} />

        <ReferralSection user={user} onSave={handleSaveUser} />

        <SettingsSection />
      </div>

      <ChatFAB />
      <BottomNav currentPage="Profile" />
    </div>
  );
}
