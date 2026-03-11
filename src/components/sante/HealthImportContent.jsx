import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Camera, ClipboardPaste, Sparkles,
  CheckCircle, Loader2, Syringe, Weight,
  Stethoscope, Pill, AlertCircle, StickyNote,
  ChevronRight, Check, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Illustration from "../illustrations/Illustration";

const STEPS = { SELECT: "select", INPUT: "input", ANALYZING: "analyzing", REVIEW: "review", SUCCESS: "success" };

const SOURCES = [
  { id: "file", icon: FileText, label: "Document / PDF", desc: "Ordonnance, bilan de santé, carnet de vaccins", colorClass: "text-primary", bgClass: "bg-primary/10", accept: ".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx,.xls" },
  { id: "photo", icon: Camera, label: "Photo d'un document", desc: "Prends en photo une ordonnance ou un document", colorClass: "text-primary", bgClass: "bg-primary/10", accept: "image/*", capture: "environment" },
  { id: "text", icon: ClipboardPaste, label: "Coller du texte", desc: "Email du vétérinaire, résultats d'analyses", colorClass: "text-primary/80", bgClass: "bg-primary/5", accept: null },
];

const TYPE_CONFIG = {
  vaccine:   { icon: Syringe,     colorClass: "text-emerald-600", label: "Vaccin",      bgClass: "bg-emerald-600/10" },
  vet_visit: { icon: Stethoscope, colorClass: "text-primary",     label: "Visite véto", bgClass: "bg-primary/10" },
  weight:    { icon: Weight,      colorClass: "text-amber-600",   label: "Poids",       bgClass: "bg-amber-600/10" },
  medication:{ icon: Pill,        colorClass: "text-primary/80",  label: "Médicament",  bgClass: "bg-primary/10" },
  allergy:   { icon: AlertCircle, colorClass: "text-red-600",     label: "Allergie",    bgClass: "bg-red-600/10" },
  note:      { icon: StickyNote,  colorClass: "text-muted-foreground", label: "Note",   bgClass: "bg-muted" },
};

const ANALYZING_STEPS = ["Lecture du document", "Analyse IA vétérinaire", "Extraction des données de santé"];

