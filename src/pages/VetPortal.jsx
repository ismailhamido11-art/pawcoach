import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Stethoscope, KeyRound, LogOut, ArrowLeft, FileText, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VetDogCard from "../components/vet/VetDogCard";
import { motion } from "framer-motion";
import SkeletonPage from "@/components/ui/SkeletonPage";
import EmptyState from "@/components/ui/EmptyState";

export default function VetPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accesses, setAccesses] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const u = await base44.auth.me();
      setUser(u);
      await loadAccesses();
    } catch (e) {
      console.error("VetPortal init error:", e);
      toast.error("Impossible de charger le portail vétérinaire. Vérifie ta connexion.");
    }
    setLoading(false);
  };

  const loadAccesses = async () => {
    try {
      const res = await base44.functions.invoke("vetAccess", { action: "listMyPatients" });
      const { accesses: accessList, dogs: dogList } = res.data;
      setAccesses(accessList || []);
      setDogs((dogList || []).filter(Boolean));
    } catch (e) {
      console.error("loadAccesses error:", e);
      toast.error("Impossible de charger tes patients. Vérifie ta connexion.");
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) return;
    setAccepting(true);
    try {
      const res = await base44.functions.invoke("vetAccess", {
        action: "accept",
        inviteCode: inviteCode.trim().toUpperCase(),
      });
      if (res.data.success) {
        toast.success("Invitation acceptée !");
        setInviteCode("");
        await loadAccesses();
      } else {
        toast.error(res.data.error || "Ce code d'invitation n'est pas valide. Vérifie avec ton patient.");
      }
    } catch (e) {
      console.error("handleAcceptInvite error:", e);
      toast.error("Impossible de valider le code. Réessaie dans un instant.");
    }
    setAccepting(false);
  };

  if (loading) {
    return <SkeletonPage variant="list" currentPage="VetPortal" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary safe-pt-14 pb-8 px-5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <Link to={createPageUrl("Home")} aria-label="Retour" className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Link>
            <Stethoscope className="w-6 h-6 text-white" />
            <h1 className="text-white font-black text-2xl">Portail Vétérinaire</h1>
          </div>
          <p className="text-white/80 text-xs ml-11">
            {user?.full_name || user?.email} · Vos patients PawCoach
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await base44.auth.logout();
              navigate(createPageUrl("Home"));
            } catch (e) {
              console.error("VetPortal logout error:", e);
              toast.error("Erreur lors de la déconnexion. Réessaie.");
            }
          }}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all z-10"
        >
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Hub rapide */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-blue-800">Patients</p>
            <p className="text-sm font-bold text-blue-600">{dogs.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
            <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-purple-800">Notes</p>
            <p className="text-sm font-bold text-purple-600">—</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
            <BarChart3 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-emerald-800">Rapports</p>
            <p className="text-sm font-bold text-emerald-600">—</p>
          </div>
        </div>

         {/* Accept invite */}
         <div className="p-4 rounded-2xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Code d'invitation</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Entrez le code..."
              className="flex-1 uppercase tracking-widest text-center font-mono"
              maxLength={12}
            />
            <Button onClick={handleAcceptInvite} disabled={accepting || !inviteCode.trim()}>
              {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider"}
            </Button>
          </div>
        </div>

        {/* Dogs list */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Mes patients ({dogs.length})
          </h2>
          {dogs.length === 0 ? (
            <EmptyState
              mascot="doctor"
              illustration="vet-checkup"
              title="Aucun patient pour le moment"
              description="Utilise un code d'invitation PawCoach pour accéder au carnet partagé d'un chien."
              className="rounded-3xl border border-border/60 bg-card shadow-sm"
            />
          ) : (
            <div className="space-y-3">
              {dogs.map((dog, i) => (
                <motion.div
                  key={dog.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25, ease: "easeOut" }}
                >
                  <VetDogCard dog={dog} access={accesses.find(a => a.dog_id === dog.id || a.id === dog._accessId)} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}