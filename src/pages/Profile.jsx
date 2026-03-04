import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
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
import ChatFAB from "../components/ChatFAB";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [activeDogId, setActiveDogId] = useState(() => localStorage.getItem("activeDogId") || null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-background pb-24">
        <div className="gradient-primary pt-16 pb-8 px-5">
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

        <CoachSettings user={user} onSave={handleSaveUser} />

        <WalkReminderSettings user={user} onSave={handleSaveUser} />

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