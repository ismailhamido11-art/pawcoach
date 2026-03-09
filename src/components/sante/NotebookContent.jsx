import { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import Illustration from "../illustrations/Illustration";
import SectionVaccins from "../notebook/SectionVaccins";
import SectionPoids from "../notebook/SectionPoids";
import PremiumSection from "../notebook/PremiumSection";
import UpcomingReminders from "../notebook/UpcomingReminders";
import QRCodeCard from "../notebook/QRCodeCard";
import VetNotesList from "../vet/VetNotesList";
import ShareVetModal from "../vet/ShareVetModal";
import { RecordRow } from "../notebook/SectionVaccins";

// Smart Notebook components
import HealthScoreCard from "../notebook/HealthScoreCard";
import NextActionCard from "../notebook/NextActionCard";
import StatusPills from "../notebook/StatusPills";
import VaccineCard from "../notebook/VaccineCard";
import WeightCard from "../notebook/WeightCard";
import { computeNotebookSummary } from "@/utils/healthStatus";

import {
  Syringe, Stethoscope, Weight, Pill, FileText,
  Share2, ChevronDown, ChevronUp, ClipboardList
} from "lucide-react";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const TABS = [
  { id: "all",        label: "Journal",  shortLabel: "Tous" },
  { id: "vaccine",    label: "Vaccins",  shortLabel: "Vaccins" },
  { id: "vet_visit",  label: "Visites",  shortLabel: "Veterinaire" },
  { id: "weight",     label: "Poids",    shortLabel: "Poids" },
  { id: "medication", label: "Medoc.",   shortLabel: "Medicaments" },
  { id: "note",       label: "Notes",    shortLabel: "Notes" },
];

const PREMIUM_CONFIGS = {
  vet_visit: {
    label: "Visites veterinaire", emptyText: "Aucune visite veterinaire enregistree",
    placeholder: "Ex: Visite de controle annuelle", addLabel: "Ajouter une visite",
    showNextDate: true, Icon: Stethoscope, bgClass: "bg-primary/5", borderClass: "border-primary/20",
    textClass: "text-primary", btnClass: "bg-primary hover:bg-primary/90",
  },
  medication: {
    label: "Medicaments", emptyText: "Aucun medicament enregistre",
    placeholder: "Ex: Antiparasitaire Frontline", addLabel: "Ajouter un medicament",
    showNextDate: true, Icon: Pill, bgClass: "bg-emerald-50", borderClass: "border-emerald-200",
    textClass: "text-emerald-600", btnClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  note: {
    label: "Notes", emptyText: "Aucune note enregistree",
    placeholder: "Titre de la note", addLabel: "Ajouter une note",
    showNextDate: false, Icon: FileText, bgClass: "bg-secondary", borderClass: "border-border",
    textClass: "text-muted-foreground", btnClass: "bg-muted-foreground hover:bg-muted-foreground/90",
  },
};

// Map pill IDs to tab IDs for navigation
const PILL_TO_TAB = { vaccines: "vaccine", weight: "weight", vet: "vet_visit" };

export default function NotebookContent({ dog, user, records = [], setRecords, dailyLogs = [], growthEntries = [], isPremium, loading, initialSubTab, initialVaccineKey, showShareModalInit, scrollToQR, onOpenAssistant, onChangeMainTab }) {
  // Sub-tab persistence: initialSubTab (from URL) > sessionStorage > default
  const savedSubTab = typeof window !== "undefined" ? sessionStorage.getItem("subTab_Sante_carnet") : null;
  const [activeTab, setActiveTab] = useState(initialSubTab || savedSubTab || "all");
  const [showRecords, setShowRecords] = useState(records.length > 0 || !!initialSubTab || !!savedSubTab);
  const [showShareModal, setShowShareModal] = useState(!!showShareModalInit);
  const [vetNotes, setVetNotes] = useState([]);
  const [vetNotesLoaded, setVetNotesLoaded] = useState(false);
  const recordsSectionRef = useRef(null);
  const vaccineCardRef = useRef(null);
  const weightCardRef = useRef(null);
  const [autoExpandVaccineKey, setAutoExpandVaccineKey] = useState(initialVaccineKey || null);
  const [autoOpenWeightForm, setAutoOpenWeightForm] = useState(false);

  // Cross-page deep-link: scroll to VaccineCard on mount if initialVaccineKey is provided
  useEffect(() => {
    if (initialVaccineKey && vaccineCardRef.current) {
      setTimeout(() => {
        vaccineCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [initialVaccineKey]);

  // Persist sub-tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("subTab_Sante_carnet", activeTab);
  }, [activeTab]);

  // Scroll to QR if deep-linked
  useEffect(() => {
    if (scrollToQR) {
      setTimeout(() => {
        const qrEl = document.getElementById("qr-code-section");
        if (qrEl) qrEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 600);
    }
  }, [scrollToQR]);

  // Load vet notes lazily
  const ensureVetNotes = async () => {
    if (vetNotesLoaded || !dog) return;
    setVetNotesLoaded(true); // guard immediately to prevent double-fetch
    try {
      const notes = await base44.entities.VetNote.filter({ dog_id: dog.id });
      setVetNotes(notes || []);
    } catch (e) {
      console.warn("Failed to load vet notes:", e?.message || String(e));
    }
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

  // Merge DailyLog + GrowthEntry weight entries as pseudo-records (memoized)
  const allRecords = useMemo(() => {
    const hrWeightDates = new Set(records.filter(r => r.type === "weight").map(r => r.date));

    // DailyLog weights (priority 2 — fill gaps where HealthRecord doesn't exist)
    const dailyLogRecords = (dailyLogs || [])
      .filter(l => l.weight_kg && l.weight_kg > 0 && !hrWeightDates.has(l.date))
      .map(l => ({
        id: `dl-${l.id}`,
        type: "weight",
        title: "Poids (log rapide)",
        date: l.date,
        value: l.weight_kg,
        _fromDailyLog: true,
      }));

    const usedDates = new Set([...hrWeightDates, ...dailyLogRecords.map(r => r.date)]);

    // GrowthEntry weights (priority 3 — fill remaining gaps)
    const growthRecords = (growthEntries || [])
      .filter(g => g.weight_kg && g.weight_kg > 0 && g.date && !usedDates.has(g.date))
      .map(g => ({
        id: `ge-${g.id}`,
        type: "weight",
        title: "Poids (croissance)",
        date: g.date,
        value: g.weight_kg,
        _fromGrowth: true,
      }));

    return [...records, ...dailyLogRecords, ...growthRecords];
  }, [records, dailyLogs, growthEntries]);

  const sortedRecords = useMemo(
    () => [...allRecords].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [allRecords]
  );
  const countForTab = (id) => id === "all" ? allRecords.length : allRecords.filter(r => r.type === id).length;

  // --- Smart Notebook summary (memoized) ---
  const summary = useMemo(
    () => computeNotebookSummary(allRecords, dog),
    [allRecords, dog]
  );

  // Navigate to a tab from NextActionCard, StatusPills, or smart cards
  const handleNavigateToTab = (tabId, targetKey) => {
    if (!tabId) return;
    // Special targets: delegate to parent (Sante.jsx)
    if (tabId === "assistant") { onOpenAssistant?.(); return; }
    if (tabId === "findvet" || tabId === "growth") { onChangeMainTab?.(tabId); return; }
    // Vaccine deep-link: scroll to VaccineCard and auto-expand the specific row
    if (tabId === "vaccine") {
      if (targetKey) setAutoExpandVaccineKey(targetKey);
      setTimeout(() => {
        vaccineCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }
    // Weight deep-link: scroll to WeightCard and auto-open form
    if (tabId === "weight") {
      setAutoOpenWeightForm(true);
      setTimeout(() => {
        weightCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }
    // Normal sub-tab navigation within Carnet
    setShowRecords(true);
    setActiveTab(tabId);
    ensureVetNotes();
    // Scroll to the records section so user sees the result
    setTimeout(() => {
      recordsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handlePillClick = (pillId) => {
    const tabId = PILL_TO_TAB[pillId];
    if (tabId) handleNavigateToTab(tabId);
  };

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
      {/* ================================================================ */}
      {/* SECTION 1 : STATUS FIRST — Health Dashboard                     */}
      {/* ================================================================ */}
      <div className="px-4 pt-4 space-y-3">
        {/* Health Score */}
        <HealthScoreCard
          score={summary.score}
          scoreLevel={summary.scoreLevel}
          dogName={dog?.name}
        />

        {/* Status Pills — quick glance badges */}
        <StatusPills
          pills={summary.pills}
          onPillClick={handlePillClick}
        />

        {/* Next Action — THE thing to do */}
        <NextActionCard
          action={summary.nextAction}
          onNavigate={handleNavigateToTab}
        />

        {/* Upcoming reminders */}
        <UpcomingReminders records={records} isPremium={isPremium} onNavigate={handleNavigateToTab} />
      </div>

      {/* ================================================================ */}
      {/* SECTION 2 : SMART CARDS — Interpreted data                      */}
      {/* ================================================================ */}
      <div className="px-4 space-y-3">
        {/* Vaccine calendar — WSAVA 2024 reference */}
        <div ref={vaccineCardRef}>
          <VaccineCard
            vaccineMap={summary.vaccineMap}
            dogId={dog?.id}
            onRecordAdded={(rec) => setRecords(prev => [...prev, rec])}
            onFindVet={() => onChangeMainTab?.("findvet")}
            autoExpandKey={autoExpandVaccineKey}
            onAutoExpandConsumed={() => setAutoExpandVaccineKey(null)}
          />
        </div>

        {/* Weight trend with interpretation */}
        <div ref={weightCardRef}>
          <WeightCard
            weightTrend={summary.weightTrend}
            dogName={dog?.name}
            dogId={dog?.id}
            onRecordAdded={(rec) => setRecords(prev => [...prev, rec])}
            autoOpenForm={autoOpenWeightForm}
            onAutoOpenConsumed={() => setAutoOpenWeightForm(false)}
          />
        </div>

        {/* Share button */}
        {dog && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowShareModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-primary/20 bg-primary/5 text-primary text-sm font-semibold"
          >
            <Share2 className="w-4 h-4" /> Partager le carnet
          </motion.button>
        )}
      </div>

      {/* ================================================================ */}
      {/* SECTION 3 : DATA SECOND — Raw records (accordion)               */}
      {/* ================================================================ */}
      <div ref={recordsSectionRef} className="px-4 space-y-3">
        {/* Records accordion header */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => { setShowRecords(!showRecords); ensureVetNotes(); }}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <span>Historique ({allRecords.length})</span>
            </div>
            {allRecords.length > 0 && (showRecords ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
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
                    <p className="text-sm font-semibold text-foreground">Le carnet est pret</p>
                    <p className="text-xs text-muted-foreground mt-1">Utilise l'assistant pour ajouter des entrees</p>
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
              <SectionVaccins records={records} dogId={dog?.id} onDelete={handleDelete} onRecordAdded={(rec) => setRecords(prev => [...prev, rec])} />
            )}
            {activeTab === "weight" && (
              <SectionPoids records={allRecords} dogId={dog?.id} onDelete={handleDelete} onRecordAdded={(rec) => setRecords(prev => [...prev, rec])} />
            )}
            {(activeTab === "vet_visit" || activeTab === "medication" || activeTab === "note") && (
              <PremiumSection
                type={activeTab}
                records={records}
                dogId={dog?.id}
                isPremium={activeTab === "note" ? true : isPremium}
                onDelete={handleDelete}
                onRecordAdded={(rec) => setRecords(prev => [...prev, rec])}
                config={PREMIUM_CONFIGS[activeTab]}
              />
            )}
          </div>
        )}

        {/* QR Code — partage avec le veto */}
        {dog && <div id="qr-code-section"><QRCodeCard dog={dog} /></div>}

        {/* Vet notes */}
        {vetNotes.length > 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Notes de ton veterinaire ({vetNotes.length})
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
