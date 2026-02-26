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
import { Syringe, Stethoscope, Weight, Pill, FileText } from "lucide-react";

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
    addLabel: "Ajouter un médicament",
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

export default function Notebook() {
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const dogs = await base44.entities.Dog.filter({ owner: u.email });
    if (dogs.length > 0) {
      setDog(dogs[0]);
      const recs = await base44.entities.HealthRecord.filter({ dog_id: dogs[0].id });
      setRecords(recs);
    }
  };

  const handleAdd = (rec) => setRecords(prev => [...prev, rec]);
  const handleDelete = async (id) => {
    await base44.entities.HealthRecord.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const isPremium = user?.role === "admin";
  const activeTabLabel = TABS.find(t => t.id === activeTab)?.shortLabel;
  const countForTab = (id) => id === "all" ? records.length : records.filter(r => r.type === id).length;

  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const getIconForType = (type) => {
    switch (type) {
      case 'vaccine': return <Syringe className="w-4 h-4 text-blue-600" />;
      case 'weight': return <Weight className="w-4 h-4 text-teal-600" />;
      case 'vet_visit': return <Stethoscope className="w-4 h-4 text-purple-600" />;
      case 'medication': return <Pill className="w-4 h-4 text-amber-600" />;
      case 'note': return <FileText className="w-4 h-4 text-gray-600" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };
  const getAccentClassForType = (type) => {
    switch (type) {
      case 'vaccine': return "bg-blue-50 border-blue-100";
      case 'weight': return "bg-teal-50 border-teal-100";
      case 'vet_visit': return "bg-purple-50 border-purple-100";
      case 'medication': return "bg-amber-50 border-amber-100";
      case 'note': return "bg-gray-50 border-gray-200";
      default: return "bg-muted border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      {/* Header */}
      <div className="gradient-primary pt-10 pb-10 px-5 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-white font-bold text-2xl mb-2">Carnet de santé</h1>
          <p className="text-white/90 text-sm leading-relaxed">
            {dog ? `L'Assistant Santé intelligent est là pour le suivi de ${dog.name}. Raconte-lui votre dernière visite, un nouveau vaccin, ou scanne un document !` : "Chargement..."}
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      <div className="px-5 mt-[-28px] relative z-20 mb-6">
         <SmartHealthAssistant dogId={dog?.id} onRecordAdded={handleAdd} inline={true} />
      </div>

      <UpcomingReminders records={records} isPremium={isPremium} />

      {/* Tab bar */}
      <div className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="flex overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 text-xs font-semibold border-b-2 transition-all relative ${
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
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <div className="px-4 pt-4">
        {activeTab === "all" && (
          <div className="space-y-3">
            {sortedRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Aucun événement enregistré</div>
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

      <BottomNav currentPage="Notebook" />
    </div>
  );
}