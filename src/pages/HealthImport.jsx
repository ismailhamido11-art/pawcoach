import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";
import {
  FileText, Camera, ClipboardPaste, Sparkles,
  CheckCircle, ArrowLeft, Loader2, Syringe, Weight,
  Stethoscope, Pill, AlertCircle, StickyNote,
  ChevronRight, Check, Upload, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Illustration from "../components/illustrations/Illustration";
import BottomNav from "../components/BottomNav";

const STEPS = { SELECT: "select", INPUT: "input", ANALYZING: "analyzing", REVIEW: "review", SUCCESS: "success" };

const SOURCES = [
  {
    id: "file",
    icon: FileText,
    label: "Document / PDF",
    desc: "Ordonnance, bilan de santé, carnet de vaccins scanné",
    color: "#2d9f82",
    accept: ".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx,.xls"
  },
  {
    id: "photo",
    icon: Camera,
    label: "Photo d'un document",
    desc: "Prends en photo une ordonnance ou un document papier",
    color: "#10b981",
    accept: "image/*",
    capture: "environment"
  },
  {
    id: "text",
    icon: ClipboardPaste,
    label: "Coller du texte",
    desc: "Email du vétérinaire, résultats d'analyses, compte-rendu",
    color: "#8b5cf6",
    accept: null
  },
];

const TYPE_CONFIG = {
  vaccine:   { icon: Syringe,      color: "#2d9f82", label: "Vaccin",       bg: "#2d9f8218" },
  vet_visit: { icon: Stethoscope,  color: "#3b82f6", label: "Visite véto",  bg: "#3b82f618" },
  weight:    { icon: Weight,       color: "#10b981", label: "Poids",        bg: "#10b98118" },
  medication:{ icon: Pill,         color: "#8b5cf6", label: "Médicament",   bg: "#8b5cf618" },
  allergy:   { icon: AlertCircle,  color: "#ef4444", label: "Allergie",     bg: "#ef444418" },
  note:      { icon: StickyNote,   color: "#64748b", label: "Note",         bg: "#64748b18" },
};

const ANALYZING_STEPS_LABELS = [
  "Lecture du document",
  "Analyse IA vétérinaire",
  "Extraction des données de santé",
];

export default function HealthImport() {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const [step, setStep] = useState(STEPS.SELECT);
  const [source, setSource] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [summary, setSummary] = useState("");
  const [docType, setDocType] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [dog, setDog] = useState(null);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs?.length > 0) setDog(getActiveDog(dogs));
    })();
  }, []);

  const animateSteps = async () => {
    for (let i = 0; i < ANALYZING_STEPS_LABELS.length; i++) {
      setAnalyzingStep(i);
      await new Promise(r => setTimeout(r, 1600));
    }
  };

  const isSuspiciousRecord = (record) => {
    if (record.value != null && (record.value < 0 || record.value > 500)) return true;
    if (record.title && /<[^>]*script/i.test(record.title)) return true;
    if (record.details && /<[^>]*script/i.test(record.details)) return true;
    if (record.date && /^(9999|0000)/.test(record.date)) return true;
    if (record.next_date && /^(9999|0000)/.test(record.next_date)) return true;
    // Flag dates more than 1 year in the future (for main date, not next_date which is expected future)
    if (record.date) {
      const d = new Date(record.date + "T12:00:00");
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (d > oneYearFromNow) return true;
      // Flag dates before 1990 (likely fabricated)
      if (d.getFullYear() < 1990) return true;
    }
    return false;
  };

  const processResult = (data) => {
    const extracted = (data?.records || []).filter(r => r.title && r.date);
    setRecords(extracted);
    setSummary(data?.summary || "");
    setDocType(data?.document_type || "");
    // Only auto-select records that are NOT suspicious
    const safeIndexes = extracted
      .map((r, i) => isSuspiciousRecord(r) ? null : i)
      .filter(i => i !== null);
    setSelected(new Set(safeIndexes));
    setStep(STEPS.REVIEW);
  };

  const handleSourceSelect = (src) => {
    if (!isPremium && !hasCredits) {
      toast.error("Plus d'actions IA disponibles aujourd'hui");
      return;
    }
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
        file_url: uploadResult.file_url,
        dog_name: dog?.name,
        dog_breed: dog?.breed,
      });
      processResult(res.data);
      if (!isPremium) await consume();
    } catch (err) {
      toast.error("Erreur lors de l'analyse. Réessaie avec un autre document.");
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
        base44.functions.invoke("parseHealthFile", {
          text_content: textInput,
          dog_name: dog?.name,
          dog_breed: dog?.breed,
        })
      ]);
      processResult(res.data);
      if (!isPremium) await consume();
    } catch (err) {
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
    for (const record of toImport) {
      const created = await base44.entities.HealthRecord.create({
        dog_id: dog.id,
        type: record.type || "note",
        title: record.title,
        date: record.date,
        ...(record.next_date && { next_date: record.next_date }),
        ...(record.details && { details: record.details }),
        ...(record.value && { value: record.value }),
      });
      // Auto-update Dog.weight when importing weight records
      if (record.type === "weight" && record.value) {
        try { await base44.entities.Dog.update(dog.id, { weight: record.value }); } catch {}
      }
    }
    setImportedCount(toImport.length);
    setStep(STEPS.SUCCESS);
  };

  const reset = () => {
    setStep(STEPS.SELECT);
    setRecords([]);
    setSelected(new Set());
    setSummary("");
    setDocType("");
    setTextInput("");
    setSource(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-5 safe-pt-14 pb-6 relative overflow-hidden">
        <Link to={createPageUrl("Sante")} className="relative z-20 inline-flex items-center gap-2 text-white/80 text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Carnet de santé
        </Link>
        <div className="relative z-10 flex items-end gap-3">
          <div className="flex-1 pb-1">
            <h1 className="text-white font-black text-2xl">Import IA</h1>
            <p className="text-white/70 text-sm">
              {dog ? `Données de santé pour ${dog.name}` : "Importe des données de santé"}
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-28 h-28 flex-shrink-0"
          >
            <Illustration name="veterinary" alt="Import IA" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      <div className="px-5 py-6">
        <AnimatePresence mode="wait">

          {/* ─── SELECT SOURCE ─── */}
          {step === STEPS.SELECT && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                L'IA lit et comprend <strong>n'importe quel document</strong> vétérinaire et extrait automatiquement toutes les données de santé
              </p>

              {SOURCES.map(src => {
                const Icon = src.icon;
                return (
                  <motion.button
                    key={src.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSourceSelect(src)}
                    className="w-full bg-white rounded-2xl p-5 shadow-sm border border-border/50 flex items-center gap-4 text-left hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${src.color}15` }}>
                      <Icon style={{ color: src.color, width: 24, height: 24 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{src.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{src.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                );
              })}

              <div className="bg-muted/40 rounded-2xl p-4 border border-border/30 mt-2">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  🔒 Tes documents sont analysés de façon sécurisée et ne sont jamais partagés.<br />
                  L'IA comprend les documents médicaux en <strong>français</strong>, anglais et d'autres langues.
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── TEXT INPUT ─── */}
          {step === STEPS.INPUT && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div>
                <p className="font-semibold text-foreground mb-1">Colle ton texte ici</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Email du vétérinaire, résultats d'analyses, compte-rendu de consultation...
                </p>
                <Textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={"Exemple :\n\nConsultation du 15/01/2025 — Dr. Martin\nPoids : 12.5 kg (+0.5kg)\nVaccin Rage effectué — rappel en janvier 2028\nTraitement : Frontline spray, 1x/mois\nProchain RDV : 15/04/2025"}
                  className="h-52 text-sm font-mono resize-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep(STEPS.SELECT); setSource(null); }} className="flex-1">
                  Retour
                </Button>
                <Button onClick={analyzeText} disabled={!textInput.trim()} className="flex-1 gradient-primary text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser avec l'IA
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── ANALYZING ─── */}
          {step === STEPS.ANALYZING && (
            <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16 text-center">
              <div className="relative mb-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Sparkles className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>
              </div>

              <h2 className="font-bold text-foreground text-xl mb-2">Analyse en cours...</h2>
              <p className="text-sm text-muted-foreground mb-8">L'IA lit et comprend ton document</p>

              <div className="space-y-2.5 w-full max-w-xs">
                {ANALYZING_STEPS_LABELS.map((label, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: analyzingStep >= i ? 1 : 0.2, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-border/30"
                  >
                    {analyzingStep > i ? (
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : analyzingStep === i ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground text-left">{label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── REVIEW ─── */}
          {step === STEPS.REVIEW && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 pb-28">
              {/* AI Summary */}
              {(summary || docType) && (
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                  {docType && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{docType}</p>
                  )}
                  {summary && (
                    <p className="text-sm text-foreground leading-relaxed">🤖 {summary}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">
                    {records.length} enregistrement{records.length > 1 ? "s" : ""} trouvé{records.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{selected.size} sélectionné{selected.size > 1 ? "s" : ""} pour import</p>
                </div>
                <button
                  onClick={() => setSelected(selected.size === records.length ? new Set() : new Set(records.map((_, i) => i)))}
                  className="text-xs text-primary font-semibold"
                >
                  {selected.size === records.length ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
              </div>

              {records.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-border/30">
                  <div className="w-24 h-24 mx-auto mb-3 opacity-70">
                    <Illustration name="cautiousDog" alt="Aucune donnée" className="w-full h-full" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">Aucune donnée de santé trouvée</p>
                  <p className="text-xs text-muted-foreground mb-4">Essaie avec un document plus détaillé</p>
                  <Button variant="outline" size="sm" onClick={reset}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Réessayer
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {records.map((record, idx) => {
                    const cfg = TYPE_CONFIG[record.type] || TYPE_CONFIG.note;
                    const Icon = cfg.icon;
                    const isSelected = selected.has(idx);
                    const suspicious = isSuspiciousRecord(record);
                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleRecord(idx)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          suspicious
                            ? "bg-red-50 border-red-300"
                            : isSelected
                            ? "bg-white border-primary/30 shadow-sm"
                            : "bg-white/40 border-border/20 opacity-45"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                          <Icon style={{ color: cfg.color, width: 18, height: 18 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{record.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            {record.date && <span className="text-xs text-muted-foreground">{record.date}</span>}
                            {record.value != null && <span className="text-xs font-medium text-muted-foreground">{record.value} kg</span>}
                          </div>
                          {record.details && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.details}</p>
                          )}
                          {record.next_date && (
                            <p className="text-xs text-primary mt-1 font-medium">📅 Prochain : {record.next_date}</p>
                          )}
                          {suspicious && (
                            <p className="text-xs text-red-600 font-bold mt-1">⚠️ Donnée suspecte — vérifier avant import</p>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? "bg-primary border-primary" : "border-border bg-white"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── SUCCESS ─── */}
          {step === STEPS.SUCCESS && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="flex flex-col items-center py-16 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 12, delay: 0.15 }}
                className="w-32 h-32 mb-6"
              >
                <Illustration name="veterinary" alt="Import réussi" className="w-full h-full drop-shadow-lg" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="font-bold text-foreground text-2xl mb-3">Importé ! 🎉</h2>
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-bold text-primary text-xl">{importedCount}</span>{" "}
                  enregistrement{importedCount > 1 ? "s" : ""} ajouté{importedCount > 1 ? "s" : ""}<br />
                  au carnet de santé de <strong>{dog?.name}</strong>
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex gap-3 mt-10 w-full">
                <Button variant="outline" onClick={reset} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Nouvel import
                </Button>
                <Button asChild className="flex-1 gradient-primary text-white">
                  <Link to={createPageUrl("Sante")}>Voir le carnet</Link>
                </Button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Sticky import button */}
        {step === STEPS.REVIEW && records.length > 0 && selected.size > 0 && (
          <div className="fixed left-5 right-5 z-50" style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={handleImport}
                className="w-full gradient-primary text-white h-14 rounded-2xl font-bold text-base shadow-2xl"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Importer {selected.size} enregistrement{selected.size > 1 ? "s" : ""}
              </Button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <BottomNav currentPage="Sante" />
    </div>
  );
}