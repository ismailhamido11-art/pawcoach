import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { trackEvent } from "@/utils/analytics";
import { isUserPremium, getTrialDaysLeft } from "@/utils/premium";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Zap, Lock, ChevronRight, MessageCircle, ScanLine, Dumbbell, BookHeart, Salad, Search, Target, ClipboardList, Bell, BarChart3, Dog as DogIcon, Star } from "lucide-react";
import IconBadge from "@/components/ui/IconBadge";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { getDogAgeSegment } from "@/utils/healthStatus";
import BottomNav from "../components/BottomNav";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import Illustration from "../components/illustrations/Illustration";

const MONTHLY_PRICE_ID = "price_1T4tkFDuhaIxY4PGpnhDTx5L";
const ANNUAL_PRICE_ID = "price_1T4tkFDuhaIxY4PGWLeWApDL";

const FEATURES = [
  { text: "Conseils IA sans limite avec PawCoach", premium: true, free: "10/jour" },
  { text: "Scanner aliments sans limite", premium: true, free: "3/semaine" },
  { text: "Programme dressage complet (10 exercices)", premium: true, free: "3 exercices" },
  { text: "Carnet santé complet (visites, médicaments)", premium: true, free: "Vaccins, poids, notes" },
  { text: "Rappels santé et vaccins par email", premium: true, free: false },
  { text: "Bilan bien-être mensuel personnalisé", premium: true, free: false },
  { text: "Jusqu'à 3 chiens dans l'application", premium: true, free: "1 chien" },
];

const PREMIUM_FEATURES = [
  { text: "Conseils IA sans limite", icon: MessageCircle, color: "#3b82f6" },
  { text: "Scanner aliments illimité", icon: Search, color: "#2d9f82" },
  { text: "Programme dressage complet", icon: Target, color: "#6366f1" },
  { text: "Carnet santé intégral", icon: ClipboardList, color: "#ef4444" },
  { text: "Rappels santé par email", icon: Bell, color: "#2D9F82" },
  { text: "Bilan mensuel personnalisé", icon: BarChart3, color: "#10b981" },
  { text: "Jusqu'à 3 chiens", icon: DogIcon, color: "#ec4899" },
];

const SEGMENT_HERO = {
  puppy: {
    subtitle: (name) => `${name} grandit vite — ne rate pas ses semaines critiques`,
    urgency: (name, days) => `${name} a besoin de toi maintenant — essai expire dans ${days} jour${days > 1 ? "s" : ""}`,
  },
  adult: {
    subtitle: (name) => `Le meilleur suivi au quotidien pour ${name}`,
    urgency: (name, days) => `Garde l'historique santé de ${name} — essai expire dans ${days} jour${days > 1 ? "s" : ""}`,
  },
  senior: {
    subtitle: (name) => `${name} mérite un suivi attentif à son âge`,
    urgency: (name, days) => `Les rappels santé de ${name} expirent dans ${days} jour${days > 1 ? "s" : ""}`,
  },
};

