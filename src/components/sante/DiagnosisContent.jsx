import { useState } from "react";
import AIDiagnosisModal from "../vet/AIDiagnosisModal";
import { Button } from "@/components/ui/button";
import { Stethoscope, Phone, ExternalLink } from "lucide-react";
import Illustration from "../illustrations/Illustration";
import { motion } from "framer-motion";

const SYMPTOM_SHORTCUTS = [
  { emoji: "🤮", label: "Vomissements" },
  { emoji: "💩", label: "Diarrhée" },
  { emoji: "😴", label: "Fatigue" },
  { emoji: "🍽️", label: "Perte d'appétit" },
  { emoji: "🐾", label: "Boite" },
  { emoji: "👁️", label: "Problème oculaire" },
  { emoji: "😤", label: "Respiration difficile" },
  { emoji: "🩸", label: "Saignement" },
];

export default function DiagnosisContent({ dog }) {
  const [showModal, setShowModal] = useState(false);
  const [preSelectedSymptom, setPreSelectedSymptom] = useState(null);

  const openWithSymptom = (symptom) => {
    setPreSelectedSymptom(symptom);
    setShowModal(true);
  };

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
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
          <p className="text-[10px] font-bold text-emerald-700 mt-1.5">À présenter à ton vétérinaire</p>
        </div>
      </div>

      {/* Shortcut buttons */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Symptômes fréquents</p>
        <div className="grid grid-cols-4 gap-2">
          {SYMPTOM_SHORTCUTS.map(({ emoji, label }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.92 }}
              onClick={() => openWithSymptom(label)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white border border-border text-center hover:border-emerald-300 hover:bg-emerald-50 transition-all"
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[10px] font-medium text-foreground leading-tight">{label}</span>
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
        <p className="font-bold text-sm text-foreground">🚨 En cas d'urgence</p>
        <a
          href="tel:3115"
          className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl"
        >
          <Phone className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-700">Urgence vétérinaire nationale</p>
            <p className="text-sm font-black text-red-600">3115</p>
          </div>
        </a>
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
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 opacity-70"
        >
          <Illustration name="veterinary" alt="Vétérinaire" className="w-full h-full drop-shadow" />
        </motion.div>
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
    </div>
  );
}