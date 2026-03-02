import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Crown, ChevronRight, Zap } from "lucide-react";

export default function SubscriptionSection({ user }) {
  const navigate = useNavigate();

  const handlePortal = async () => {
    try {
      const res = await base44.functions.invoke("stripePortal");
      const { url } = res.data;
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Crown className="w-4 h-4 text-accent" />
        <span className="font-bold text-sm text-foreground">Mon abonnement</span>
      </div>

      <div className="px-4 py-4">
        {user?.is_premium ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">Premium actif ✓</p>
                {user.premium_since && (
                  <p className="text-xs text-amber-600/80">
                    Depuis le {new Date(user.premium_since).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handlePortal}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/30 transition-all"
            >
              Gérer mon abonnement
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Plan Gratuit</p>
                <p className="text-xs text-muted-foreground">Fonctionnalités limitées</p>
              </div>
            </div>
            <button
              onClick={() => navigate(createPageUrl("Premium"))}
              className="w-full py-3 rounded-xl gradient-warm text-white font-bold text-sm flex items-center justify-center gap-2 shadow"
            >
              <Crown className="w-4 h-4" />
              Passer Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}