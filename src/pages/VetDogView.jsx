import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Syringe, Weight, Stethoscope, Pill, FileText, Activity, Camera, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import VetNoteForm from "../components/vet/VetNoteForm";
import VetNotesList from "../components/vet/VetNotesList";
import SectionPoids from "../components/notebook/SectionPoids";

export default function VetDogView() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dogData, setDogData] = useState(null);
  const [error, setError] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const dogId = urlParams.get("dogId");

  useEffect(() => { loadData(); }, [dogId]);

  const loadData = async () => {
    if (!dogId) { setError("Aucun chien spécifié"); setLoading(false); return; }
    try {
      const u = await base44.auth.me();
      setUser(u);
      const res = await base44.functions.invoke("vetAccess", { action: "getDogData", dogId });
      if (res.data.error) { setError(res.data.error); }
      else { setDogData(res.data); }
    } catch (e) {
      setError(e?.message || String(e));
    }
    setLoading(false);
  };

  const handleNoteAdded = (note) => {
    setDogData(prev => ({
      ...prev,
      vetNotes: [...(prev.vetNotes || []), note],
    }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <p className="text-sm text-red-600 mb-4">{error}</p>
      <Link to={createPageUrl("VetPortal")}><Button variant="outline">Retour au portail</Button></Link>
    </div>
  );

  const { dog, records, checkins, scans, vetNotes, sharedSections } = dogData;
  const getIconForType = (type) => {
    const icons = { vaccine: Syringe, weight: Weight, vet_visit: Stethoscope, medication: Pill, note: FileText };
    const Icon = icons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary safe-pt-14 pb-6 px-5 relative overflow-hidden">
        <Link to={createPageUrl("VetPortal")} className="flex items-center gap-1 text-white/80 text-xs mb-3 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="relative z-10 flex items-center gap-4">
          {dog.photo ? (
            <img src={dog.photo} alt={dog.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">🐾</div>
          )}
          <div>
            <h1 className="text-white font-black text-2xl">{dog.name}</h1>
            <p className="text-white/80 text-xs">{[dog.breed, dog.weight ? `${dog.weight}kg` : null, dog.sex === "male" ? "♂" : dog.sex === "female" ? "♀" : null].filter(Boolean).join(" · ")}</p>
            {dog.health_issues && <p className="text-white/70 text-[10px] mt-0.5">⚠️ {dog.health_issues}</p>}
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
              <SectionPoids records={records} dogId={dogId} />
            )}
            {records.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Aucun enregistrement partagé</p>
            ) : (
              [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-border">
                  <div className="p-2 rounded-lg bg-muted">{getIconForType(r.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">{format(new Date(r.date), "d MMM yyyy", { locale: fr })}</p>
                    {r.details && <p className="text-xs text-muted-foreground mt-1">{r.details}</p>}
                    {r.value && <Badge variant="outline" className="text-[10px] mt-1">{r.value} kg</Badge>}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Check-ins */}
          <TabsContent value="checkins" className="mt-4 space-y-3">
            {!sharedSections.includes("checkins") ? (
              <p className="text-center text-sm text-muted-foreground py-8">Check-ins non partagés</p>
            ) : checkins.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Aucun check-in</p>
            ) : (
              [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30).map(c => (
                <div key={c.id} className="p-3 rounded-xl bg-white border border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{format(new Date(c.date), "EEEE d MMM", { locale: fr })}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px]">😊 {c.mood}/4</Badge>
                      <Badge variant="outline" className="text-[10px]">⚡ {c.energy}/3</Badge>
                      <Badge variant="outline" className="text-[10px]">🍽️ {c.appetite}/3</Badge>
                    </div>
                  </div>
                  {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                </div>
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
              <p className="text-center text-sm text-muted-foreground py-8">Scans non partagés</p>
            ) : scans.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Aucun scan alimentaire</p>
            ) : (
              [...scans].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 20).map(s => (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-border">
                  {s.photo_url && <img src={s.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.food_name || "Aliment scanné"}</p>
                    <Badge className={`text-[10px] mt-1 ${s.verdict === "safe" ? "bg-green-100 text-green-700" : s.verdict === "caution" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {s.verdict === "safe" ? "✅ Sûr" : s.verdict === "caution" ? "⚠️ Précaution" : "🚫 Toxique"} — {s.score}/10
                    </Badge>
                    {s.details && <p className="text-xs text-muted-foreground mt-1">{s.details}</p>}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}