export default function Premium() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [plan, setPlan] = useState("annual");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const confettiFired = useRef(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (dogs?.length > 0) setDog(getActiveDog(dogs));

        if (isUserPremium(u) && !u.premium_welcome_seen) {
          setIsFirstVisit(true);
          await base44.auth.updateMe({ premium_welcome_seen: true });
        }
      } catch (err) {
        console.error("Premium load error:", err);
      } finally {
        setPageLoading(false);
      }
    };
    init().then(() => {
      const params = new URLSearchParams(window.location.search);
      trackEvent("premium_page_viewed", { from: params.get("from") || "direct" });
    });
  }, []);

  useEffect(() => {
    if (isUserPremium(user) && !confettiFired.current) {
      confettiFired.current = true;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 1 },
        colors: ["#2d9f82", "#3db87a", "#ffffff"],
      });
    }
  }, [user]);

  const handleSubscribe = async () => {
    // Block if in iframe (preview)
    if (window.self !== window.top) {
      alert("Le paiement fonctionne uniquement depuis l'application publiée.");
      return;
    }
    trackEvent("premium_checkout_clicked", { plan });
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

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background pb-10">
        <div className="gradient-primary safe-pt-14 pb-8 px-5">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-3xl mx-auto mb-3 animate-pulse" />
            <div className="h-7 w-48 bg-white/20 rounded mx-auto animate-pulse" />
            <div className="h-4 w-56 bg-white/10 rounded mx-auto animate-pulse mt-2" />
          </div>
        </div>
        <div className="px-5 pt-6 space-y-5">
          <div className="h-16 bg-white rounded-2xl border border-border animate-pulse" />
          <div className="h-64 bg-white rounded-2xl border border-border animate-pulse" />
          <div className="h-14 rounded-xl bg-muted animate-pulse" />
        </div>
        <BottomNav currentPage="Premium" />
      </div>
    );
  }

  const trialDays = getTrialDaysLeft(user);
  const isOnTrial = trialDays > 0 && !user?.is_premium;
  const segment = getDogAgeSegment(dog);
  const dogName = dog?.name || "ton chien";

  if (isUserPremium(user)) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="gradient-primary safe-pt-14 pb-10 px-5 text-center">
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
                className="w-24 h-24 rounded-full object-cover border-4 border-white/40 shadow-md mx-auto"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-white/30 flex items-center justify-center mx-auto shadow-md overflow-hidden">
                <Illustration name="qualityTime" alt="Premium" className="w-full h-full object-cover" />
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white font-black text-2xl"
          >
            {isOnTrial
              ? "Essai gratuit actif"
              : isFirstVisit ? "Bienvenue dans le club Premium !" : "Tu es Premium !"}
          </motion.h1>
          {isOnTrial && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-white/90 text-sm mt-1 font-semibold"
            >
              {trialDays} jour{trialDays > 1 ? "s" : ""} restant{trialDays > 1 ? "s" : ""}
            </motion.p>
          )}
          {dog && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/70 text-sm mt-1"
            >
              {dog.name} a accès à tout, sans limite
            </motion.p>
          )}
        </div>

        <div className="px-5 -mt-4">
          {/* Trial countdown banner */}
          {isOnTrial && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-center"
            >
              <p className="text-sm font-semibold text-amber-800">
                Ton essai se termine dans {trialDays} jour{trialDays > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Abonne-toi pour garder tous tes avantages Premium
              </p>
            </motion.div>
          )}

          {/* Unlocked features */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-xs font-bold text-foreground">Tes avantages débloqués</p>
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
                  <IconBadge icon={f.icon} color={f.color} size="xs" />
                  <span className="text-sm font-medium text-foreground flex-1">{f.text}</span>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
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
            {isOnTrial ? (
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full h-14 rounded-2xl gradient-primary border-0 text-white font-bold text-base gap-2 shadow-lg"
              >
                {loading ? "Chargement..." : `S'abonner — ${plan === "annual" ? "59,99 €/an" : "7,99 €/mois"}`}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  const from = params.get("from");
                  const FROM_PAGE_MAP = {
                    chat: "Chat", scan: "Scan", training: "Training",
                    notebook: "Sante", nutrition: "Nutri", profile: "Profile",
                    "behavior-program": "Training", "nutrition-plan": "Nutri",
                    "nutrition-plan-monthly": "Nutri", comparateur: "Nutri",
                    diagnostic: "Sante", "video-coaching": "Training",
                    "health-assistant": "Sante",
                  };
                  const dest = (from && FROM_PAGE_MAP[from]) || "Home";
                  navigate(createPageUrl(dest));
                }}
                className="w-full h-14 rounded-2xl gradient-primary border-0 text-white font-bold text-base gap-2 shadow-lg"
              >
                Commencer <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </motion.div>

          {/* Reassurance */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-xs text-muted-foreground mt-4"
          >
            {isOnTrial
              ? "Sans engagement · Résiliation à tout moment · Paiement sécurisé Stripe"
              : "Tu peux gérer ton abonnement à tout moment depuis ton Profil."}
          </motion.p>
        </div>

        <BottomNav currentPage="Premium" />
      </div>
    );
  }

  const CONTEXTUAL_MESSAGES = {
    chat:     { title: "Tu as atteint la limite du jour", desc: "Passe en Premium pour des conseils illimités avec PawCoach", Icon: MessageCircle, color: "bg-primary/10 border-primary/20 text-primary" },
    scan:     { title: "Tes scans de la semaine sont épuisés", desc: "Passe en Premium pour scanner autant que tu veux", Icon: ScanLine, color: "bg-accent/10 border-accent/20 text-accent" },
    training: { title: "Tu as maîtrisé les bases !", desc: "Débloque les 7 exercices avancés pour aller plus loin", Icon: Dumbbell, color: "bg-primary/10 border-primary/20 text-primary" },
    notebook: { title: "Carnet santé complet disponible en Premium", desc: "Visites véto, médicaments, ordonnances — tout au même endroit", Icon: BookHeart, color: "bg-destructive/10 border-destructive/20 text-destructive" },
    nutrition:{ title: "Tu as atteint la limite NutriCoach", desc: "Passe en Premium pour un suivi nutrition illimité et personnalisé", Icon: Salad, color: "bg-safe/10 border-safe/20 text-safe" },
  };

  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get("from");
  const contextMsg = fromParam ? CONTEXTUAL_MESSAGES[fromParam] : null;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="gradient-primary safe-pt-14 pb-8 px-5 relative overflow-hidden">
        <button
          aria-label="Retour"
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate(createPageUrl("Home"))}
          className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center z-20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-3"
          >
            <Illustration name="qualityTime" alt="PawCoach Premium" className="w-32 h-32 mx-auto drop-shadow-lg" />
          </motion.div>
          <h1 className="text-white font-black text-2xl">PawCoach Premium</h1>
          <p className="text-white/70 text-sm mt-1">{SEGMENT_HERO[segment].subtitle(dogName)}</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      <div className="px-5 pt-6 space-y-5">
        {/* Contextual banner */}
        {contextMsg && (() => {
          const CtxIcon = contextMsg.Icon;
          return (
            <div className={`rounded-2xl border p-4 flex items-start gap-3 ${contextMsg.color}`}>
              <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0">
                <CtxIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">{contextMsg.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{contextMsg.desc}</p>
              </div>
            </div>
          );
        })()}
        {/* Plan selector */}
        <div className="bg-white rounded-2xl border border-border p-1.5 flex gap-1.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => setPlan("monthly")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
              plan === "monthly" ? "gradient-primary text-white shadow" : "text-muted-foreground"
            }`}
          >
            Mensuel<br />
            <span className={`text-xs font-normal ${plan === "monthly" ? "text-white/80" : "text-muted-foreground"}`}>7,99 €/mois</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => setPlan("annual")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors relative ${
              plan === "annual" ? "gradient-primary text-white shadow" : "text-muted-foreground"
            }`}
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              -37% 🔥
            </span>
            Annuel<br />
            <span className={`text-xs font-normal ${plan === "annual" ? "text-white/80" : "text-muted-foreground"}`}>59,99 €/an · 5 €/mois</span>
            <span className={`block text-[10px] mt-0.5 font-medium ${plan === "annual" ? "text-white/60" : "text-muted-foreground/60"}`}>Tu économises 36 € par an</span>
          </motion.button>
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
                  <span className="text-muted-foreground text-xs">{f.free}</span>
                )}
              </div>
              <div className="flex justify-center">
                {f.premium === true ? (
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                ) : (
                  <span className="text-primary text-xs">{f.premium}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="bg-muted/30 rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}
          </div>
          <p className="text-sm text-foreground italic leading-relaxed">
            "Depuis que j'utilise PawCoach, je suis enfin serein sur l'alimentation de Rex. Le chat IA répond à toutes mes questions en 30 secondes."
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">— Thomas, propriétaire d'un Golden Retriever</p>
        </div>

        {/* Trial urgency */}
        {isOnTrial && trialDays <= 3 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-2.5 text-center">
            <p className="text-amber-700 font-bold text-sm">
              {SEGMENT_HERO[segment].urgency(dogName, trialDays)}
            </p>
          </div>
        )}

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
              {plan === "annual" ? "Débloquer tout PawCoach · 5 €/mois" : "Débloquer tout PawCoach · 7,99 €/mois"}
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