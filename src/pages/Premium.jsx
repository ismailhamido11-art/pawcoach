import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Crown, Check, ChevronLeft, Zap } from "lucide-react";

const FEATURES = [
  { label: "Messages IA", free: "20 offerts puis 2/jour", premium: "Illimité" },
  { label: "Scans bouffe", free: "14 jours puis 3/sem.", premium: "Illimité" },
  { label: "Exercices dressage", free: "3 premiers", premium: "10 + nouveaux" },
  { label: "Carnet de suivi", free: "Vaccins + Poids", premium: "Complet + rappels email" },
  { label: "Nombre de chiens", free: "1", premium: "Jusqu'à 3" },
];

export default function Premium() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));

    // Handle successful return from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_id")) {
      base44.auth.me().then(u => setUser(u));
    }
  }, []);

  const handleSubscribe = async () => {
    // Block in iframe
    if (window.self !== window.top) {
      alert("Le paiement fonctionne uniquement depuis l'application publiée. Ouvre PawCoach dans ton navigateur.");
      return;
    }

    setLoading(true);
    const appUrl = window.location.origin + createPageUrl("Premium");
    const res = await base44.functions.invoke("stripeCheckout", {
      plan,
      successUrl: appUrl,
      cancelUrl: appUrl,
    });
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
    setLoading(false);
  };

  const isPremium = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="gradient-warm px-5 pt-12 pb-8 text-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <Crown className="w-12 h-12 text-white mx-auto mb-3" />
        <h1 className="text-white font-extrabold text-2xl">PawCoach Premium</h1>
        <p className="text-white/80 text-sm mt-1">Tout pour le bien-être de ton chien</p>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Already premium */}
        {isPremium && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-center">
            <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="font-bold text-foreground">Tu es déjà Premium ! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">Profite de toutes les fonctionnalités sans limite.</p>
          </div>
        )}

        {/* Comparison table */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 bg-muted/40">
            <div className="p-3 text-xs font-bold text-muted-foreground">Fonctionnalité</div>
            <div className="p-3 text-xs font-bold text-muted-foreground text-center border-l border-border">Gratuit</div>
            <div className="p-3 text-xs font-bold text-amber-600 text-center border-l border-border bg-amber-50">
              <Crown className="w-3 h-3 inline mr-1" />Premium
            </div>
          </div>
          {FEATURES.map((f, i) => (
            <div key={i} className="grid grid-cols-3 border-t border-border">
              <div className="p-3 text-xs font-semibold text-foreground">{f.label}</div>
              <div className="p-3 text-xs text-muted-foreground text-center border-l border-border">{f.free}</div>
              <div className="p-3 text-xs text-amber-700 font-semibold text-center border-l border-border bg-amber-50/50 flex items-center justify-center gap-1">
                <Check className="w-3 h-3 text-green-500 flex-shrink-0" />{f.premium}
              </div>
            </div>
          ))}
        </div>

        {/* Plan toggle */}
        {!isPremium && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setPlan("monthly")}
                className={`flex-1 rounded-2xl p-4 border-2 text-left transition-all ${plan === "monthly" ? "border-primary bg-secondary/30" : "border-border bg-white"}`}
              >
                <p className="font-bold text-foreground">Mensuel</p>
                <p className="text-2xl font-extrabold text-primary mt-1">7,99 €<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              </button>
              <button
                onClick={() => setPlan("yearly")}
                className={`flex-1 rounded-2xl p-4 border-2 text-left transition-all relative ${plan === "yearly" ? "border-amber-400 bg-amber-50" : "border-border bg-white"}`}
              >
                <span className="absolute -top-2 right-3 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-36%</span>
                <p className="font-bold text-foreground">Annuel</p>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">59,99 €<span className="text-sm font-normal text-muted-foreground">/an</span></p>
                <p className="text-[10px] text-amber-600 font-semibold">Économise 36 €</p>
              </button>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-14 rounded-2xl gradient-warm border-0 text-white font-bold text-base shadow-lg gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Redirection...
                </span>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Passer Premium — {plan === "monthly" ? "7,99 €/mois" : "59,99 €/an"}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Paiement sécurisé par Stripe. Annulable à tout moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}