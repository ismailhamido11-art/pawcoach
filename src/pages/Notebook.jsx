import { useState, useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import SectionVaccins from "../components/notebook/SectionVaccins";
import SectionPoids from "../components/notebook/SectionPoids";
import PremiumSection from "../components/notebook/PremiumSection";
import UpcomingReminders from "../components/notebook/UpcomingReminders";
import SmartHealthAssistant from "../components/notebook/SmartHealthAssistant";
import GuidanceTip from "../components/notebook/GuidanceTip";
import { RecordRow } from "../components/notebook/SectionVaccins";
import { Syringe, Stethoscope, Weight, Pill, FileText, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Share2, HeartPulse, ClipboardList, Sparkles, PawPrint, Shield, TrendingUp, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import IconBadge from "@/components/ui/IconBadge";
import ShareVetModal from "../components/vet/ShareVetModal";
import VetNotesList from "../components/vet/VetNotesList";
import AIDiagnosisModal from "../components/vet/AIDiagnosisModal";
import { updateStreakSilently } from "../components/streakHelper";
import QRCodeCard from "../components/notebook/QRCodeCard";
import { motion } from "framer-motion";
import Illustration from "../components/illustrations/Illustration";

import heroDogImg from "../assets/images/hero-dog.jpg";
import vetCareImg from "../assets/images/vet-care.jpg";
import happyWalkImg from "../assets/images/happy-walk.jpg";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const TABS = [
  { id: "all",        label: "Journal",  shortLabel: "Tous" },
  { id: "vaccine",    label: "Vaccins",  shortLabel: "Vaccins" },
  { id: "vet_visit",  label: "Visites",  shortLabel: "Vétérinaire" },
  { id: "weight",     label: "Poids",    shortLabel: "Poids" },
  { id: "medication", label: "Médoc.",   shortLabel: "Médicaments" },
  { id: "note",       label: "Notes",    shortLabel: "Notes" },
];

const PREMIUM_CONFIGS = {
  vet_visit: {
    label: "Visites vétérinaire",
    emoji: "",
    emptyText: "Aucune visite vétérinaire enregistrée",
    placeholder: "Ex: Visite de contrôle annuelle",
    addLabel: "Ajouter une visite",
    showNextDate: true,
    Icon: Stethoscope,
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    textClass: "text-purple-600",
    btnClass: "bg-purple-600 hover:bg-purple-700",
  },
  medication: {
    label: "Médicaments",
    emoji: "",
    emptyText: "Aucun médicament enregistré",
    placeholder: "Ex: Antiparasitaire Frontline",
    addLabel: "Ajouter un médicament",
    showNextDate: true,
    Icon: Pill,
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-600",
    btnClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  note: {
    label: "Notes",
    emoji: "",
    emptyText: "Aucune note enregistrée",
    placeholder: "Titre de la note",
    addLabel: "Ajouter une note",
    showNextDate: false,
    Icon: FileText,
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
    textClass: "text-gray-600",
    btnClass: "bg-gray-600 hover:bg-gray-700",
  },
};

// Health Status Bar — design v0 enrichi
function HealthStatusBar({ dog, records }) {
  if (!dog) return null;

  const lastWeight = records.find(r => r.type === 'weight');
  const lastVaccine = records.find(r => r.type === 'vaccine');
  const lastVet = records.find(r => r.type === 'vet_visit');
  const allGood = !!lastWeight && !!lastVaccine && !!lastVet;

  const items = [
    { label: "Poids", ok: !!lastWeight, value: lastWeight ? `${lastWeight.value}kg` : "--", icon: <Weight className="w-3.5 h-3.5" /> },
    { label: "Vaccins", ok: !!lastVaccine, value: lastVaccine ? "OK" : "--", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { label: "Veto", ok: !!lastVet, value: lastVet ? "OK" : "--", icon: <Stethoscope className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mx-4 -mt-4 relative z-10">
      <div className="flex items-center gap-3.5 p-4">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-primary/20 shadow-sm">
          {dog.photo ? (
            <img src={dog.photo} alt={dog.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground text-base truncate">{dog.name}</p>
            {allGood && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                <HeartPulse className="w-2.5 h-2.5" />
                En forme
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{dog.breed} · {dog.weight}kg</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-default ${
              item.ok
                ? "bg-primary/10 text-primary border border-primary/10"
                : "bg-muted text-muted-foreground border border-transparent"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            <span className="font-bold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Notebook() {
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showRecords, setShowRecords] = useState(false);
  const [checkins, setCheckins] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [vetNotes, setVetNotes] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "qr") {
      setTimeout(() => {
        const qrEl = document.getElementById("qr-code-section");
        if (qrEl) qrEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 600);
    }
    if (tab === "vet") {
      setTimeout(() => setShowShareModal(true), 500);
    }
    // Handle direct tab links (weight, vaccine, etc.)
    const validTabs = ["all", "vaccine", "vet_visit", "weight", "medication", "note"];
    if (tab && validTabs.includes(tab)) {
      setTimeout(() => {
        setShowRecords(true);
        setActiveTab(tab);
      }, 400);
    }
  }, []);

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs.length > 0) {
        const activeDog = getActiveDog(dogs);
        setDog(activeDog);
        const [recs, cks, logs] = await Promise.all([
          base44.entities.HealthRecord.filter({ dog_id: activeDog.id }),
          base44.entities.DailyCheckin.filter({ dog_id: activeDog.id }),
          base44.entities.DailyLog.filter({ dog_id: activeDog.id }),
        ]);
        setRecords(recs);
        setCheckins(cks);
        setDailyLogs(logs || []);
        if (recs.length > 0 || (logs || []).some(l => l.weight_kg > 0)) setShowRecords(true);
        try {
          const notes = await base44.entities.VetNote.filter({ dog_id: activeDog.id });
          setVetNotes(notes);
        } catch (e) { /* no vet notes yet */ }
      }
    } catch (err) {
      console.error("Notebook load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (rec) => {
    setRecords(prev => [...prev, rec]);
    setShowRecords(true);
    if (navigator.vibrate) navigator.vibrate(30);
    if (dog && user) {
      await updateStreakSilently(dog.id, user.email);
    }
  };

  const handleDelete = async (id) => {
    if (typeof id === "string" && id.startsWith("dl-")) return; // DailyLog pseudo-records cannot be deleted here
    try {
      await base44.entities.HealthRecord.delete(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Erreur lors de la suppression. Réessaie.");
    }
  };

  const isPremium = isUserPremium(user);

  // Build pseudo-records from DailyLog weight entries (to show in "all" and "weight" tabs)
  const dailyLogRecords = dailyLogs
    .filter(l => l.weight_kg && l.weight_kg > 0)
    .map(l => ({
      id: `dl-${l.id}`,
      type: "weight",
      title: "Poids (log rapide)",
      date: l.date,
      value: l.weight_kg,
      _fromDailyLog: true,
    }));

  // Merge and deduplicate — if a HealthRecord weight exists for the same date, skip the DailyLog one
  const hrWeightDates = new Set(records.filter(r => r.type === "weight").map(r => r.date));
  const uniqueDailyLogRecords = dailyLogRecords.filter(r => !hrWeightDates.has(r.date));
  const allRecords = [...records, ...uniqueDailyLogRecords];

  const countForTab = (id) => id === "all" ? allRecords.length : allRecords.filter(r => r.type === id).length;

  const sortedRecords = [...allRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  const getIconForType = (type) => {
    switch (type) {
      case 'vaccine': return <Syringe className="w-4 h-4 text-primary" />;
      case 'weight': return <Weight className="w-4 h-4 text-primary" />;
      case 'vet_visit': return <Stethoscope className="w-4 h-4 text-primary" />;
      case 'medication': return <Pill className="w-4 h-4 text-accent-foreground" />;
      case 'note': return <FileText className="w-4 h-4 text-muted-foreground" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };
  const getAccentClassForType = (type) => {
    switch (type) {
      case 'vaccine': return "bg-primary/10 border-primary/20";
      case 'weight': return "bg-primary/5 border-primary/20";
      case 'vet_visit': return "bg-primary/10 border-primary/20";
      case 'medication': return "bg-accent/10 border-accent/20";
      case 'note': return "bg-muted border-border";
      default: return "bg-muted border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Skeleton hero */}
        <div className="relative h-52 bg-muted animate-pulse" />
        <div className="px-4 -mt-4 relative z-10 space-y-4">
          <div className="h-28 bg-white rounded-2xl border border-border animate-pulse" />
          <div className="h-20 bg-white rounded-2xl border border-border animate-pulse" />
          <div className="h-20 bg-white rounded-2xl border border-border animate-pulse" />
        </div>
        <BottomNav currentPage="Notebook" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      {/* Hero Header avec photo du chien — design v0 */}
      <header className="relative overflow-hidden">
        <div className="relative h-52">
          <img
            src={dog?.photo || heroDogImg}
            alt={dog ? `Photo de ${dog.name}` : "PawCoach"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-primary/90" />

          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-white/90" />
                  <h1 className="text-lg font-bold text-white tracking-wide">PawCoach</h1>
                </div>
                <p className="text-xs text-white/70 mt-0.5 ml-7">Carnet de santé</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{dog?.name || "Mon chien"}</h2>
                  <p className="text-sm text-white/80 mt-0.5">
                    {dog?.breed} · {dog?.age || ""} · {dog?.weight}kg
                  </p>
                </div>
                {dog && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-xs font-medium transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Partager au veto
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                {records.find(r => r.type === 'vaccine') && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/30 backdrop-blur-sm text-[11px] font-medium text-white">
                    <Shield className="w-3 h-3" />
                    Vaccins à jour
                  </span>
                )}
                {records.find(r => r.type === 'weight') && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-400/30 backdrop-blur-sm text-[11px] font-medium text-white">
                    <TrendingUp className="w-3 h-3" />
                    Poids suivi
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="h-5 bg-primary/90 rounded-b-[28px] -mt-1" />
      </header>

      {/* Health Status Bar */}
      <HealthStatusBar dog={dog} records={records} />

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Guidance Tip */}
        {records.length === 0 && (
          <GuidanceTip
            id="welcome"
            title={`Bienvenue dans le carnet de ${dog?.name || "ton chien"}`}
            description="Suis la santé de ton compagnon : vaccins, poids, visites véto, médicaments. Tout est centralisé et accessible en un coup d'œil."
            icon={<PawPrint className="w-5 h-5" />}
            variant="primary"
          />
        )}

        {/* Upcoming Reminders */}
        <UpcomingReminders records={records} isPremium={isPremium} />

        {/* QR Code urgence */}
        {dog && (
          <div id="qr-code-section">
            <QRCodeCard dog={dog} />
            <GuidanceTip
              id="qr"
              title="Protège ton compagnon"
              description="Le QR code d'urgence permet à quiconque trouve ton animal d'accéder à son dossier médical. Imprime-le et attache-le au collier."
              icon={<Shield className="w-5 h-5" />}
              variant="subtle"
              className="mt-2"
            />
          </div>
        )}

        {/* Image emotionnelle vet-care — design v0 */}
        <div className="relative overflow-hidden rounded-2xl shadow-sm border border-border">
          <div className="relative h-32">
            <img
              src={vetCareImg}
              alt="Soins vétérinaires"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
            <div className="absolute inset-0 flex items-center p-5">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Suivi vétérinaire</p>
                <p className="text-base font-bold text-foreground mt-1">Chaque visite compte</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Garde un historique complet pour un suivi optimal de {dog?.name || "ton chien"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Import IA Button */}
        {dog && (
          <Link to={createPageUrl("HealthImport")}>
            <motion.div
              whileTap={{ scale: 0.96 }}
              transition={spring}
              className="w-full flex items-center gap-3 p-4 bg-white border border-border rounded-2xl shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
                <Camera className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Importer des données de santé</p>
                <p className="text-xs text-muted-foreground mt-0.5">Photo, PDF, email veto — l'IA extrait tout automatiquement</p>
              </div>
              <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
            </motion.div>
          </Link>
        )}

        {/* AI Pre-Diagnosis Button */}
        {dog && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={() => setShowDiagnosisModal(true)}
            className="w-full flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/15 rounded-2xl transition-all hover:shadow-md active:scale-[0.99]"
          >
            <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-foreground">Preparer une visite veto</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bilan de preparation & Trouver un veto</p>
            </div>
          </motion.button>
        )}

        {/* Guidance avant assistant — design v0 */}
        <GuidanceTip
          id="assistant"
          title="Ton assistant personnel"
          description={`Parle-lui comme à un ami : '${dog?.name || "Mon chien"} a été vacciné aujourd'hui' ou 'Il pèse 32kg'. Il s'occupe de tout enregistrer pour toi.`}
          icon={<Sparkles className="w-5 h-5" />}
          variant="accent"
        />

        {/* Smart Health Assistant */}
        <SmartHealthAssistant dogId={dog?.id} onRecordAdded={handleAdd} />

        {/* Image emotionnelle happy-walk — design v0 */}
        <div className="relative overflow-hidden rounded-2xl shadow-sm border border-border">
          <div className="relative h-28">
            <img
              src={happyWalkImg}
              alt="Promenade joyeuse avec ton chien"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
            <div className="absolute inset-0 flex items-center p-5">
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wider">Bien-être</p>
                <p className="text-base font-bold text-foreground mt-1">Des moments de bonheur</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Suis l'activité et le bien-être de {dog?.name || "ton chien"} au quotidien
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Records Section - Collapsible — design v0 (wrappé en card) */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => setShowRecords(!showRecords)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span>Historique ({allRecords.length})</span>
                {allRecords.length === 0 && (
                  <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Utilise l'assistant ou l'import IA pour ajouter des entrées</p>
                )}
              </div>
            </div>
            {allRecords.length > 0 && (showRecords ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
          </button>
        </div>
      </div>

      {showRecords && (
        <>
          {/* Tab bar */}
          <div className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-10 shadow-sm">
            <div className="flex overflow-x-auto">
              {TABS.map(tab => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.96 }}
                  transition={spring}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors relative ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {countForTab(tab.id) > 0 && (
                    <span className={`text-[9px] font-bold mt-0.5 ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}>
                      {countForTab(tab.id)}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Section content */}
          <div className="px-4 pt-4">
            {activeTab === "all" && (
              <div className="space-y-2.5">
                {sortedRecords.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <Illustration name="goodDoggy" className="w-28 h-28 mb-4 opacity-80" alt="Chien content" />
                    <p className="text-sm font-semibold text-foreground">Le carnet de {dog?.name} est prêt</p>
                    <p className="text-xs text-muted-foreground mt-1">Discute avec l'assistant pour ajouter des entrées</p>
                  </div>
                ) : (
                  sortedRecords.map(r => (
                    <RecordRow
                      key={r.id}
                      record={r}
                      onDelete={handleDelete}
                      icon={getIconForType(r.type)}
                      accentClass={getAccentClassForType(r.type)}
                      extra={r.type === 'weight' ? <span className="text-xs font-bold text-emerald-600 mt-1 block">{r.value} kg</span> : null}
                    />
                  ))
                )}
              </div>
            )}
            {activeTab === "vaccine" && (
              <SectionVaccins records={records} dogId={dog?.id} onDelete={handleDelete} />
            )}
            {activeTab === "weight" && (
              <SectionPoids records={allRecords} dogId={dog?.id} onDelete={handleDelete} />
            )}
            {(activeTab === "vet_visit" || activeTab === "medication" || activeTab === "note") && (
              <PremiumSection
                type={activeTab}
                records={records}
                dogId={dog?.id}
                isPremium={isPremium}
                onDelete={handleDelete}
                config={PREMIUM_CONFIGS[activeTab]}
              />
            )}
          </div>
        </>
      )}

      {/* Vet Notes Section */}
      {vetNotes.length > 0 && (
        <div className="px-4 mt-4 mb-4">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Notes de ton vétérinaire ({vetNotes.length})
              </h3>
            </div>
            <VetNotesList notes={vetNotes} />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {dog && (
        <ShareVetModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          dogId={dog.id}
          dogName={dog.name}
        />
      )}

      {/* AI Diagnosis Modal */}
      {dog && (
        <AIDiagnosisModal
          open={showDiagnosisModal}
          onOpenChange={setShowDiagnosisModal}
          dog={dog}
        />
      )}

      <BottomNav currentPage="Notebook" />
    </div>
  );
}
