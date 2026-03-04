import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PremiumNudgeSheet from "../premium/PremiumNudgeSheet";
import Illustration from "../illustrations/Illustration";

export default function WelcomeScreen({ dogName, dogPhoto, onDiscover, isPremium }) {
  const [showNudge, setShowNudge] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralSaved, setReferralSaved] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  const handleReferralSubmit = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) return;
    try {
      await base44.auth.updateMe({ referred_by: code });
      setReferralSaved(true);
    } catch (e) {
      console.error(e);
    }
  };

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
            <img src={dogPhoto} alt={dogName} className="w-full h-full object-cover" />
          ) : (
            <Illustration name="goodDoggy" alt={dogName} className="w-full h-full object-cover" />
          )}
        </div>
        {/* Badge */}
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <span className="text-2xl">🎉</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-white text-4xl font-extrabold mb-3 leading-tight">
        Bienvenue,<br />{dogName} !
      </h1>
      <p className="text-white/80 text-base mb-2 leading-relaxed max-w-xs">
        Le profil de {dogName} est créé. PawCoach est prêt à t'accompagner au quotidien
      </p>
      <p className="text-white/60 text-sm mb-6">
        Alimentation · Bien-être · Dressage
      </p>

      {/* Referral code input */}
      {!showReferral ? (
        <button
          onClick={() => setShowReferral(true)}
          className="flex items-center gap-2 text-white/50 text-xs font-medium mb-8 hover:text-white/70 transition-colors"
        >
          <Gift className="w-3.5 h-3.5" />
          Tu as un code parrain ?
        </button>
      ) : (
        <div className="w-full max-w-xs mb-8">
          {referralSaved ? (
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-medium">
              <Check className="w-4 h-4" />
              Code enregistré !
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="CODE PARRAIN"
                maxLength={12}
                className="flex-1 h-11 rounded-xl bg-white/15 border border-white/20 text-white text-center text-sm font-bold tracking-wider placeholder:text-white/30 focus:outline-none focus:border-white/40"
              />
              <button
                onClick={handleReferralSubmit}
                disabled={!referralCode.trim()}
                className="h-11 px-4 rounded-xl bg-white/20 text-white font-semibold text-sm border border-white/20 disabled:opacity-30 hover:bg-white/30 transition-colors"
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}

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