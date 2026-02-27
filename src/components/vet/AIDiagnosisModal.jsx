import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DiagnosisReportView from "./DiagnosisReportView";
import { Loader2, Stethoscope, AlertTriangle, Download, MapPin } from "lucide-react";

export default function AIDiagnosisModal({ open, onOpenChange, dog }) {
  const [step, setStep] = useState("form"); // form | loading | report
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [report, setReport] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const reportDate = new Date().toISOString().split("T")[0];

  const resetAndClose = () => {
    setStep("form");
    setSymptoms("");
    setDuration("");
    setAdditionalInfo("");
    setReport(null);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!symptoms.trim()) return;
    setStep("loading");

    const dogAge = dog?.birth_date
      ? `${Math.floor((Date.now() - new Date(dog.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ans`
      : null;

    const user = await base44.auth.me();

    const result = await base44.functions.invoke("preDiagnosis", {
      symptoms,
      duration,
      additional_info: additionalInfo,
      dog_name: dog?.name,
      dog_breed: dog?.breed,
      dog_weight: dog?.weight,
      dog_age: dogAge,
      health_issues: dog?.health_issues,
      allergies: dog?.allergies,
    });

    const diagnosisData = result.data;
    setReport(diagnosisData);

    // Save report to DB
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

    setStep("report");
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    const res = await base44.functions.invoke("generateDiagnosisPDF", {
      report,
      dog_name: dog?.name,
      dog_breed: dog?.breed,
      dog_weight: dog?.weight,
      symptoms,
      duration,
      report_date: reportDate,
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prediagnostic-${dog?.name || "chien"}-${reportDate}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    setDownloading(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="w-5 h-5 text-primary" />
            Pré-diagnostic IA
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Cet outil ne remplace pas un vétérinaire. Il prépare un rapport préliminaire pour faciliter votre consultation.</span>
            </div>

            <div>
              <label className="text-sm font-medium">Quels symptômes observez-vous ? *</label>
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

            <Button
              onClick={handleSubmit}
              disabled={!symptoms.trim()}
              className="w-full gradient-primary text-white"
            >
              Analyser les symptômes
            </Button>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground text-center">
              Analyse en cours...<br />
              <span className="text-xs">L'IA examine les symptômes de {dog?.name || "votre chien"}</span>
            </p>
          </div>
        )}

        {step === "report" && report && (
          <div className="space-y-4 mt-2">
            <DiagnosisReportView report={report} dogName={dog?.name} reportDate={reportDate} />

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              <strong>Conservez ce rapport !</strong> Il contient des informations datées qui aideront votre vétérinaire à mieux comprendre la situation lors de votre consultation.
            </div>

            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full"
              variant="outline"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Télécharger le rapport PDF
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