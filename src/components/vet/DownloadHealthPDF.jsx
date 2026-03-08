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

      // Compute age
      let ageText = '';
      if (dog.birth_date) {
        const months = Math.floor((Date.now() - new Date(dog.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        ageText = months < 12 ? `${months} mois` : `${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? 's' : ''}`;
      }

      // Header
      doc.setFillColor(26, 77, 62);
      doc.rect(0, 0, pageW, 46, 'F');
      doc.setFillColor(45, 159, 130);
      doc.rect(0, 42, pageW, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitize(`Carnet de sante — ${dog.name}`), 14, 18);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(sanitize([dog.breed, ageText, dog.weight ? `${dog.weight} kg` : null, dog.sex === 'male' ? 'Male' : dog.sex === 'female' ? 'Femelle' : null].filter(Boolean).join(' · ')), 14, 28);
      doc.setFontSize(9);
      doc.text(sanitize(`Genere le ${formatDate(new Date().toISOString())} via PawCoach`), 14, 37);
      if (dog.vet_name) doc.text(sanitize(`Veterinaire : ${dog.vet_name}${dog.vet_city ? ` (${dog.vet_city})` : ''}`), 14, 42);
      y = 56;

      doc.setTextColor(51, 51, 51);

      // Allergies / Issues
      if (dog.allergies || dog.health_issues) {
        const alertH = 12 + (dog.allergies ? 6 : 0) + (dog.health_issues ? 6 : 0);
        doc.setFillColor(255, 243, 243);
        doc.roundedRect(14, y, pageW - 28, alertH, 3, 3, 'F');
        doc.setDrawColor(220, 38, 38);
        doc.roundedRect(14, y, pageW - 28, alertH, 3, 3, 'S');
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(sanitize('Alertes sante'), 18, y + 8);
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let alertY = y + 15;
        if (dog.allergies) { doc.text(sanitize(`Allergies : ${dog.allergies}`), 18, alertY); alertY += 6; }
        if (dog.health_issues) { doc.text(sanitize(`Problemes : ${dog.health_issues}`), 18, alertY); }
        y += alertH + 6;
      }

      // === WELLNESS SUMMARY (from check-ins) ===
      const recentCheckins = (checkins || []).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 30);
      if (recentCheckins.length >= 3) {
        checkPage(45);
        const avgMood = (recentCheckins.reduce((s, c) => s + (c.mood || 0), 0) / recentCheckins.length);
        const avgEnergy = (recentCheckins.reduce((s, c) => s + (c.energy || 0), 0) / recentCheckins.length);
        const avgAppetite = (recentCheckins.reduce((s, c) => s + (c.appetite || 0), 0) / recentCheckins.length);

        doc.setFontSize(13);
        doc.setTextColor(26, 77, 62);
        doc.setFont('helvetica', 'bold');
        doc.text(sanitize('Bien-etre (30 derniers jours)'), 14, y);
        y += 3;
        doc.setDrawColor(45, 159, 130);
        doc.setLineWidth(0.5);
        doc.line(14, y, pageW - 14, y);
        y += 8;

        const drawBar = (label, score, max, color) => {
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.setFont('helvetica', 'normal');
          doc.text(sanitize(label), 18, y);
          const barX = 55;
          const barW = 70;
          const barH = 4;
          doc.setFillColor(230, 230, 230);
          doc.roundedRect(barX, y - 3.5, barW, barH, 2, 2, 'F');
          doc.setFillColor(...color);
          doc.roundedRect(barX, y - 3.5, barW * Math.min(score / max, 1), barH, 2, 2, 'F');
          doc.setTextColor(51, 51, 51);
          doc.text(`${score.toFixed(1)} / ${max}`, barX + barW + 4, y);
          y += 8;
        };

        drawBar('Humeur', avgMood, 4, [16, 185, 129]);
        drawBar('Energie', avgEnergy, 3, [99, 102, 241]);
        drawBar('Appetit', avgAppetite, 3, [45, 159, 130]);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(sanitize(`Base sur ${recentCheckins.length} check-ins`), 18, y);
        y += 8;
      }

      // === SYMPTOMS (from F11) ===
      const symptomCounts = {};
      recentCheckins.forEach(c => {
        if (c.symptoms?.length) c.symptoms.forEach(s => { symptomCounts[s] = (symptomCounts[s] || 0) + 1; });
      });
      if (Object.keys(symptomCounts).length > 0) {
        checkPage(30);
        doc.setFontSize(13);
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.text(sanitize('Symptomes signales'), 14, y);
        y += 3;
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(0.5);
        doc.line(14, y, pageW - 14, y);
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).forEach(([symptom, count]) => {
          checkPage(8);
          doc.text(sanitize(`${symptom} — signale ${count} fois`), 18, y);
          y += 6;
        });
        y += 4;
      }

      // === BEHAVIOR SUMMARY (from F07 Memory Coach) ===
      if (dog.behavior_summary) {
        checkPage(30);
        doc.setFontSize(13);
        doc.setTextColor(26, 77, 62);
        doc.setFont('helvetica', 'bold');
        doc.text(sanitize('Profil comportemental'), 14, y);
        y += 3;
        doc.setDrawColor(45, 159, 130);
        doc.setLineWidth(0.5);
        doc.line(14, y, pageW - 14, y);
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'italic');
        const behavLines = doc.splitTextToSize(sanitize(dog.behavior_summary), pageW - 36);
        behavLines.forEach(line => {
          checkPage(6);
          doc.text(line, 18, y);
          y += 5;
        });
        doc.setFont('helvetica', 'normal');
        y += 4;
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

      // Disclaimer
      checkPage(25);
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, pageW - 14, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      const disclaimer = sanitize('Ce document est genere par PawCoach a titre informatif. Il ne remplace pas un diagnostic veterinaire. Presentez-le a votre veterinaire pour faciliter la consultation.');
      const discLines = doc.splitTextToSize(disclaimer, pageW - 28);
      discLines.forEach(line => { doc.text(line, 14, y); y += 4; });

      // Footer on every page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(170, 170, 170);
        doc.setFont('helvetica', 'normal');
        doc.text(sanitize(`PawCoach · Carnet de sante de ${dog.name} · Page ${i}/${pageCount}`), pageW / 2, 290, { align: 'center' });
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