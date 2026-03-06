import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function sanitize(text) {
  if (!text) return '';
  return text
    .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e').replace(/ë/g, 'e')
    .replace(/à/g, 'a').replace(/â/g, 'a').replace(/ä/g, 'a')
    .replace(/ù/g, 'u').replace(/û/g, 'u').replace(/ü/g, 'u')
    .replace(/ô/g, 'o').replace(/ö/g, 'o')
    .replace(/î/g, 'i').replace(/ï/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/É/g, 'E').replace(/È/g, 'E').replace(/Ê/g, 'E')
    .replace(/À/g, 'A').replace(/Â/g, 'A')
    .replace(/Ù/g, 'U').replace(/Û/g, 'U')
    .replace(/Ô/g, 'O')
    .replace(/Î/g, 'I')
    .replace(/Ç/g, 'C')
    .replace(/[^\x00-\x7F]/g, '');
}

export default function DownloadHealthPDF({ dogId, dogName }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("vetAccess", { action: "getHealthSummary", dogId });

      if (!res.data.success) {
        toast.error("Erreur lors de la génération");
        setLoading(false);
        return;
      }

      const { dog, records, checkins } = res.data;
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      const checkPage = (needed = 30) => {
        if (y + needed > 275) { doc.addPage(); y = 20; }
      };

      // Header
      doc.setFillColor(45, 138, 112);
      doc.rect(0, 0, pageW, 42, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(sanitize(`Carnet de santé — ${dog.name}`), 14, 18);
      doc.setFontSize(11);
      doc.text(sanitize([dog.breed, dog.weight ? `${dog.weight} kg` : null, dog.sex === 'male' ? 'Mâle' : dog.sex === 'female' ? 'Femelle' : null].filter(Boolean).join(' · ')), 14, 28);
      doc.setFontSize(9);
      doc.text(sanitize(`Généré le ${formatDate(new Date().toISOString())} via PawCoach`), 14, 37);
      y = 52;

      doc.setTextColor(51, 51, 51);

      // Allergies / Issues
      if (dog.allergies || dog.health_issues) {
        doc.setFillColor(255, 243, 243);
        doc.roundedRect(14, y, pageW - 28, 22, 3, 3, 'F');
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(10);
        doc.text(sanitize('Alertes santé'), 18, y + 8);
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        let alertY = y + 15;
        if (dog.allergies) { doc.text(sanitize(`Allergies : ${dog.allergies}`), 18, alertY); alertY += 5; }
        if (dog.health_issues) { doc.text(sanitize(`Problèmes : ${dog.health_issues}`), 18, alertY); }
        y += 28;
      }

      // Section helper
      const drawSection = (title, items, formatFn) => {
        if (items.length === 0) return;
        checkPage(40);
        doc.setFontSize(13);
        doc.setTextColor(45, 138, 112);
        doc.text(sanitize(title), 14, y);
        y += 3;
        doc.setDrawColor(45, 138, 112);
        doc.setLineWidth(0.5);
        doc.line(14, y, pageW - 14, y);
        y += 7;
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(9);

        items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15).forEach(item => {
          checkPage(14);
          const lines = formatFn(item);
          lines.forEach(line => {
            doc.text(sanitize(line), 18, y);
            y += 5;
          });
          y += 2;
        });
        y += 5;
      };

      // Vaccines
      drawSection('Vaccins', records.filter(r => r.type === 'vaccine'), v => {
        const lines = [`${v.title} — ${formatDate(v.date)}`];
        if (v.next_date) lines.push(`   Prochain rappel : ${formatDate(v.next_date)}`);
        return lines;
      });

      // Weight
      drawSection('Historique du poids', records.filter(r => r.type === 'weight'), w => {
        return [`${w.value} kg — ${formatDate(w.date)}`];
      });

      // Vet visits
      drawSection('Visites vétérinaire', records.filter(r => r.type === 'vet_visit'), v => {
        const lines = [`${v.title} — ${formatDate(v.date)}`];
        if (v.details) lines.push(`   ${v.details.substring(0, 80)}`);
        return lines;
      });

      // Medications
      drawSection('Médicaments', records.filter(r => r.type === 'medication'), m => {
        const lines = [`${m.title} — ${formatDate(m.date)}`];
        if (m.details) lines.push(`   ${m.details.substring(0, 80)}`);
        return lines;
      });

      // Notes
      drawSection('Notes', records.filter(r => r.type === 'note'), n => {
        const lines = [`${n.title} — ${formatDate(n.date)}`];
        if (n.details) lines.push(`   ${n.details.substring(0, 80)}`);
        return lines;
      });

      // Footer on every page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(170, 170, 170);
        doc.text(`PawCoach · Page ${i}/${pageCount}`, pageW / 2, 290, { align: 'center' });
      }

      doc.save(`PawCoach_${(dog.name || 'chien').replace(/\s+/g, '_')}_sante.pdf`);
      toast.success("PDF téléchargé !");
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Erreur lors de la génération du PDF");
    }
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={loading}
      className="gap-2 bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white text-xs font-semibold"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
      {loading ? "Génération..." : "Rapport PDF vétérinaire"}
    </Button>
  );
}