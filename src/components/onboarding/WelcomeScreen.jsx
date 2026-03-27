import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, PartyPopper } from "lucide-react";
import PremiumNudgeSheet from "../premium/PremiumNudgeSheet";
import Illustration from "../illustrations/Illustration";

export default function WelcomeScreen({ dogName, dogPhoto, onDiscover, isPremium }) {
  const [showNudge, setShowNudge] = useState(false);

  return (
    <div className="min-h-screen gradient-primary flex flex-col items-center justify-center px-6 text-center">
      {/* Confetti-like decorative dots */}
      <div className="absolute top-10 left-8 w-3 h-3 rounded-full bg-white/30" />
      <div className="absolute top-20 right-10 w-2 h-2 rounded-full bg-white/20" />
      <div className="absolute top-36 left-16 w-1.5 h-1.5 rounded-full bg-white/25" />

      {/* Dog photo */}
      <div className="relative mb-8">
        <div className="w-36 h-36 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white/20">
          {dogPhoto ? (
            <img src={dogPhoto} alt={dogName} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <Illustration name="goodDoggy" alt={dogName} className="w-full h-full object-cover" />
          )}
        </div>
        {/* Badge */}
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <PartyPopper className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-white text-4xl font-extrabold mb-3 leading-tight">
        Bienvenue,<br />{dogName} !
      </h1>
      <p className="text-white/80 text-base mb-2 leading-relaxed max-w-xs">
        Le profil de {dogName} est créé. PawCoach est prêt à t'accompagner au quotidien
      </p>
      <p className="text-white/60 text-sm mb-4">
        Alimentation · Bien-être · Dressage
      </p>

      {/* Trial badge */}
      <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-3 mb-6 text-center max-w-xs">
        <p className="text-white font-bold text-sm">Ton essai Premium démarre maintenant</p>
        <p className="text-white/70 text-xs mt-1">7 jours gratuits · Toutes les fonctionnalités débloquées</p>
      </div>

      {/* CTA */}
      <Button
        onClick={() => {
          if (!isPremium) {
            setShowNudge(true);
          } else {
            onDiscover();
          }
        }}
        className="w-full max-w-xs h-14 rounded-2xl bg-white text-primary font-bold text-base shadow-xl gap-2 hover:bg-white/90 border-0"
      >
        <Sparkles className="w-5 h-5" />
        Découvrir PawCoach
      </Button>

      {/* Bottom waves decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
        <div className="w-full h-full bg-white rounded-t-[80px]" />
      </div>

      <PremiumNudgeSheet
        visible={showNudge}
        onClose={() => { setShowNudge(false); onDiscover(); }}
        dogName={dogName}
      />
    </div>
  );
}