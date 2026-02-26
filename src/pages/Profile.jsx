import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import {
  User, Crown, Dog, Plus, ChevronRight, LogOut, Trash2,
  Info, Mail, ShieldCheck, Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GamificationDashboard from "../components/gamification/GamificationDashboard";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const d = await base44.entities.Dog.filter({ owner: u.email });
    setDogs(d);
    setLoading(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleAddDog = () => {
    if (!user?.is_premium && dogs.length >= 1) {
      navigate(createPageUrl("Premium"));
    } else if (user?.is_premium && dogs.length >= 3) {
      // already at max
    } else {
      navigate(createPageUrl("Onboarding"));
    }
  };

  const maxDogs = user?.is_premium ? 3 : 1;
  const canAddDog = dogs.length < maxDogs;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-3xl animate-bounce">🐾</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary pt-12 pb-8 px-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg truncate">{user?.full_name || "Mon profil"}</h1>
            <p className="text-white/70 text-sm truncate">{user?.email}</p>
          </div>
          {user?.is_premium && (
            <div className="flex items-center gap-1 bg-amber-400/30 border border-amber-300/40 px-3 py-1.5 rounded-full">
              <Crown className="w-4 h-4 text-amber-200" />
              <span className="text-white text-xs font-bold">Premium</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Premium banner (free users) */}
        {!user?.is_premium && (
          <button
            onClick={() => navigate(createPageUrl("Premium"))}
            className="w-full gradient-warm rounded-2xl p-4 flex items-center gap-3 shadow tap-scale"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-sm">Passer Premium</p>
              <p className="text-white/80 text-xs">Chat illimité, tous les exercices, carnet complet</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
          </button>
        )}

        <GamificationDashboard points={user?.points || 0} />

        {/* My dogs */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dog className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-foreground">Mes chiens</span>
            </div>
            <span className="text-xs text-muted-foreground">{dogs.length}/{maxDogs}</span>
          </div>

          {dogs.map((dog, i) => (
            <div key={dog.id} className={`flex items-center gap-3 px-4 py-3 ${i < dogs.length - 1 ? "border-b border-border" : ""}`}>
              {dog.photo ? (
                <img src={dog.photo} alt={dog.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🐶</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{dog.name}</p>
                <p className="text-xs text-muted-foreground">{dog.breed}</p>
              </div>
            </div>
          ))}

          {canAddDog ? (
            <button
              onClick={handleAddDog}
              className="w-full flex items-center gap-3 px-4 py-3 border-t border-border text-primary hover:bg-secondary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold">Ajouter un chien</span>
            </button>
          ) : !user?.is_premium ? (
            <button
              onClick={() => navigate(createPageUrl("Premium"))}
              className="w-full flex items-center gap-3 px-4 py-3 border-t border-border text-amber-600 hover:bg-amber-50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-700">Ajouter d'autres chiens</p>
                <p className="text-xs text-amber-600">Premium : jusqu'à 3 chiens</p>
              </div>
            </button>
          ) : null}
        </div>

        {/* Subscription info for premium */}
        {user?.is_premium && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Abonnement Premium actif</p>
              {user?.premium_since && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Depuis le {new Date(user.premium_since).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* App info */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="font-bold text-sm text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" /> Informations
            </span>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-foreground">Version</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <a href="mailto:support@pawcoach.app" className="flex items-center gap-2 px-4 py-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Contacter le support</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </a>
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                🐾 PawCoach est un coach bien-être canin informatif. Il ne remplace en aucun cas l'avis d'un vétérinaire qualifié. En cas d'urgence, consultez toujours un professionnel de santé animale.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy / account */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" /> Confidentialité
            </span>
          </div>
          <div className="divide-y divide-border">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-destructive hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Supprimer mon compte</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 rounded-2xl border-border text-foreground font-semibold gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </Button>

        {/* Delete confirm dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 pb-8 px-5">
            <div className="bg-white rounded-3xl p-6 w-full space-y-4 animate-slide-up">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <Trash2 className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Supprimer mon compte</h2>
                <p className="text-sm text-muted-foreground">
                  Cette action est irréversible. Toutes tes données (profils, historique) seront supprimées définitivement.
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Pour supprimer ton compte, contacte-nous à{" "}
                <a href="mailto:support@pawcoach.app" className="text-primary underline">support@pawcoach.app</a>
              </p>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="w-full h-12 rounded-2xl font-semibold"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>

      <BottomNav currentPage="Profile" />
    </div>
  );
}