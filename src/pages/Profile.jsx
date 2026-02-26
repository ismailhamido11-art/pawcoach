import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Crown, ChevronLeft, Dog, Plus, Mail, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import WellnessBanner from "../components/WellnessBanner";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const myDogs = await base44.entities.Dog.filter({ owner: u.email });
    setDogs(myDogs);
  };

  const isPremium = user?.role === "admin";
  const maxDogs = isPremium ? 3 : 1;

  const handleManageSubscription = async () => {
    if (window.self !== window.top) {
      alert("Gestion de l'abonnement disponible depuis l'application publiée.");
      return;
    }
    setLoadingPortal(true);
    const res = await base44.functions.invoke("stripePortal", {
      returnUrl: window.location.href,
    });
    if (res.data?.url) window.location.href = res.data.url;
    setLoadingPortal(false);
  };

  const handleAddDog = () => {
    if (dogs.length >= maxDogs) {
      navigate(createPageUrl("Premium"));
      return;
    }
    navigate(createPageUrl("Onboarding"));
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === 0) { setDeleteStep(1); return; }
    // Delete all user data
    for (const dog of dogs) {
      const records = await base44.entities.HealthRecord.filter({ dog_id: dog.id });
      for (const r of records) await base44.entities.HealthRecord.delete(r.id);
      const chats = await base44.entities.ChatMessage.filter({ dog_id: dog.id });
      for (const c of chats) await base44.entities.ChatMessage.delete(c.id);
      const scans = await base44.entities.FoodScan.filter({ dog_id: dog.id });
      for (const s of scans) await base44.entities.FoodScan.delete(s.id);
      await base44.entities.Dog.delete(dog.id);
    }
    base44.auth.logout(createPageUrl("Home"));
  };

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground text-sm">Chargement...</span></div>;

  return (
    <div className="min-h-screen bg-background pb-10">
      <WellnessBanner />

      {/* Header */}
      <div className="gradient-primary px-5 pt-10 pb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <span className="text-2xl">🐾</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{user.full_name || "Mon compte"}</p>
            <p className="text-white/70 text-sm">{user.email}</p>
            {isPremium && (
              <span className="mt-1 inline-flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Crown className="w-2.5 h-2.5" /> Premium
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Premium section */}
        {!isPremium ? (
          <button
            onClick={() => navigate(createPageUrl("Premium"))}
            className="w-full gradient-warm rounded-2xl p-4 flex items-center gap-4 tap-scale"
          >
            <Crown className="w-8 h-8 text-white flex-shrink-0" />
            <div className="text-left">
              <p className="text-white font-bold">Passer en Premium</p>
              <p className="text-white/80 text-xs">Fonctionnalités illimitées à partir de 7,99 €/mois</p>
            </div>
          </button>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-amber-500" />
              <div>
                <p className="font-bold text-foreground text-sm">Abonnement Premium actif</p>
                {user.premium_since && (
                  <p className="text-xs text-muted-foreground">Depuis le {new Date(user.premium_since).toLocaleDateString("fr-FR")}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="text-xs border-amber-300 text-amber-700 h-8"
            >
              {loadingPortal ? "..." : "Gérer"}
            </Button>
          </div>
        )}

        {/* Mes chiens */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dog className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Mes chiens</span>
              <span className="text-xs text-muted-foreground">({dogs.length}/{maxDogs})</span>
            </div>
            {dogs.length < maxDogs && (
              <button onClick={handleAddDog} className="flex items-center gap-1 text-xs text-primary font-semibold">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            )}
          </div>
          {dogs.map(dog => (
            <div key={dog.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-border">
              {dog.photo ? (
                <img src={dog.photo} alt={dog.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg flex-shrink-0">🐕</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{dog.name}</p>
                <p className="text-xs text-muted-foreground truncate">{dog.breed}</p>
              </div>
            </div>
          ))}
          {dogs.length >= maxDogs && !isPremium && (
            <div className="px-4 py-3 bg-amber-50 flex items-center justify-between">
              <p className="text-xs text-amber-700">Premium pour ajouter jusqu'à 3 chiens</p>
              <button onClick={() => navigate(createPageUrl("Premium"))} className="text-xs text-amber-600 font-bold underline">
                Débloquer
              </button>
            </div>
          )}
        </div>

        {/* Confidentialité */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span className="font-bold text-sm">Confidentialité</span>
          </div>
          <a href="https://pawcoach.app/privacy" target="_blank" rel="noreferrer"
            className="flex items-center justify-between px-4 py-3 border-b border-border tap-scale">
            <span className="text-sm">Politique de confidentialité</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 w-full px-4 py-3 text-destructive text-sm tap-scale">
              <Trash2 className="w-4 h-4" />
              Supprimer mon compte et mes données
            </button>
          ) : (
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-sm font-bold">
                  {deleteStep === 0 ? "Supprimer définitivement ?" : "Dernière confirmation — impossible d'annuler !"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Toutes les données de tes chiens (scans, carnet, historique) seront supprimées définitivement.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowDeleteConfirm(false); setDeleteStep(0); }} className="flex-1">
                  Annuler
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="flex-1">
                  {deleteStep === 0 ? "Je confirme" : "Supprimer définitivement"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* À propos */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border">
            <span className="font-bold text-sm">À propos</span>
          </div>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-semibold">1.0.0</span>
          </div>
          <a href="mailto:support@pawcoach.app"
            className="flex items-center gap-2 px-4 py-3 border-b border-border tap-scale">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Contacter le support</span>
          </a>
          <div className="px-4 py-4 bg-muted/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🐾 PawCoach est un coach bien-être canin. Il ne remplace pas un vétérinaire.
              En cas de doute sur la santé de votre chien, consultez un vétérinaire.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => base44.auth.logout()} className="w-full h-12 rounded-2xl text-destructive border-destructive/30">
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}