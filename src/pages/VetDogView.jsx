import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Syringe, Weight, Stethoscope, Pill, FileText, Activity, Camera, ClipboardList, PawPrint, AlertTriangle, Smile, Zap, UtensilsCrossed, CheckCircle, ShieldAlert, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import VetNoteForm from "../components/vet/VetNoteForm";
import VetNotesList from "../components/vet/VetNotesList";
import SectionPoids from "../components/notebook/SectionPoids";
import SkeletonPage from "@/components/ui/SkeletonPage";
import EmptyState from "@/components/ui/EmptyState";
import { motion } from "framer-motion";

const ERROR_MESSAGES = {
  "Access denied": "Accès refusé. Tu n'es pas autorisé à consulter ce chien.",
  "No active access": "Aucun accès actif pour ce chien. Demande au propriétaire de te partager un lien valide.",
  "Access expired": "Ton accès à ce chien a expiré. Demande un nouveau lien.",
  "Dog not found": "Chien introuvable.",
  "No dog specified": "Aucun chien spécifié.",
  "Aucun chien spécifié": "Aucun chien spécifié.",
};
const translateError = (msg) => ERROR_MESSAGES[msg] || msg;

export default function VetDogView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dogData, setDogData] = useState(null);
  const [error, setError] = useState(null);
  const [localRecords, setLocalRecords] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const dogId = urlParams.get("dogId");

  useEffect(() => { loadData(); }, [dogId]);

  const loadData = async () => {
    if (!dogId) { setError("Aucun chien spécifié"); setLoading(false); return; }
    try {
      const res = await base44.functions.invoke("vetAccess", { action: "getDogData", dogId });
      if (res.data.error) { setError(translateError(res.data.error)); }
      else { setDogData(res.data); }
    } catch (e) {
      setError(translateError(e?.message || String(e)));
    }
    setLoading(false);
  };

  const handleNoteAdded = (note) => {
    setDogData(prev => ({
      ...prev,
      vetNotes: [...(prev.vetNotes || []), note],
    }));
  };

  if (loading) return <SkeletonPage variant="detail" currentPage="VetDogView" />;
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <p className="text-sm text-red-600 mb-4">{error}</p>
      <Link to={createPageUrl("VetPortal")}><Button variant="outline">Retour au portail</Button></Link>
    </div>
  );

  const { dog, records: rawRecords, checkins, scans, vetNotes, sharedSections } = dogData;
  // localRecords allows optimistic updates (e.g. vet adds a weight entry)
  const records = localRecords ?? rawRecords;
  const handleRecordAdded = (newRecord) => {
    setLocalRecords(prev => [...(prev ?? rawRecords), newRecord]);
  };
  const getIconForType = (type) => {
    const icons = { vaccine: Syringe, weight: Weight, vet_visit: Stethoscope, medication: Pill, note: FileText };
    const Icon = icons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="gradient-primary safe-pt-14 pb-6 px-5 relative overflow-hidden">
        <Link to={createPageUrl("VetPortal")} className="flex items-center gap-1 text-white/80 text-xs mb-3 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="relative z-10 flex items-center gap-4">
          {dog.photo ? (
            <img src={dog.photo} alt={dog.name} loading="lazy" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"><PawPrint className="w-8 h-8 text-white" /></div>
          )}
          <div>
            <h1 className="text-white font-bold text-2xl">{dog.name}</h1>
            <p className="text-white/80 text-xs">{[dog.breed, dog.weight ? `${dog.weight}kg` : null, dog.sex === "male" ? "M" : dog.sex === "female" ? "F" : null].filter(Boolean).join(" · ")}</p>
            {dog.health_issues && <p className="text-white/80 text-[11px] mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {dog.health_issues}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <Tabs defaultValue="records">
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="records" className="text-xs py-2"><ClipboardList className="w-3.5 h-3.5 mr-1" />Carnet</TabsTrigger>
            <TabsTrigger value="checkins" className="text-xs py-2"><Activity className="w-3.5 h-3.5 mr-1" />Check-ins</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs py-2"><Stethoscope className="w-3.5 h-3.5 mr-1" />Mes notes</TabsTrigger>
            <TabsTrigger value="scans" className="text-xs py-2"><Camera className="w-3.5 h-3.5 mr-1" />Scans</TabsTrigger>
          </TabsList>

          {/* Health Records */}
          <TabsContent value="records" className="mt-4 space-y-3">
            {sharedSections.includes("weight") && records.filter(r => r.type === "weight").length > 0 && (
              <SectionPoids records={records} dogId={dogId} onRecordAdded={handleRecordAdded} />
            )}
            {records.length === 0 ? (
              <EmptyState
                mascot="doctor"
                title="Aucun enregistrement partagé"
                description="Le propriétaire n'a pas encore partagé de données de santé."
                className="rounded-3xl border border-border/60 bg-card shadow-sm"
              />
            ) : (
              [...records]
              .filter(r => !(sharedSections.includes("weight") && r.type === "weight"))
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.22, ease: "easeOut" }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-border"
                >
                  <div className="p-2 rounded-lg bg-muted">{getIconForType(r.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.date), "d MMM yyyy", { locale: fr })}</p>
                    {r.details && <p className="text-xs text-muted-foreground mt-1">{r.details}</p>}
                    {r.value && <Badge variant="outline" className="text-[11px] mt-1">{r.value} kg</Badge>}
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Check-ins */}
          <TabsContent value="checkins" className="mt-4 space-y-3">
            {!sharedSections.includes("checkins") ? (
              <EmptyState
                mascot="curious"
                illustration="calendar"
                title="Check-ins non partagés"
                description="Le propriétaire n'a pas partagé les check-ins quotidiens pour le moment."
                className="rounded-3xl border border-border/60 bg-card shadow-sm"
              />
            ) : checkins.length === 0 ? (
              <EmptyState
                mascot="chat"
                illustration="no-results"
                title="Aucun check-in"
                description="Aucun suivi humeur/énergie n'a encore été enregistré pour ce chien."
                className="rounded-3xl border border-border/60 bg-card shadow-sm"
              />
            ) : (
              [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30).map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.22, ease: "easeOut" }}
                  className="p-3 rounded-2xl bg-white border border-border"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{format(new Date(c.date), "EEEE d MMM", { locale: fr })}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[11px] flex items-center gap-1"><Smile className="w-3 h-3" /> {c.mood}/4</Badge>
                      <Badge variant="outline" className="text-[11px] flex items-center gap-1"><Zap className="w-3 h-3" /> {c.energy}/3</Badge>
                      <Badge variant="outline" className="text-[11px] flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {c.appetite}/3</Badge>
                    </div>
                  </div>
                  {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Vet Notes */}
          <TabsContent value="notes" className="mt-4 space-y-4">
            <VetNoteForm dogId={dogId} vetEmail={user?.email} vetName={user?.full_name} onNoteAdded={handleNoteAdded} />
            <VetNotesList notes={vetNotes} />
          </TabsContent>

          {/* Food Scans */}
          <TabsContent value="scans" className="mt-4 space-y-3">
            {!sharedSections.includes("scans") ? (
              <EmptyState
                mascot="camera"
                title="Scans non partagés"
                description="Le propriétaire n'a pas partagé les scans alimentaires pour le moment."
                className="rounded-3xl border border-border/60 bg-card shadow-sm"
              />
            ) : scans.length === 0 ? (
              <EmptyState
                mascot="camera"
                title="Aucun scan alimentaire"
                description="Aucun aliment n'a encore été scanné pour ce chien."
                className="rounded-3xl border border-border/60 bg-card shadow-sm"
              />
            ) : (
              [...scans].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 20).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.22, ease: "easeOut" }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-border"
                >
                  {s.photo_url && <img src={s.photo_url} alt={s.food_name || "Aliment scanné"} loading="lazy" className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.food_name || "Aliment scanné"}</p>
                    <Badge className={`text-[11px] mt-1 ${s.verdict === "safe" ? "bg-emerald-100 text-emerald-700" : s.verdict === "caution" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {s.verdict === "safe" ? <><CheckCircle className="w-3 h-3 inline mr-0.5" />Sûr</> : s.verdict === "caution" ? <><AlertTriangle className="w-3 h-3 inline mr-0.5" />Précaution</> : <><Ban className="w-3 h-3 inline mr-0.5" />Toxique</>} — {s.score}/10
                    </Badge>
                    {s.details && <p className="text-xs text-muted-foreground mt-1">{s.details}</p>}
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}