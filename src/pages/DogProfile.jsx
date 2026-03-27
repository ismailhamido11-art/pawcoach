import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import useBackClose from "@/hooks/useBackClose";
import { createPageUrl, getActiveDog } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Dog, DailyLog, UserProgress, Streak, FoodScan } from "@/api/entities";
import { useHomeCache } from "@/lib/HomeCacheContext";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Pencil, ChevronDown,
  QrCode, Share2, Download,
  Trash2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "../components/BottomNav";
import DogProfileHero from "../components/dogprofile/DogProfileHero.jsx";
import DogIdentityCards from "../components/dogprofile/DogIdentityCards.jsx";
import DogHealthSection from "../components/dogprofile/DogHealthSection.jsx";
import DogDietSection from "../components/dogprofile/DogDietSection.jsx";
import DogPersonalitySection from "../components/dogprofile/DogPersonalitySection.jsx";
import DogTrophiesRow from "../components/dogprofile/DogTrophiesRow.jsx";
import DogEditModal from "../components/dogprofile/DogEditModal.jsx";
import SkeletonPage from "@/components/ui/SkeletonPage";

export default function DogProfile() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { invalidateHome } = useHomeCache();
  const [dog, setDog] = useState(null);
  const [_user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [progress, setProgress] = useState([]);
  const [streak, setStreak] = useState(null);
  const [scansCount, setScansCount] = useState(0);
  const [editModal, setEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useBackClose(editModal, () => setEditModal(false));
  useBackClose(showDeleteConfirm, () => setShowDeleteConfirm(false));

  const [deleting, setDeleting] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const dogId = urlParams.get("dogId");

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);

        let d;
        if (dogId) {
          const results = await Dog.filter({ id: dogId });
          d = (results || [])[0];
        } else {
          const dogs = await Dog.filter({ owner: u.email });
          d = getActiveDog(dogs);
        }

        if (!d) { navigate(createPageUrl("Profile")); return; }
        if (d.owner !== u.email) { navigate(createPageUrl("Profile")); return; }

        setDog(d);

        const [logs, prog, stks, scans] = await Promise.all([
          DailyLog.filter({ dog_id: d.id }, "-date", 30),
          UserProgress.filter({ dog_id: d.id }),
          Streak.filter({ dog_id: d.id }),
          FoodScan.filter({ dog_id: d.id }),
        ]);
        setDailyLogs(logs || []);
        setProgress(prog || []);
        setStreak((stks || [])[0] || null);
        setScansCount((scans || []).length);
      } catch (err) {
        console.error("DogProfile load error:", err);
        toast.error("Impossible de charger le profil. Vérifie ta connexion.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dogId]);

  const handleSaveDog = async (updates) => {
    try {
      await Dog.update(dog.id, updates);
      setDog(prev => ({ ...prev, ...updates }));
      invalidateHome();
    } catch (e) {
      console.error("DogProfile handleSaveDog error:", e);
      toast.error("Impossible de sauvegarder les modifications.");
    }
  };

  const handleExport = () => {
    if (!dog) return;
    const age = dog.birth_date
      ? `${Math.floor((Date.now() - new Date(dog.birth_date)) / (365.25 * 864e5))} ans`
      : "Âge inconnu";
    const text = [
      `Fiche de ${dog.name}`,
      `Race: ${dog.breed || "—"}`,
      `Âge: ${age}`,
      `Sexe: ${dog.sex === "male" ? "Mâle" : dog.sex === "female" ? "Femelle" : "—"}`,
      `Stérilisé: ${dog.neutered ? "Oui" : "Non"}`,
      `Poids: ${dog.weight ? dog.weight + " kg" : "—"}`,
      `Allergies: ${dog.allergies || "Aucune"}`,
      `Problèmes de santé: ${dog.health_issues || "Aucun"}`,
      `Vétérinaire: ${dog.vet_name || "—"} (${dog.vet_city || "—"})`,
      `Alimentation: ${dog.diet_type || "—"} — ${dog.diet_brand || ""}`,
      `Généré par PawCoach`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fiche-${dog.name}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000); // délai 5s pour mobile
  };

  const handleDeleteDog = async () => {
    if (!dog || deleting) return;
    setDeleting(true);
    try {
      // Cascade delete: clean up all related entities using deleteMany
      // TECH-05: include ParkReview and PlaceFavorite (filtered by dog_id) to avoid orphaned records
      const entityNames = [
        "HealthRecord", "DailyCheckin", "DailyLog", "Streak",
        "FoodScan", "Bookmark", "UserProgress", "WeeklyInsight",
        "ChatMessage", "SharedVetAccess", "VetNote", "DiagnosisReport",
        "DogAchievement", "GrowthEntry", "NutritionPlan", "DietPreferences",
        "ParkReview", "PlaceFavorite"
      ];
      await Promise.all(
        entityNames.map(name =>
          base44.entities[name].deleteMany({ dog_id: dog.id }).catch(() => {})
        )
      );

      await Dog.delete(dog.id);
      // Clean up activeDogId if this was the active dog
      const storedId = localStorage.getItem("activeDogId");
      if (storedId === dog.id) {
        localStorage.removeItem("activeDogId");
      }
      invalidateHome();
      navigate(createPageUrl("Profile"));
    } catch (err) {
      console.error("Delete dog error:", err);
      toast.error("Impossible de supprimer ce profil. Réessaie.");
      setDeleting(false);
    }
  };

  if (loading) {
    return <SkeletonPage variant="detail" currentPage="DogProfile" />;
  }

  if (!dog) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <div className="px-4 pb-2 flex items-center justify-between bg-gradient-to-b from-emerald-900/80 to-transparent absolute top-0 left-0 right-0 pointer-events-none"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3rem)" }} />
        <button
          aria-label="Retour"
          onClick={() => navigate(createPageUrl("Profile"))}
          className="absolute left-4 w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center z-40"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <button
          aria-label="Modifier le profil"
          onClick={() => setEditModal(true)}
          className="absolute right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-40"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Hero */}
      <DogProfileHero dog={dog} dailyLogs={dailyLogs} onSave={handleSaveDog} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="px-4 pt-4 space-y-4"
      >
        {/* Identity */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.25 }}>
          <DogIdentityCards dog={dog} dailyLogs={dailyLogs} onSave={handleSaveDog} />
        </motion.div>

        {/* Personality */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.25 }}>
          <DogPersonalitySection dog={dog} onSave={handleSaveDog} />
        </motion.div>

        {/* Health */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.25 }}>
          <DogHealthSection dog={dog} onSave={handleSaveDog} />
        </motion.div>

        {/* Diet */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.25 }}>
          <DogDietSection dog={dog} onSave={handleSaveDog} />
        </motion.div>

        {/* Trophies */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.25 }}>
          <DogTrophiesRow streak={streak} progress={progress} scansCount={scansCount} dailyLogs={dailyLogs} />
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.25 }} className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="font-bold text-sm text-foreground">Actions</p>
          </div>
          <div className="divide-y divide-border">
            <button
              onClick={() => navigate(createPageUrl("Sante") + "?tab=vet")}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-all active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Partager avec mon vétérinaire</p>
                <p className="text-xs text-muted-foreground">Accès sécurisé aux données de santé</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
            </button>
            <button
              onClick={() => navigate(createPageUrl("Sante") + "?tab=qr")}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-all active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <QrCode className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">QR Code d'urgence</p>
                <p className="text-xs text-muted-foreground">Accès rapide aux infos vitales</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
            </button>
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-all active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Exporter les données</p>
                <p className="text-xs text-muted-foreground">Télécharge la fiche en .txt</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-red-50/50 transition-all active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600">Supprimer ce profil</p>
                <p className="text-xs text-muted-foreground">Supprime {dog.name} et ses données</p>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-foreground">Supprimer {dog.name} ?</p>
                <p className="text-xs text-muted-foreground">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Le profil de {dog.name} et toutes ses données associées (check-ins, scans, messages) seront supprimés définitivement.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl"
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteDog}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <DogEditModal dog={dog} onClose={() => setEditModal(false)} onSave={handleSaveDog} />
      )}

      <BottomNav currentPage="DogProfile" />
    </div>
  );
}