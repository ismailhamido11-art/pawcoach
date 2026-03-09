import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DiagnosisReportView from "./DiagnosisReportView";
import DiagnosisStep2Questions from "./DiagnosisStep2Questions";
import { Loader2, Stethoscope, AlertTriangle, Download, MapPin, Camera, X, Image } from "lucide-react";
import { toast } from "sonner";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

export default function AIDiagnosisModal({ open, onOpenChange, dog, preSelectedSymptom }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  // Steps: form → loading1 → questions → loading2 → report
  const [step, setStep] = useState("form");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Phase 1 results
  const [phase1, setPhase1] = useState(null);

  // Phase 2
  const [userAnswers, setUserAnswers] = useState({});
  const [report, setReport] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const reportDate = new Date().toISOString().split("T")[0];

  // Pre-fill symptoms from shortcut buttons
  useEffect(() => {
    if (open && preSelectedSymptom && step === "form") {
      setSymptoms(preSelectedSymptom);
    }
  }, [open, preSelectedSymptom]);

  const resetAndClose = () => {
    setStep("form");
    setSymptoms("");
    setDuration("");
    setAdditionalInfo("");
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    setPhase1(null);
    setUserAnswers({});
    setReport(null);
    onOpenChange(false);
  };

  const dogAge = dog?.birth_date
    ? `${Math.floor((Date.now() - new Date(dog.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ans`
    : null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
  };

  // STEP 1: Analyze symptoms → get followup questions
  const handleStep1 = async () => {
    if (!symptoms.trim()) return;
    if (!isPremium && !hasCredits) return;
    setStep("loading1");

    try {
      let uploadedUrl = null;
      if (imageFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        uploadedUrl = file_url;
        setImageUrl(uploadedUrl);
      }

      const result = await base44.functions.invoke("preDiagnosis", {
        symptoms,
        duration,
        additional_info: additionalInfo,
        image_url: uploadedUrl,
        dog_name: dog?.name,
        dog_breed: dog?.breed,
        dog_weight: dog?.weight,
        dog_age: dogAge,
        health_issues: dog?.health_issues,
        allergies: dog?.allergies,
      });

      setPhase1(result.data);
      setStep("questions");
      // Consume 1 action credit for the entire diagnostic flow
      if (!isPremium) await consume();
    } catch (e) {
      console.error("handleStep1 error:", e);
      toast.error("Erreur lors de l'analyse. Réessaie.");
      setStep("form");
    }
  };

  // STEP 2: Final diagnosis with answers
  const handleStep2 = async () => {
    setStep("loading2");

    try {
      const user = await base44.auth.me();

      const result = await base44.functions.invoke("finalDiagnosis", {
        symptoms,
        duration,
        additional_info: additionalInfo,
        image_url: imageUrl,
        preliminary_observations: phase1.preliminary_observations,
        followup_questions: phase1.followup_questions,
        user_answers: userAnswers,
        dog_name: dog?.name,
        dog_breed: dog?.breed,
        dog_weight: dog?.weight,
        dog_age: dogAge,
        health_issues: dog?.health_issues,
        allergies: dog?.allergies,
      });

      const diagnosisData = result.data;
      setReport(diagnosisData);

      // Save to DB
      await base44.entities.DiagnosisReport.create({
        dog_id: dog?.id,
        owner_email: user.email,
        dog_name: dog?.name,
        dog_breed: dog?.breed,
        dog_weight: dog?.weight,
        symptoms,
        duration,
        additional_info: additionalInfo,
        diagnosis_text: JSON.stringify(diagnosisData),
        urgency_level: diagnosisData.urgency_level,
        report_date: reportDate,
      });

      toast.success("Rapport sauvegardé dans ton historique");
      setStep("report");
    } catch (e) {
      console.error("handleStep2 error:", e);
      toast.error("Erreur lors du diagnostic final. Réessaie.");
      setStep("questions");
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await base44.functions.invoke("generateDiagnosisPDF", {
        report,
        dog_name: dog?.name,
        dog_breed: dog?.breed,
        dog_weight: dog?.weight,
        symptoms,
        duration,
        report_date: reportDate,
        followup_questions: phase1?.followup_questions,
        user_answers: userAnswers,
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bilan-visite-${dog?.name || "chien"}-${reportDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error("PDF download error:", e);
      toast.error("Erreur lors du téléchargement du PDF");
    }
    setDownloading(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="w-5 h-5 text-primary" />
              {step === "form" || step === "loading1" ? "Préparer le bilan" :
               step === "questions" || step === "loading2" ? "Questions complémentaires" :
               "Bilan complet"}
            </DialogTitle>
            <button
              onClick={resetAndClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        {/* ====== STEP 1: Symptom Form ====== */}
        {step === "form" && (
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Ce bilan t'aide à préparer ta visite vétérinaire. Présente-le à ton véto pour gagner du temps.</span>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</div>
                <span className="text-xs font-medium text-primary">Symptômes</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">2</div>
                <span className="text-xs text-muted-foreground">Questions</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">3</div>
                <span className="text-xs text-muted-foreground">Rapport</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Quels symptômes observes-tu ? *</label>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ex: Mon chien vomit depuis ce matin, il est léthargique et refuse de manger..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Depuis combien de temps ?</label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: Depuis hier soir, depuis 3 jours..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Informations supplémentaires</label>
              <Textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Ex: Il a mangé quelque chose d'inhabituel, changement de routine..."
                className="mt-1 min-h-[60px]"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="text-sm font-medium">Photo des symptômes (optionnel)</label>
              {imagePreview ? (
                <div className="mt-2 relative inline-block">
                  <img src={imagePreview} alt="Symptômes" className="w-full max-h-48 object-cover rounded-xl border" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <label className="mt-1 flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Camera className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Ajouter une photo</p>
                    <p className="text-[10px] text-muted-foreground">Si visible, prends une photo de la zone concernee</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>

            {!isPremium && !hasCredits ? (
              <UpgradePrompt type="action" from="diagnostic" />
            ) : (
              <>
                {!isPremium && credits != null && <CreditBadge remaining={credits} className="mb-2" />}
                <Button
                  onClick={handleStep1}
                  disabled={!symptoms.trim()}
                  className="w-full gradient-primary text-white"
                >
                  Generer le bilan
                </Button>
              </>
            )}
          </div>
        )}

        {/* ====== LOADING 1 ====== */}
        {step === "loading1" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground text-center">
              Preparation du bilan en cours...<br />
              <span className="text-xs">L'IA prepare des questions ciblees pour {dog?.name || "ton chien"}</span>
            </p>
          </div>
        )}

        {/* ====== STEP 2: Followup Questions ====== */}
        {step === "questions" && phase1 && (
          <DiagnosisStep2Questions
            phase1={phase1}
            userAnswers={userAnswers}
            setUserAnswers={setUserAnswers}
            onSubmit={handleStep2}
            dogName={dog?.name}
          />
        )}

        {/* ====== LOADING 2 ====== */}
        {step === "loading2" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground text-center">
              Finalisation du bilan...<br />
              <span className="text-xs">Generation du bilan complet pour {dog?.name || "ton chien"}</span>
            </p>
          </div>
        )}

        {/* ====== STEP 3: Final Report ====== */}
        {step === "report" && report && (
          <div className="space-y-4 mt-2">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">✓</div>
                <span className="text-xs text-green-700">Symptômes</span>
              </div>
              <div className="flex-1 h-px bg-green-300" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">✓</div>
                <span className="text-xs text-green-700">Questions</span>
              </div>
              <div className="flex-1 h-px bg-green-300" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">3</div>
                <span className="text-xs font-medium text-primary">Rapport</span>
              </div>
            </div>

            <DiagnosisReportView report={report} dogName={dog?.name} reportDate={reportDate} />

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              <strong>Présente ce bilan à ton véto !</strong> Il contient tes observations, tes réponses et l'analyse complète. Ton vétérinaire aura tout en main pour la consultation.
            </div>

            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full"
              variant="outline"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Telecharger le bilan PDF
            </Button>

            <Link to={createPageUrl("FindVet")} className="block">
              <Button className="w-full gradient-primary text-white">
                <MapPin className="w-4 h-4 mr-2" />
                Trouver un vétérinaire proche
              </Button>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}