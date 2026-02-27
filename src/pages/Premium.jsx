import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Crown, Zap, Lock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BottomNav from "../components/BottomNav";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

const MONTHLY_PRICE_ID = "price_1T4tkFDuhaIxY4PGpnhDTx5L";
const ANNUAL_PRICE_ID = "price_1T4tkFDuhaIxY4PGWLeWApDL";

const FEATURES = [
  { text: "Chat IA illimité avec PawCoach", premium: true, free: false },
  { text: "Scans alimentaires illimités", premium: true, free: "3/semaine" },
  { text: "Tous les exercices de dressage (10)", premium: true, free: "3 exercices" },
  { text: "Carnet santé complet (visites, médicaments, notes)", premium: true, free: false },
  { text: "Rappels de santé par email", premium: true, free: false },
  { text: "Résumés mensuels bien-être", premium: true, free: false },
  { text: "Jusqu'à 3 profils de chiens", premium: true, free: "1 chien" },
];

const PREMIUM_FEATURES = [
  { text: "Chat IA illimité", emoji: "💬" },
  { text: "Scans illimités", emoji: "🔍" },
  { text: "10 exercices dressage", emoji: "🎯" },
  { text: "Carnet santé complet", emoji: "📋" },
  { text: "Rappels santé email", emoji: "🔔" },
  { text: "Résumés mensuels", emoji: "📊" },
  { text: "Jusqu'à 3 chiens", emoji: "🐕" },
];

export default function Premium() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [plan, setPlan] = useState("annual");
  const [loading, setLoading] = useState(false);
  const confettiFired = useRef(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs.length > 0) setDog(dogs[0]);

      if (u.is_premium && !u.premium_welcome_seen) {
        setIsFirstVisit(true);
        await base44.auth.updateMe({ premium_welcome_seen: true });
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (user?.is_premium && !confettiFired.current) {
      confettiFired.current = true;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 1 },
        colors: ["#f59e0b", "#3db87a", "#ffffff"],
      });
    }
  }, [user]);

  const handleSubscribe = async () => {
    // Block if in iframe (preview)
    if (window.self !== window.top) {
      alert("Le paiement fonctionne uniquement depuis l'application publiée.");
      return;
    }
    setLoading(true);
    try {
      const priceId = plan === "annual" ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
      const response = await base44.functions.invoke("stripeCheckout", { priceId });
      const { url } = response.data;
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Stripe checkout error:", err);
      alert("Erreur lors du paiement. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.is_premium) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="gradient-primary pt-14 pb-10 px-5 text-center">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="mx-auto mb-4"
          >
            {dog?.photo ? (
              <img
                src={dog.photo}
                alt={dog.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-lg mx-auto"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-amber-400 flex items-center justify-center mx-auto shadow-lg">
                <Crown className="w-10 h-10 text-white" />
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white font-bold text-2xl"
          >
            {isFirstVisit ? "Bienvenue dans le club Premium !" : "Tu es Premium !"}
          </motion.h1>
          {dog && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/70 text-sm mt-1"
            >
              {dog.name} a accès à tout, sans limite 🐾
            </motion.p>
          )}
        </div>

        <div className="px-5 -mt-4">
          {/* Unlocked features */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-xs font-bold text-foreground">✨ Tes avantages débloqués</p>
            </div>
            <div className="divide-y divide-border">
              {PREMIUM_FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="text-lg">{f.emoji}</span>
                  <span className="text-sm font-medium text-foreground flex-1">{f.text}</span>
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-6"
          >
            <Button
              onClick={() => navigate(createPageUrl("Home"))}
              className="w-full h-14 rounded-2xl gradient-primary border-0 text-white font-bold text-base gap-2 shadow-lg"
            >
              Commencer <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Reassurance */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-xs text-muted-foreground mt-4"
          >
            Tu peux gérer ton abonnement à tout moment depuis ton Profil.
          </motion.p>
        </div>

        <BottomNav currentPage="Premium" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="gradient-primary pt-12 pb-8 px-5 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/20 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-3">
            <Crown className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl">PawCoach Premium</h1>
          <p className="text-white/70 text-sm mt-1">Le meilleur pour ton chien, sans limite</p>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-5">
        {/* Plan selector */}
        <div className="bg-white rounded-2xl border border-border p-1.5 flex gap-1.5">
          <button
            onClick={() => setPlan("monthly")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              plan === "monthly" ? "gradient-primary text-white shadow" : "text-muted-foreground"
            }`}
          >
            Mensuel<br />
            <span className={`text-xs font-normal ${plan === "monthly" ? "text-white/80" : "text-muted-foreground"}`}>7,99 €/mois</span>
          </button>
          <button
            onClick={() => setPlan("annual")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all relative ${
              plan === "annual" ? "gradient-primary text-white shadow" : "text-muted-foreground"
            }`}
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              -37% 🔥
            </span>
            Annuel<br />
            <span className={`text-xs font-normal ${plan === "annual" ? "text-white/80" : "text-muted-foreground"}`}>59,99 €/an · 5 €/mois</span>
          </button>
        </div>

        {/* Feature comparison */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-3 bg-muted/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">
            <span className="col-span-1">Fonctionnalité</span>
            <span className="text-center">Gratuit</span>
            <span className="text-center text-primary">Premium</span>
          </div>
          {FEATURES.map((f, i) => (
            <div key={i} className={`grid grid-cols-3 px-4 py-3 items-center text-xs ${i < FEATURES.length - 1 ? "border-b border-border" : ""}`}>
              <span className="text-foreground font-medium leading-snug pr-2">{f.text}</span>
              <div className="flex justify-center">
                {f.free === false ? (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <span className="text-muted-foreground text-[11px]">{f.free}</span>
                )}
              </div>
              <div className="flex justify-center">
                {f.premium === true ? (
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                ) : (
                  <span className="text-primary text-[11px]">{f.premium}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full h-14 rounded-2xl gradient-warm border-0 text-white font-bold text-base shadow-lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Chargement...
            </span>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              {plan === "annual" ? "Commencer pour 59,99 €/an" : "Commencer pour 7,99 €/mois"}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Sans engagement · Résiliation à tout moment · Paiement sécurisé Stripe
        </p>
      </div>

      <BottomNav currentPage="Premium" />
    </div>
  );
}