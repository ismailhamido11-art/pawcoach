import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import SectionVaccins from "../components/notebook/SectionVaccins";
import SectionPoids from "../components/notebook/SectionPoids";
import PremiumSection from "../components/notebook/PremiumSection";
import UpcomingReminders from "../components/notebook/UpcomingReminders";
import SmartHealthAssistant from "../components/notebook/SmartHealthAssistant";
import { RecordRow } from "../components/notebook/SectionVaccins";
import { Syringe, Stethoscope, Weight, Pill, FileText, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Share2, HeartPulse, ClipboardList, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import IconBadge from "@/components/ui/IconBadge";
import ShareVetModal from "../components/vet/ShareVetModal";
import VetNotesList from "../components/vet/VetNotesList";
import AIDiagnosisModal from "../components/vet/AIDiagnosisModal";
import { updateStreakSilently } from "../components/streakHelper";
import { motion } from "framer-motion";

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
    emoji: "🏥",
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
    emoji: "💊",
    emptyText: "Aucun médicament enregistré",
    placeholder: "Ex: Antiparasitaire Frontline",
    addLabel: "Ajouter un m\u00e9dicament",
    showNextDate: true,
    Icon: Pill,
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-600",
    btnClass: "bg-amber-600 hover:bg-amber-700",
  },
  note: {
    label: "Notes",
    emoji: "📝",
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

// Compact Health Status Bar
function HealthStatusBar({ dog, records }) {
  if (!dog) return null;

  const lastWeight = records.find(r => r.type === 'weight');
  const lastVaccine = records.find(r => r.type === 'vaccine');
  const lastVet = records.find(r => r.type === 'vet_visit');

  const items = [
    { label: "Poids", ok: !!lastWeight, value: lastWeight ? `${lastWeight.value}kg` : "—", icon: <Weight className="w-3.5 h-3.5" /> },
    { label: "Vaccins", ok: !!lastVaccine, value: lastVaccine ? "OK" : "—", icon: <Syringe className="w-3.5 h-3.5" /> },
    { label: "Véto", ok: !!lastVet, value: lastVet ? "OK" : "—", icon: <Stethoscope className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm border-b border-slate-100">
      <span className="text-sm font-bold text-foreground">{dog.name}</span>
      <span className="text-xs text-muted-foreground">{dog.breed} · {dog.weight}kg</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
              item.ok
                ? "bg-green-50 text-green-700"
                : "bg-orange-50 text-orange-600"
            }`}
          >
            {item.icon}
            {item.value}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Notebook() {
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showRecords, setShowRecords] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [vetNotes, setVetNotes] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs.length > 0) {
        setDog(dogs[0]);
        const recs = await base44.entities.HealthRecord.filter({ dog_id: dogs[0].id });
        setRecords(recs);
        if (recs.length > 0) setShowRecords(true);
        // Load vet notes for this dog
        try {
          const notes = await base44.entities.VetNote.filter({ dog_id: dogs[0].id });
          setVetNotes(notes);
        } catch (e) { /* no vet notes yet */ }
      }
    } catch (err) {
      console.error("Notebook load error:", err);
    }
  };

  const handleAdd = async (rec) => {
    setRecords(prev => [...prev, rec]);
    setShowRecords(true);
    if (navigator.vibrate) navigator.vibrate(30);

    // --- STREAK UPDATE ---
    if (dog && user) {
      await updateStreakSilently(dog.id, user.email);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.HealthRecord.delete(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Erreur lors de la suppression. Réessaie.");
    }
  };

  const isPremium = user?.is_premium;
  const countForTab = (id) => id === "all" ? records.length : records.filter(r => r.type === id).length;

  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      {/* Compact Header */}
      <div className="gradient-primary pt-8 pb-6 px-5 relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Carnet de santé</h1>
            <p className="text-white/80 text-xs mt-0.5">
              {dog ? `Le suivi intelligent de ${dog.name}` : "Chargement..."}
            </p>
          </div>
          {dog && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Envoyer au véto de {dog.name}
            </button>
          )}
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Health Status Bar */}
      <HealthStatusBar dog={dog} records={records} />

      {/* Import IA Button */}
      {dog && (
        <div className="px-5 mt-4">
          <Link to={createPageUrl("HealthImport")}>
            <motion.div
              whileTap={{ scale: 0.96 }}
              transition={spring}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl hover:shadow-md transition-all mb-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">Importer des données de santé</p>
                <p className="text-[11px] text-muted-foreground">Photo, PDF, email véto — l'IA extrait tout automatiquement</p>
              </div>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </Link>
        </div>
      )}

      {/* AI Pre-Diagnosis Button */}
      {dog && (
        <div className="px-5 mt-0">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={() => setShowDiagnosisModal(true)}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl transition-colors hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">Mon chien est malade ?</p>
              <p className="text-[11px] text-muted-foreground">Pré-diagnostic IA & Trouver un véto</p>
            </div>
            <Stethoscope className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>
      )}

      {/* Main: Embedded Conversation */}
      <div className="px-5 mt-4 mb-4">
        <SmartHealthAssistant dogId={dog?.id} onRecordAdded={handleAdd} />
      </div>

      <UpcomingReminders records={records} isPremium={isPremium} />

      {/* Records Section - Collapsible */}
      <div className="px-5 mt-2">
        <button
          onClick={() => setShowRecords(!showRecords)}
          className="w-full flex items-center justify-between py-3 px-1 text-sm font-semibold text-foreground"
        >
          <span>Historique ({records.length})</span>
          {showRecords ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
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
          <div className="px-5 pt-4">
            {activeTab === "all" && (
              <div className="space-y-3">
                {sortedRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <IconBadge icon={ClipboardList} color="#6366f1" size="lg" className="mx-auto mb-3" />
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
                      extra={r.type === 'weight' ? <span className="text-xs font-bold text-teal-600 mt-1 block">{r.value} kg</span> : null}
                    />
                  ))
                )}
              </div>
            )}
            {activeTab === "vaccine" && (
              <SectionVaccins records={records} dogId={dog?.id} onDelete={handleDelete} />
            )}
            {activeTab === "weight" && (
              <SectionPoids records={records} dogId={dog?.id} onDelete={handleDelete} />
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
        <div className="px-5 mt-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            Notes de votre vétérinaire ({vetNotes.length})
          </h3>
          <VetNotesList notes={vetNotes} />
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