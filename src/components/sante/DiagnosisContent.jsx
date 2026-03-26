import { useState } from "react";
import AIDiagnosisModal from "../vet/AIDiagnosisModal";
import { Button } from "@/components/ui/button";
import { Stethoscope, Phone, ExternalLink, AlertTriangle, ThumbsDown, Bed, UtensilsCrossed, PawPrint, Eye, Wind, Droplets } from "lucide-react";
import Illustration from "../illustrations/Illustration";
import StorysetIllustration from "@/components/ui/StorysetIllustration";
import { motion } from "framer-motion";

const SYMPTOM_SHORTCUTS = [
  { Icon: ThumbsDown, color: "text-amber-600", label: "Vomissements" },
  { Icon: AlertTriangle, color: "text-amber-500", label: "Diarrhée" },
  { Icon: Bed, color: "text-blue-500", label: "Fatigue" },
  { Icon: UtensilsCrossed, color: "text-rose-500", label: "Perte d'appétit" },
  { Icon: PawPrint, color: "text-emerald-600", label: "Boite" },
  { Icon: Eye, color: "text-blue-600", label: "Problème oculaire" },
  { Icon: Wind, color: "text-slate-500", label: "Respiration difficile" },
  { Icon: Droplets, color: "text-red-500", label: "Saignement" },
];

export default function DiagnosisContent({ dog }) {
  const [showModal, setShowModal] = useState(false);
  const [preSelectedSymptom, setPreSelectedSymptom] = useState(null);

  const openWithSymptom = (symptom) => {
    setPreSelectedSymptom(symptom);
    setShowModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="px-4 pt-4 pb-4 space-y-4"
    >
      {/* Hero card */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-7 h-7 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground text-sm leading-tight">Bilan de préparation visite</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Prépare ta visite chez le véto : décris ce que tu observes chez {dog?.name || "ton chien"} et obtiens un bilan structuré à présenter à ton vétérinaire.
          </p>
          <p className="text-[11px] font-bold text-emerald-700 mt-1.5">À présenter à ton vétérinaire</p>
        </div>
      </div>

      {/* Shortcut buttons */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Symptômes fréquents</p>
        <div className="grid grid-cols-4 gap-2">
          {SYMPTOM_SHORTCUTS.map(({ Icon: SI, color, label }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => openWithSymptom(label)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white border border-border text-center hover:border-emerald-300 hover:bg-emerald-50 transition-all"
            >
              <SI className={`w-5 h-5 ${color}`} />
              <span className="text-[11px] font-medium text-foreground leading-tight">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <Button
        onClick={() => { setPreSelectedSymptom(null); setShowModal(true); }}
        className="w-full h-14 gradient-primary border-0 text-white font-bold rounded-2xl shadow-lg shadow-primary/25"
      >
        <Stethoscope className="w-4 h-4 mr-2" />
        Préparer mon bilan
      </Button>

      {/* Emergency section */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="font-bold text-sm text-foreground flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-600" /> En cas d'urgence</p>
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <Phone className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">En cas d'urgence, contacte ton vétérinaire habituel ou les urgences vétérinaires de ta ville.</p>
        </div>
        <a
          href="tel:0140050670"
          className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl"
        >
          <Phone className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-700">Centre antipoison vétérinaire (CNITV)</p>
            <p className="text-sm font-black text-red-600">01 40 05 06 70</p>
          </div>
        </a>
        <a
          href="https://www.google.com/maps/search/urgences+vétérinaires+à+proximité"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-700">Urgences vétérinaires</p>
            <p className="text-xs text-blue-600">Trouver une clinique ouverte maintenant</p>
          </div>
        </a>
      </div>

      {/* Illustration */}
      <div className="flex justify-center">
        <StorysetIllustration name="diagnosis" className="w-36 h-36 mx-auto" />
      </div>

      {/* AI Diagnosis Modal */}
      {dog && (
        <AIDiagnosisModal
          open={showModal}
          onOpenChange={setShowModal}
          dog={dog}
          preSelectedSymptom={preSelectedSymptom}
        />
      )}
    </motion.div>
  );
}