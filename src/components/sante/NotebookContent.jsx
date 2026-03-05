import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Illustration from "../illustrations/Illustration";
import SectionVaccins from "../notebook/SectionVaccins";
import SectionPoids from "../notebook/SectionPoids";
import PremiumSection from "../notebook/PremiumSection";
import UpcomingReminders from "../notebook/UpcomingReminders";
import SmartHealthAssistant from "../notebook/SmartHealthAssistant";
import GuidanceTip from "../notebook/GuidanceTip";
import QRCodeCard from "../notebook/QRCodeCard";
import VetNotesList from "../vet/VetNotesList";
import ShareVetModal from "../vet/ShareVetModal";
import { RecordRow } from "../notebook/SectionVaccins";
import { updateStreakSilently } from "../streakHelper";
import {
  Syringe, Stethoscope, Weight, Pill, FileText,
  ShieldCheck, HeartPulse, PawPrint, Shield, TrendingUp,
  Share2, ChevronDown, ChevronUp, ClipboardList, Sparkles,
  AlertTriangle, Camera
} from "lucide-react";
import heroDogImg from "../../assets/images/hero-dog.jpg";
import vetCareImg from "../../assets/images/vet-care.jpg";

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
    label: "Visites vétérinaire", emptyText: "Aucune visite vétérinaire enregistrée",
    placeholder: "Ex: Visite de contrôle annuelle", addLabel: "Ajouter une visite",
    showNextDate: true, Icon: Stethoscope, bgClass: "bg-purple-50", borderClass: "border-purple-200",
    textClass: "text-purple-600", btnClass: "bg-purple-600 hover:bg-purple-700",
  },
  medication: {
    label: "Médicaments", emptyText: "Aucun médicament enregistré",
    placeholder: "Ex: Antiparasitaire Frontline", addLabel: "Ajouter un médicament",
    showNextDate: true, Icon: Pill, bgClass: "bg-emerald-50", borderClass: "border-emerald-200",
    textClass: "text-emerald-600", btnClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  note: {
    label: "Notes", emptyText: "Aucune note enregistrée",
    placeholder: "Titre de la note", addLabel: "Ajouter une note",
    showNextDate: false, Icon: FileText, bgClass: "bg-gray-50", borderClass: "border-gray-200",
    textClass: "text-gray-600", btnClass: "bg-gray-600 hover:bg-gray-700",
  },
};

export default function NotebookContent({ dog, user, records, setRecords, isPremium, loading }) {
  const [activeTab, setActiveTab] = useState("all");
  const [showRecords, setShowRecords] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [vetNotes, setVetNotes] = useState([]);
  const [vetNotesLoaded, setVetNotesLoaded] = useState(false);

  // Load vet notes lazily
  const ensureVetNotes = async () => {
    if (vetNotesLoaded || !dog) return;
    try {
      const notes = await base44.entities.VetNote.filter({ dog_id: dog.id });
      setVetNotes(notes);
    } catch (e) {
      console.warn("Failed to load vet notes:", e.message || e);
    }
    setVetNotesLoaded(true);
  };

  const handleAdd = async (rec) => {
    setRecords(prev => [...prev, rec]);
    setShowRecords(true);
    if (navigator.vibrate) navigator.vibrate(30);
    if (dog && user) await updateStreakSilently(dog.id, user.email);
  };

  const handleDelete = async (id) => {
    if (typeof id === "string" && id.startsWith("dl-")) return;
    await base44.entities.HealthRecord.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

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
      default: return "bg-muted border-border";
    }
  };

  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const countForTab = (id) => id === "all" ? records.length : records.filter(r => r.type === id).length;

  const lastWeight = records.find(r => r.type === 'weight');
  const lastVaccine = records.find(r => r.type === 'vaccine');
  const lastVet = records.find(r => r.type === 'vet_visit');

  if (loading) {
    return (
      <div className="px-4 pt-4 space-y-3">
        <div className="h-24 bg-white rounded-2xl border border-border animate-pulse" />
        <div className="h-16 bg-white rounded-2xl border border-border animate-pulse" />
        <div className="h-16 bg-white rounded-2xl border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dog header card */}
      {dog && (
        <div className="mx-4 mt-4 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="relative h-28">
            <img src={dog.photo || heroDogImg} alt={dog.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
            <div className="absolute inset-0 flex items-center p-4">
              <div className="flex-1">
                <p className="font-black text-foreground text-lg">{dog.name}</p>
                <p className="text-xs text-muted-foreground">{dog.breed} · {dog.weight}kg</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {lastVaccine && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                      <ShieldCheck className="w-2.5 h-2.5" /> Vaccins
                    </span>
                  )}
                  {lastWeight && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      <TrendingUp className="w-2.5 h-2.5" /> Poids suivi
                    </span>
                  )}
                  {lastVaccine && lastVet && lastWeight && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      <HeartPulse className="w-2.5 h-2.5" /> En forme
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
              >
                <Share2 className="w-3.5 h-3.5" /> Partager
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-3">
        {/* Reminders */}
        <UpcomingReminders records={records} isPremium={isPremium} />

        {/* QR Code */}
        {dog && <QRCodeCard dog={dog} />}

        {/* Vet care image */}
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <div className="relative h-28">
            <img src={vetCareImg} alt="Soins vétérinaires" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
            <div className="absolute inset-0 flex items-center p-4">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Suivi vétérinaire</p>
                <p className="text-base font-bold text-foreground mt-1">Chaque visite compte</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Garde un historique complet pour {dog?.name || "ton chien"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant tip */}
        <GuidanceTip
          id="assistant"
          title="Ton assistant personnel"
          description={`Parle-lui : "${dog?.name || "Mon chien"} a été vacciné aujourd'hui" ou "Il pèse 32kg". Il s'occupe de tout.`}
          icon={<Sparkles className="w-5 h-5" />}
          variant="accent"
        />

        {/* Smart Health Assistant */}
        <SmartHealthAssistant dogId={dog?.id} onRecordAdded={handleAdd} />

        {/* Records section */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => { setShowRecords(!showRecords); ensureVetNotes(); }}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <span>Historique ({records.length})</span>
            </div>
            {records.length > 0 && (showRecords ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
          </button>
        </div>

        {showRecords && (
          <div className="space-y-3">
            {/* Tab bar */}
            <div className="bg-white/80 backdrop-blur-md border border-border rounded-2xl overflow-hidden">
              <div className="flex overflow-x-auto">
                {TABS.map(tab => (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.96 }}
                    transition={spring}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
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
            {activeTab === "all" && (
              <div className="space-y-2.5">
                {sortedRecords.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center bg-white rounded-2xl border border-border">
                    <Illustration name="goodDoggy" className="w-24 h-24 mb-3 opacity-80" alt="Chien content" />
                    <p className="text-sm font-semibold text-foreground">Le carnet est prêt</p>
                    <p className="text-xs text-muted-foreground mt-1">Utilise l'assistant pour ajouter des entrées</p>
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
        )}

        {/* Vet notes */}
        {vetNotes.length > 0 && (
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
        )}
      </div>

      {/* Share Modal */}
      {dog && (
        <ShareVetModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          dogId={dog.id}
          dogName={dog.name}
        />
      )}
    </div>
  );
}