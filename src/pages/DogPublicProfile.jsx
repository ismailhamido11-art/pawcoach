import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Syringe, Weight, Stethoscope, Pill, AlertTriangle, Heart, Calendar, MapPin, PawPrint, Phone, ShieldCheck, FileText, Loader2 } from "lucide-react";

// Public page — no login required
// URL: /DogPublicProfile?dogId=xxx

function getAge(birth_date) {
  if (!birth_date) return null;
  const birth = new Date(birth_date);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths} mois`;
  if (years === 1) return `1 an`;
  return `${years} ans`;
}

const TYPE_CONFIG = {
  vaccine:    { icon: Syringe,    label: "Vaccin",      color: "#2d9f82", bg: "#2d9f8215" },
  weight:     { icon: Weight,     label: "Poids",       color: "#3b82f6", bg: "#3b82f615" },
  vet_visit:  { icon: Stethoscope,label: "Visite véto", color: "#8b5cf6", bg: "#8b5cf615" },
  medication: { icon: Pill,       label: "Médicament",  color: "#10b981", bg: "#10b98115" },
  note:       { icon: FileText,   label: "Note",        color: "#6b7280", bg: "#6b728015" },
};

function RecordItem({ record }) {
  const cfg = TYPE_CONFIG[record.type] || TYPE_CONFIG.note;
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
        <Icon style={{ color: cfg.color, width: 15, height: 15 }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 truncate">{record.title}</p>
          <span className="text-[10px] text-slate-400 flex-shrink-0">{record.date}</span>
        </div>
        {record.details && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{record.details}</p>}
        {record.type === 'weight' && record.value && (
          <span className="text-xs font-bold text-blue-600">{record.value} kg</span>
        )}
        {record.next_date && (
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-amber-600 font-medium">Rappel : {record.next_date}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-border">
      <Icon style={{ color, width: 18, height: 18 }} />
      <p className="text-sm font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

export default function DogPublicProfile() {
  const params = new URLSearchParams(window.location.search);
  const dogId = params.get("dogId");

  const [dog, setDog] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!dogId) { setError(true); setLoading(false); return; }
    (async () => {
      try {
        // Public read — no auth needed
        const dogs = await base44.entities.Dog.filter({ id: dogId });
        if (!dogs?.length) { setError(true); return; }
        setDog(dogs[0]);
        const recs = await base44.entities.HealthRecord.filter({ dog_id: dogId });
        setRecords((recs || []).sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [dogId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500">Chargement du dossier…</p>
        </div>
      </div>
    );
  }

  if (error || !dog) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <PawPrint className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-700">Dossier introuvable</h1>
          <p className="text-sm text-slate-400 mt-2">Ce lien est invalide ou a expiré.</p>
        </div>
      </div>
    );
  }

  const vaccines = records.filter(r => r.type === "vaccine");
  const meds = records.filter(r => r.type === "medication");
  const weights = records.filter(r => r.type === "weight");
  const vetVisits = records.filter(r => r.type === "vet_visit");
  const lastWeight = weights[0];

  const hasAllergies = dog.allergies && dog.allergies.toLowerCase() !== "non" && dog.allergies !== "null";
  const hasHealthIssues = dog.health_issues && dog.health_issues.toLowerCase() !== "non" && dog.health_issues !== "null";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Emergency Banner */}
      <div className="bg-red-600 text-white text-center py-2 px-4">
        <p className="text-xs font-bold tracking-wide uppercase">
          🚨 Dossier d'urgence — PawCoach
        </p>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] px-5 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 relative z-10"
        >
          {dog.photo ? (
            <img src={dog.photo} alt={dog.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-xl flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <PawPrint className="w-10 h-10 text-white/70" />
            </div>
          )}
          <div>
            <h1 className="text-white text-3xl font-black">{dog.name}</h1>
            <p className="text-white/80 text-sm font-medium mt-0.5">
              {dog.breed}{dog.birth_date ? ` · ${getAge(dog.birth_date)}` : ""}
              {dog.sex ? ` · ${dog.sex === "male" ? "Mâle" : "Femelle"}` : ""}
            </p>
            {lastWeight && (
              <p className="text-white/70 text-xs mt-1">{lastWeight.value} kg</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats rapides */}
      <div className="px-4 -mt-4 mb-4">
        <div className="grid grid-cols-3 gap-2">
          <StatPill icon={Syringe} value={vaccines.length} label="Vaccins" color="#2d9f82" />
          <StatPill icon={Stethoscope} value={vetVisits.length} label="Visites" color="#8b5cf6" />
          <StatPill icon={Pill} value={meds.length} label="Médoc." color="#10b981" />
        </div>
      </div>

      <div className="px-4 space-y-4 pb-16">

        {/* ALERTES CRITIQUES */}
        {(hasAllergies || hasHealthIssues) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-sm font-black text-red-700 uppercase tracking-wide">⚠️ Informations critiques</h2>
            </div>
            {hasAllergies && (
              <div className="mb-2">
                <p className="text-xs font-bold text-red-600 uppercase">Allergies</p>
                <p className="text-sm text-red-800 font-medium mt-0.5">{dog.allergies}</p>
              </div>
            )}
            {hasHealthIssues && (
              <div>
                <p className="text-xs font-bold text-red-600 uppercase">Problèmes de santé</p>
                <p className="text-sm text-red-800 font-medium mt-0.5">{dog.health_issues}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Infos générales */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Profil</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {dog.breed && (
              <div><p className="text-[10px] text-slate-400">Race</p><p className="font-semibold text-slate-700">{dog.breed}</p></div>
            )}
            {dog.birth_date && (
              <div><p className="text-[10px] text-slate-400">Âge</p><p className="font-semibold text-slate-700">{getAge(dog.birth_date)}</p></div>
            )}
            {dog.weight && (
              <div><p className="text-[10px] text-slate-400">Poids</p><p className="font-semibold text-slate-700">{dog.weight} kg</p></div>
            )}
            {dog.sex && (
              <div><p className="text-[10px] text-slate-400">Sexe</p><p className="font-semibold text-slate-700">{dog.sex === "male" ? "Mâle" : "Femelle"}</p></div>
            )}
            {dog.neutered !== undefined && dog.neutered !== null && (
              <div><p className="text-[10px] text-slate-400">Stérilisé</p><p className="font-semibold text-slate-700">{dog.neutered ? "Oui" : "Non"}</p></div>
            )}
            {dog.activity_level && (
              <div><p className="text-[10px] text-slate-400">Activité</p><p className="font-semibold text-slate-700">{dog.activity_level}</p></div>
            )}
          </div>
        </div>

        {/* Vétérinaire */}
        {(dog.vet_name || dog.vet_city) && (
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
            <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Vétérinaire habituel</h2>
            {dog.vet_name && <p className="text-sm font-bold text-slate-800">{dog.vet_name}</p>}
            {dog.vet_city && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-purple-500" />
                <p className="text-xs text-purple-700">{dog.vet_city}</p>
              </div>
            )}
          </div>
        )}

        {/* Historique de santé */}
        {records.length > 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="px-4 pt-4 pb-2 border-b border-border">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Historique médical</h2>
            </div>
            <div className="px-4">
              {records.filter(r => r.type === 'vaccine' || r.type === 'weight').slice(0, 15).map(r => <RecordItem key={r.id} record={r} />)}
            </div>
          </div>
        )}

        {records.length === 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Aucun historique médical enregistré</p>
          </div>
        )}

        {/* Footer PawCoach */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 bg-white border border-border rounded-full px-4 py-2 shadow-sm">
            <PawPrint className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-600">Dossier géré via</span>
            <span className="text-xs font-black text-emerald-700">PawCoach</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Ce dossier est partagé par le propriétaire. PawCoach n'est pas un service vétérinaire.</p>
        </div>
      </div>
    </div>
  );
}