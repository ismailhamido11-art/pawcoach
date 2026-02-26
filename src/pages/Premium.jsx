import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Crown, Zap, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const MONTHLY_PRICE_ID = "price_1T4tkFDuhaIxY4PGpnhDTx5L";
const ANNUAL_PRICE_ID = "price_1T4tkFDuhaIxY4PGWLeWApDL";

const FEATURES = [
  { text: "Chat IA illimité avec PawCoach", premium: true, free: false },
  { text: "Scans alimentaires illimités", premium: true, free: "3/semaine" },
  { text: "Tous les exercices de dressage (10)", premium: true, free: "3 exercices" },
  { text: "Carnet santé complet (visites, médicaments, notes)", premium: true, free: false },
  { text: "Rappels de rappels de vaccins par email", premium: true, free: false },
  { text: "Résumés mensuels bien-être", premium: true, free: false },
  { text: "Jusqu'à 3 profils de chiens", premium: true, free: "1 chien" },
];

export default function Premium() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("annual"); // "monthly" | "annual"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleSubscribe = async () => {
    // Block if in iframe (preview)
    if (window.self !== window.top) {
      alert("Le paiement fonctionne uniquement depuis l'application publiée.");
      return;
    }
    setLoading(true);
    const priceId = plan === "annual" ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
    const response = await base44.functions.invoke("stripeCheckout", { priceId });
    const { url } = response.data;
    if (url) window.location.href = url;
    else setLoading(false);
  };

  if (user?.is_premium) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <Crown className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Tu es déjà Premium ! 🎉</h1>
        <p className="text-muted-foreground">Profite de toutes les fonctionnalités sans limite.</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-2xl h-12 px-6">
          Retour
        </Button>
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
    </div>
  );
}