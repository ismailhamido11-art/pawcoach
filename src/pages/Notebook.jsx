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
import { Syringe, Stethoscope, Weight, Pill, FileText, ShieldCheck, AlertTriangle } from "lucide-react";

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

// Mini Health Dashboard Component
function HealthDashboard({ dog, records }) {
  if (!dog) return null;

  const lastWeight = records.find(r => r.type === 'weight');
  const lastVaccine = records.find(r => r.type === 'vaccine');
  const lastVet = records.find(r => r.type === 'vet_visit');
  const totalRecords = records.length;

  const getTimeSince = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `il y a ${diffDays}j`;
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
    if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
    return `il y a ${Math.floor(diffDays / 365)} an(s)`;
  };

  const stats = [
    {
      label: "Poids",
      value: lastWeight ? `${lastWeight.value} kg` : "—",
      sub: lastWeight ? getTimeSince(lastWeight.date) : "Non renseigné",
      icon: <Weight className="w-4 h-4" />,
      color: lastWeight ? "text-teal-600 bg-teal-50" : "text-orange-500 bg-orange-50",
      missing: !lastWeight
    },
    {
      label: "Vaccins",
      value: lastVaccine ? "À jour" : "—",
      sub: lastVaccine ? getTimeSince(lastVaccine.date) : "Aucun enregistré",
      icon: <Syringe className="w-4 h-4" />,
      color: lastVaccine ? "text-blue-600 bg-blue-50" : "text-orange-500 bg-orange-50",
      missing: !lastVaccine
    },
    {
      label: "Véto",
      value: lastVet ? "OK" : "—",
      sub: lastVet ? getTimeSince(lastVet.date) : "Aucune visite",
      icon: <Stethoscope className="w-4 h-4" />,
      color: lastVet ? "text-purple-600 bg-purple-50" : "text-orange-500 bg-orange-50",
      missing: !lastVet
    }
  ];

  const missingCount = stats.filter(s => s.missing).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      {/* Dog name + health score */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">{dog.name}</span>
          <span className="text-xs text-muted-foreground">{dog.breed} · {dog.weight}kg</span>
        </div>
        {missingCount === 0 ? (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Complet
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
            {missingCount} manquant{missingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, i) => (
          <div key={i} className={`rounded-xl p-2.5 text-center ${stat.missing ? 'bg-orange-50/50 border border-dashed border-orange-200' : 'bg-slate-50'}`}>
            <div className={`w-7 h-7 rounded-full ${stat.color} flex items-center justify-center mx-auto mb-1`}>
              {stat.icon}
            </div>
            <p className="text-xs font-semibold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Empty state hint */}
      {totalRecords === 0 && (
        <p className="text-xs text-center text-muted-foreground mt-3 italic">
          Utilise l'Assistant Santé ci-dessous pour commencer à remplir le carnet
        </p>
      )}
    </div>
  );
}

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
            {dog ? `Le suivi santé intelligent de ${dog.name}` : "Chargement..."}
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Health Dashboard + Assistant - Overlapping header */}
      <div className="px-4 mt-[-28px] relative z-20 space-y-3 mb-4">
        <HealthDashboard dog={dog} records={records} />
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
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Le carnet est vide</p>
                <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                  Utilise l'Assistant Santé ci-dessus pour enregistrer les premières infos de {dog?.name || "ton chien"}
                </p>
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

      <BottomNav currentPage="Notebook" />
    </div>
  );
}