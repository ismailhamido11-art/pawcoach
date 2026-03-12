import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import BottomNav from "../components/BottomNav";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import ProfileHeader from "../components/profile/ProfileHeader.jsx";
import DogSwitcher from "../components/profile/DogSwitcher.jsx";
import CoachSettings from "../components/profile/CoachSettings.jsx";
import VetSection from "../components/profile/VetSection.jsx";
import SubscriptionSection from "../components/profile/SubscriptionSection.jsx";
import ReferralSection from "../components/profile/ReferralSection.jsx";
import SettingsSection from "../components/profile/SettingsSection.jsx";
import WalkReminderSettings from "../components/profile/WalkReminderSettings.jsx";
import AchievementsSection from "../components/profile/AchievementsSection.jsx";
import ChatFAB from "../components/ChatFAB";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [activeDogId, setActiveDogId] = useState(() => localStorage.getItem("activeDogId") || null);
  const [loading, setLoading] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const d = await base44.entities.Dog.filter({ owner: u.email });
        setDogs(d || []);
        // Set active dog if not already set
        if (!activeDogId && d?.length > 0) {
          setActiveDogId(d[0].id);
          localStorage.setItem("activeDogId", d[0].id);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
      <ProfileHeader user={user} />

      <div className="px-4 pt-4 space-y-4">
        <DogSwitcher
          dogs={dogs}
          activeDogId={activeDogId}
          onSwitch={handleSwitchDog}
          onAdd={handleAddDog}
          isPremium={isUserPremium(user)}
        />

        {/* Achievements Section */}
        {dogs.length > 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <button
              onClick={() => setShowAchievements(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg">🏆</div>
                <div className="text-left">
                  <p className="font-bold text-sm text-foreground">Succès & Badges</p>
                  <p className="text-xs text-muted-foreground">Points, niveaux et récompenses</p>
                </div>
              </div>
              <motion.div animate={{ rotate: showAchievements ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </button>
            {showAchievements && (
              <div className="px-4 pb-4 border-t border-border pt-3">
                <AchievementsSection dog={dogs.find(d => d.id === activeDogId) || dogs[0]} />
              </div>
            )}
          </div>
        )}

        <CoachSettings user={user} onSave={handleSaveUser} />

        <WalkReminderSettings user={user} onSave={handleSaveUser} dogName={(dogs.find(d => d.id === activeDogId) || dogs[0])?.name} />

        <VetSection dogs={dogs} activeDogId={activeDogId} />

        <SubscriptionSection user={user} />

        <ReferralSection user={user} onSave={handleSaveUser} />

        <SettingsSection />
      </div>

      <ChatFAB />
      <BottomNav currentPage="Profile" />
    </div>
  );
}