export default function HealthImportContent({ dog, onImported }) {
  const [step, setStep] = useState(STEPS.SELECT);
  const [source, setSource] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [summary, setSummary] = useState("");
  const [docType, setDocType] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const fileInputRef = useRef(null);

  const animateSteps = async () => {
    for (let i = 0; i < ANALYZING_STEPS.length; i++) {
      setAnalyzingStep(i);
      await new Promise(r => setTimeout(r, 1600));
    }
  };

  const isSuspiciousRecord = (record) => {
    if (record.value != null && (record.value < 0 || record.value > 500)) return true;
    if (record.date) {
      const d = new Date(record.date + "T12:00:00");
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (d > oneYearFromNow || d.getFullYear() < 1990) return true;
    }
    return false;
  };

  const processResult = (data) => {
    const extracted = (data?.records || []).filter(r => r.title && r.date);
    setRecords(extracted);
    setSummary(data?.summary || "");
    setDocType(data?.document_type || "");
    const safeIndexes = extracted.map((r, i) => isSuspiciousRecord(r) ? null : i).filter(i => i !== null);
    setSelected(new Set(safeIndexes));
    setStep(STEPS.REVIEW);
  };

  const handleSourceSelect = (src) => {
    setSource(src);
    if (src.id === "text") {
      setStep(STEPS.INPUT);
    } else {
      fileInputRef.current.accept = src.accept;
      if (src.capture) fileInputRef.current.setAttribute("capture", src.capture);
      else fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStep(STEPS.ANALYZING);
    setAnalyzingStep(0);
    try {
      const [, uploadResult] = await Promise.all([
        animateSteps(),
        base44.integrations.Core.UploadFile({ file })
      ]);
      const res = await base44.functions.invoke("parseHealthFile", {
        file_url: uploadResult.file_url, dog_name: dog?.name, dog_breed: dog?.breed,
      });
      processResult(res.data);
    } catch {
      toast.error("Erreur lors de l'analyse. Réessaie.");
      setStep(STEPS.SELECT);
    }
  };

  const analyzeText = async () => {
    if (!textInput.trim()) return;
    setStep(STEPS.ANALYZING);
    setAnalyzingStep(0);
    try {
      const [, res] = await Promise.all([
        animateSteps(),
        base44.functions.invoke("parseHealthFile", { text_content: textInput, dog_name: dog?.name, dog_breed: dog?.breed })
      ]);
      processResult(res.data);
    } catch {
      toast.error("Erreur lors de l'analyse. Réessaie.");
      setStep(STEPS.INPUT);
    }
  };

  const toggleRecord = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleImport = async () => {
    const toImport = records.filter((_, i) => selected.has(i));
    const created = [];
    let failedCount = 0;
    for (const record of toImport) {
      try {
        const r = await base44.entities.HealthRecord.create({
          dog_id: dog.id, type: record.type || "note", title: record.title, date: record.date,
          ...(record.next_date && { next_date: record.next_date }),
          ...(record.details && { details: record.details }),
          ...(record.value && { value: record.value }),
        });
        created.push(r);
      } catch {
        failedCount++;
      }
    }
    if (onImported) onImported(created);
    if (failedCount > 0) {
      toast.warning(`${failedCount} enregistrement${failedCount > 1 ? "s" : ""} n'ont pas pu être importés`);
    }
    setImportedCount(created.length);
    setStep(STEPS.SUCCESS);
  };

  const reset = () => {
    setStep(STEPS.SELECT); setRecords([]); setSelected(new Set());
    setSummary(""); setDocType(""); setTextInput(""); setSource(null);
  };

  return (
    <div className="px-4 py-4">
      <div className="mb-4">
        <h2 className="font-bold text-foreground text-base">Import IA</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          L'IA lit n'importe quel document vétérinaire et extrait les données automatiquement pour {dog?.name || "ton chien"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === STEPS.SELECT && (
          <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-3">
            {SOURCES.map(src => {
              const Icon = src.icon;
              return (
                <motion.button key={src.id} whileTap={{ scale: 0.97 }} onClick={() => handleSourceSelect(src)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-4 text-left hover:border-primary/30 transition-all">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${src.bgClass}`}>
                    <Icon className={`w-[22px] h-[22px] ${src.colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{src.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{src.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </motion.button>
              );
            })}
            <div className="bg-muted/40 rounded-2xl p-3 border border-border/30 text-center">
              <p className="text-xs text-muted-foreground">🔒 Documents analysés de façon sécurisée</p>
            </div>
          </motion.div>
        )}

        {step === STEPS.INPUT && (
          <motion.div key="input" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <Textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={"Exemple :\n\nConsultation du 15/01/2025 — Dr. Martin\nPoids : 12.5 kg\nVaccin Rage effectué — rappel janvier 2028"}
              className="h-44 text-sm font-mono resize-none"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep(STEPS.SELECT); setSource(null); }} className="flex-1">Retour</Button>
              <Button onClick={analyzeText} disabled={!textInput.trim()} className="flex-1 gradient-primary text-white">
                <Sparkles className="w-4 h-4 mr-2" /> Analyser
              </Button>
            </div>
          </motion.div>
        )}

        {step === STEPS.ANALYZING && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12 text-center">
            <div className="relative mb-8">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="font-bold text-foreground text-lg mb-2">Analyse en cours…</h2>
            <div className="space-y-2 w-full max-w-xs mt-4">
              {ANALYZING_STEPS.map((label, i) => (
                <div key={i} className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-border/30 transition-opacity ${analyzingStep >= i ? "opacity-100" : "opacity-30"}`}>
                  {analyzingStep > i ? <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    : analyzingStep === i ? <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />}
                  <span className="text-sm font-medium text-foreground text-left">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === STEPS.REVIEW && (
          <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-24">
            {(summary || docType) && (
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                {docType && <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{docType}</p>}
                {summary && <p className="text-sm text-foreground leading-relaxed">🤖 {summary}</p>}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="font-bold text-foreground text-sm">{records.length} enregistrement{records.length > 1 ? "s" : ""} trouvé{records.length > 1 ? "s" : ""}</p>
              <button
                onClick={() => setSelected(selected.size === records.length ? new Set() : new Set(records.map((_, i) => i)))}
                className="text-xs text-primary font-semibold"
              >
                {selected.size === records.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>
            {records.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-border/30">
                <p className="text-muted-foreground text-sm mb-3">Aucune donnée trouvée</p>
                <Button variant="outline" size="sm" onClick={reset}><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Réessayer</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record, idx) => {
                  const cfg = TYPE_CONFIG[record.type] || TYPE_CONFIG.note;
                  const Icon = cfg.icon;
                  const isSelected = selected.has(idx);
                  const suspicious = isSuspiciousRecord(record);
                  return (
                    <motion.button key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                      whileTap={{ scale: 0.98 }} onClick={() => toggleRecord(idx)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                        suspicious ? "bg-red-50 border-red-300" : isSelected ? "bg-white border-primary/30 shadow-sm" : "bg-white/40 border-border/20 opacity-45"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bgClass}`}>
                        <Icon className={`w-[18px] h-[18px] ${cfg.colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{record.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bgClass} ${cfg.colorClass}`}>{cfg.label}</span>
                          {record.date && <span className="text-xs text-muted-foreground">{record.date}</span>}
                          {record.value != null && <span className="text-xs font-medium text-muted-foreground">{record.value} kg</span>}
                        </div>
                        {record.next_date && <p className="text-xs text-primary mt-1 font-medium">📅 Prochain : {record.next_date}</p>}
                        {suspicious && <p className="text-xs text-red-600 font-bold mt-1">⚠️ Donnée suspecte — vérifier</p>}
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary border-primary" : "border-border bg-white"}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
            {records.length > 0 && selected.size > 0 && (
              <div className="fixed bottom-20 left-5 right-5 z-50">
                <Button onClick={handleImport} className="w-full gradient-primary text-white h-14 rounded-2xl font-bold shadow-xl">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Importer {selected.size} enregistrement{selected.size > 1 ? "s" : ""}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {step === STEPS.SUCCESS && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center py-12 text-center">
            <div className="w-28 h-28 mb-4">
              <Illustration name="veterinary" alt="Import réussi" className="w-full h-full drop-shadow-lg" />
            </div>
            <h2 className="font-bold text-foreground text-xl mb-2">Importé ! 🎉</h2>
            <p className="text-muted-foreground">
              <span className="font-bold text-primary text-xl">{importedCount}</span>{" "}
              enregistrement{importedCount > 1 ? "s" : ""} ajouté{importedCount > 1 ? "s" : ""}<br />
              dans le carnet de <strong>{dog?.name}</strong>
            </p>
            <Button onClick={reset} variant="outline" className="mt-8">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Nouvel import
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  );
}