import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  computeVaccineMap,
  computeWeightTrend,
  computeHealthScore,
  getScoreLevel,
  computeStatusPills,
} from "@/utils/healthStatus";
import { fmtDateLong } from "@/utils/dateHelpers";
import {
  fmtShortDate,
  sanitize,
  computeAge,
  COLORS,
  drawTable,
  drawSectionHeader,
  drawScoreBadge,
} from "@/utils/pdfHelpers";

// fmtDate (long format) aliased from fmtDateLong
const fmtDate = fmtDateLong;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DownloadHealthPDF({ dogId, dogName: _dogName }) {
  const [loading, setLoading] = useState(false);

  // Audit FIX-61: no extractable pattern — outgoing calls are jsPDF API calls (doc.text, doc.setFontSize,
  // doc.rect, etc.) and pdfHelpers abstractions (drawSectionHeader x9, drawTable x4, drawScoreBadge x1).
  // drawBar is already extracted as a local const. No additional extraction warranted.
  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("vetAccess", {
        action: "getHealthSummary",
        dogId,
      });

      if (!res.data.success) {
        toast.error("Impossible de préparer le PDF. Réessaie dans un instant.");
        setLoading(false);
        return;
      }

      const { dog, records: rawRecords, checkins, growthEntries: rawGrowthEntries, dailyLogs: rawDailyLogs } = res.data;
      const records = rawRecords || [];
      const growthEntries = rawGrowthEntries || [];
      const dailyLogs = rawDailyLogs || [];
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      const checkPage = (needed = 30) => {
        if (y + needed > 275) { doc.addPage(); y = 20; }
      };

      const ageText = computeAge(dog.birth_date);

      // ================================================================
      // HEADER
      // ================================================================
      doc.setFillColor(...COLORS.primary);
      doc.rect(0, 0, pageW, 46, "F");
      doc.setFillColor(...COLORS.emerald);
      doc.rect(0, 42, pageW, 4, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(sanitize(`Carnet de santé — ${dog.name}`), 14, 16);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const subInfo = [dog.breed, ageText, dog.weight ? `${dog.weight} kg` : null, dog.sex === "male" ? "Male" : dog.sex === "female" ? "Femelle" : null].filter(Boolean).join(" · ");
      doc.text(sanitize(subInfo), 14, 26);

      if (dog.chip_number) {
        doc.setFontSize(9);
        doc.text(sanitize(`Puce : ${dog.chip_number}`), 14, 33);
      }

      // Vet info in header
      if (dog.vet_name || dog.vet_city) {
        const vetLine = [dog.vet_name, dog.vet_city].filter(Boolean).join(" — ");
        doc.setFontSize(9);
        doc.setTextColor(200, 220, 210);
        doc.text(sanitize(`Vétérinaire : ${vetLine}`), 14, dog.chip_number ? 38 : 33);
      }

      doc.setFontSize(8);
      doc.setTextColor(200, 220, 210);
      doc.text(sanitize(`Genere le ${fmtDate(new Date().toISOString())} via PawCoach`), 14, 40);

      y = 54;
      doc.setTextColor(...COLORS.text);

      // ================================================================
      // ALERT BOX (allergies / health issues)
      // ================================================================
      if (dog.allergies || dog.health_issues) {
        const lines = [];
        if (dog.allergies) lines.push(`Allergies : ${dog.allergies}`);
        if (dog.health_issues) lines.push(`Problèmes connus : ${dog.health_issues}`);
        const boxH = 10 + lines.length * 6;
        checkPage(boxH + 4);
        doc.setFillColor(255, 243, 243);
        doc.roundedRect(14, y, pageW - 28, boxH, 3, 3, "F");
        doc.setDrawColor(...COLORS.red);
        doc.roundedRect(14, y, pageW - 28, boxH, 3, 3, "S");
        doc.setTextColor(...COLORS.red);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("ALERTES SANTE", 18, y + 7);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        lines.forEach((l, i) => { doc.text(sanitize(l), 18, y + 13 + i * 6); });
        y += boxH + 4;
      }

      // ================================================================
      // HEALTH SCORE SUMMARY
      // ================================================================
      // Normaliser GrowthEntry + DailyLog pour computeHealthScore
      const extraWeightSources = [
        ...growthEntries.filter((g) => g.weight_kg && g.date),
        ...dailyLogs.filter((l) => l.weight_kg && l.date),
      ];
      const score = computeHealthScore(records, dog, extraWeightSources);
      const level = getScoreLevel(score);
      const pills = computeStatusPills(records, dog);
      y = drawScoreBadge(doc, y, score, level.label, pills);

      // ================================================================
      // VACCINES TABLE
      // ================================================================
      const vaccines = records.filter((r) => r.type === "vaccine");
      if (vaccines.length > 0) {
        y = drawSectionHeader(doc, y, "Vaccins");

        const vaccineMap = computeVaccineMap(records);
        const STATUS_LABELS = {
          up_to_date: "A jour",
          due_soon: "Bientot du",
          overdue: "En retard",
          never: "Non renseigne",
        };

        // Build table rows from vaccineMap (smart) + raw records (complete)
        const tableRows = [];

        // First: referenced vaccines with status
        Object.entries(vaccineMap).forEach(([_key, v]) => {
          if (v.lastRecord) {
            tableRows.push([
              v.ref.name,
              v.ref.label,
              fmtShortDate(v.lastRecord.date),
              v.nextDue ? fmtShortDate(v.nextDue) : "\u2014",
              STATUS_LABELS[v.status],
            ]);
          }
        });

        // Then: unmatched vaccine records (not already shown via vaccineMap)
        const matchedIds = new Set(
          Object.values(vaccineMap)
            .filter((v) => v.lastRecord)
            .map((v) => v.lastRecord.id)
        );
        vaccines
          .filter((v) => !matchedIds.has(v.id))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach((v) => {
            tableRows.push([
              v.title || "\u2014",
              "\u2014",
              fmtShortDate(v.date),
              v.next_date ? fmtShortDate(v.next_date) : "\u2014",
              "\u2014",
            ]);
          });

        if (tableRows.length > 0) {
          y = drawTable(
            doc, y,
            ["Vaccin", "Categorie", "Date", "Prochain rappel", "Statut"],
            tableRows,
            [0.22, 0.18, 0.18, 0.22, 0.20],
            { statusCol: 4 }
          );
          y += 4;
        }

        // Reference note
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.textLight);
        doc.setFont("helvetica", "italic");
        doc.text(sanitize("Reference : calendrier vaccinal WSAVA 2024, adapte France (Leptospirose = essentiel)"), 14, y);
        doc.setFont("helvetica", "normal");
        y += 6;
      }

      // ================================================================
      // WEIGHT TABLE
      // ================================================================
      // Poids depuis HealthRecord (source officielle, prioritaire)
      const hrWeights = records.filter((r) => r.type === "weight" && r.value);
      const hrDates = new Set(hrWeights.map((r) => r.date));

      // Poids depuis GrowthEntry (deduplication par date — HealthRecord prioritaire)
      const growthWeights = growthEntries
        .filter((g) => g.weight_kg && g.date && !hrDates.has(g.date))
        .map((g) => ({ date: g.date, value: g.weight_kg, _source: "Suivi croissance" }));

      // Dates deja couvertes (HealthRecord + GrowthEntry)
      const coveredDates = new Set([...hrDates, ...growthWeights.map((g) => g.date)]);

      // Poids depuis DailyLog (deduplication par date)
      const dailyLogWeights = dailyLogs
        .filter((l) => l.weight_kg && l.date && !coveredDates.has(l.date))
        .map((l) => ({ date: l.date, value: l.weight_kg, _source: "Bilan quotidien" }));

      const weights = [...hrWeights, ...growthWeights, ...dailyLogWeights];

      if (weights.length > 0) {
        y = drawSectionHeader(doc, y, "Suivi du poids");

        // Weight trend summary — enrichir records avec les sources supplementaires pour computeWeightTrend
        const enrichedForTrend = [
          ...records,
          ...growthWeights.map((g) => ({ type: "weight", date: g.date, value: g.value })),
          ...dailyLogWeights.map((l) => ({ type: "weight", date: l.date, value: l.value })),
        ];
        const trend = computeWeightTrend(enrichedForTrend);
        if (trend.current !== null) {
          checkPage(12);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          const trendColor = trend.direction === "stable" ? COLORS.green
            : Math.abs(trend.changePct) > 5 ? COLORS.red : COLORS.amber;
          doc.setTextColor(...trendColor);

          const dirLabel = trend.direction === "stable" ? "Stable"
            : trend.direction === "up" ? `En hausse (+${trend.changeKg} kg / ${trend.changePct}%)`
            : trend.direction === "down" ? `En baisse (${trend.changeKg} kg / ${trend.changePct}%)`
            : "Données insuffisantes";
          doc.setFont("helvetica", "bold");
          doc.text(sanitize(`Tendance : ${dirLabel} — Poids actuel : ${trend.current} kg`), 14, y);
          doc.setFont("helvetica", "normal");
          y += 6;
        }

        const sortedWeights = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
        // Compute variation between consecutive entries
        const weightRows = sortedWeights.map((w, i) => {
          const prev = sortedWeights[i + 1];
          let variation = "\u2014";
          if (prev && prev.value) {
            const diff = +(w.value - prev.value).toFixed(1);
            variation = diff > 0 ? `+${diff} kg` : diff < 0 ? `${diff} kg` : "=";
          }
          return [fmtShortDate(w.date), `${w.value} kg`, variation];
        });

        y = drawTable(
          doc, y,
          ["Date", "Poids", "Variation"],
          weightRows,
          [0.35, 0.35, 0.30],
          { statusCol: 2 }
        );
        y += 6;
      }

      // ================================================================
      // VET VISITS TABLE
      // ================================================================
      const vetVisits = records.filter((r) => r.type === "vet_visit");
      if (vetVisits.length > 0) {
        y = drawSectionHeader(doc, y, "Visites vétérinaire");
        const sorted = [...vetVisits].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
        const rows = sorted.map((v) => [
          fmtShortDate(v.date),
          v.title || "\u2014",
          (v.details || "").substring(0, 60) || "\u2014",
        ]);
        y = drawTable(doc, y, ["Date", "Motif", "Détails"], rows, [0.22, 0.35, 0.43]);
        y += 6;
        if (dog.next_vet_appointment) {
          checkPage(10);
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.emerald);
          doc.setFont("helvetica", "bold");
          doc.text(sanitize(`Prochain RDV : ${fmtDate(dog.next_vet_appointment)}`), 14, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COLORS.text);
          y += 6;
        }
      } else if (dog.next_vet_appointment) {
        y = drawSectionHeader(doc, y, "Vétérinaire");
        checkPage(10);
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.emerald);
        doc.setFont("helvetica", "bold");
        doc.text(sanitize(`Prochain RDV : ${fmtDate(dog.next_vet_appointment)}`), 14, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.text);
        y += 8;
      }

      // ================================================================
      // MEDICATIONS TABLE
      // ================================================================
      const meds = records.filter((r) => r.type === "medication");
      if (meds.length > 0) {
        y = drawSectionHeader(doc, y, "Médicaments");
        const sorted = [...meds].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
        const rows = sorted.map((m) => [
          fmtShortDate(m.date),
          m.title || "\u2014",
          m.next_date ? fmtShortDate(m.next_date) : "\u2014",
          (m.details || "").substring(0, 50) || "\u2014",
        ]);
        y = drawTable(doc, y, ["Date", "Médicament", "Prochain", "Notes"], rows, [0.18, 0.30, 0.18, 0.34]);
        y += 6;
      }

      // ================================================================
      // NOTES (text — tables not appropriate)
      // ================================================================
      const notes = records.filter((r) => r.type === "note");
      if (notes.length > 0) {
        y = drawSectionHeader(doc, y, "Notes");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.text);
        doc.setFont("helvetica", "normal");
        const sorted = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
        sorted.forEach((n) => {
          checkPage(14);
          doc.setFont("helvetica", "bold");
          doc.text(sanitize(`${n.title || "Note"} — ${fmtShortDate(n.date)}`), 18, y);
          y += 5;
          if (n.details) {
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(sanitize(n.details), pageW - 40);
            lines.slice(0, 3).forEach((line) => {
              checkPage(5);
              doc.text(line, 22, y);
              y += 4.5;
            });
          }
          y += 2;
        });
        y += 4;
      }

      // ================================================================
      // WELLNESS BARS (keep existing — good as is)
      // ================================================================
      const recentCheckins = (checkins || [])
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 30);

      if (recentCheckins.length >= 3) {
        y = drawSectionHeader(doc, y, "Bien-etre (30 derniers jours)");

        const avg = (field, _max) => {
          const val = recentCheckins.reduce((s, c) => s + (c[field] || 0), 0) / recentCheckins.length;
          return val;
        };
        const avgMood = avg("mood");
        const avgEnergy = avg("energy");
        const avgAppetite = avg("appetite");

        const drawBar = (label, value, max, color) => {
          checkPage(9);
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.text);
          doc.setFont("helvetica", "normal");
          doc.text(sanitize(label), 18, y);
          const barX = 52;
          const barW = 65;
          doc.setFillColor(230, 230, 230);
          doc.roundedRect(barX, y - 3, barW, 3.5, 1.5, 1.5, "F");
          doc.setFillColor(...color);
          doc.roundedRect(barX, y - 3, barW * Math.min(value / max, 1), 3.5, 1.5, 1.5, "F");
          doc.text(`${value.toFixed(1)} / ${max}`, barX + barW + 4, y);
          y += 7;
        };

        drawBar("Humeur", avgMood, 4, [16, 185, 129]);
        drawBar("Energie", avgEnergy, 3, [99, 102, 241]);
        drawBar("Appetit", avgAppetite, 3, [45, 159, 130]);

        doc.setFontSize(7);
        doc.setTextColor(...COLORS.textLight);
        doc.text(sanitize(`Base sur ${recentCheckins.length} check-ins`), 18, y);
        y += 6;
      }

      // ================================================================
      // SYMPTOMS
      // ================================================================
      const symptomCounts = {};
      recentCheckins.forEach((c) => {
        if (c.symptoms?.length)
          c.symptoms.forEach((s) => { symptomCounts[s] = (symptomCounts[s] || 0) + 1; });
      });

      if (Object.keys(symptomCounts).length > 0) {
        y = drawSectionHeader(doc, y, "Symptomes signales", COLORS.red);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        Object.entries(symptomCounts)
          .sort((a, b) => b[1] - a[1])
          .forEach(([symptom, count]) => {
            checkPage(7);
            doc.text(sanitize(`${symptom} — signale ${count} fois`), 18, y);
            y += 5.5;
          });
        y += 4;
      }

      // ================================================================
      // BEHAVIOR
      // ================================================================
      if (dog.behavior_summary) {
        y = drawSectionHeader(doc, y, "Profil comportemental");
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "italic");
        const behavLines = doc.splitTextToSize(sanitize(dog.behavior_summary), pageW - 36);
        behavLines.forEach((line) => {
          checkPage(5);
          doc.text(line, 18, y);
          y += 4.5;
        });
        doc.setFont("helvetica", "normal");
        y += 4;
      }

      // ================================================================
      // DISCLAIMER
      // ================================================================
      checkPage(20);
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, pageW - 14, y);
      y += 5;
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      const disc = sanitize(
        "Ce document est généré par PawCoach à titre informatif. " +
        "Il ne remplace pas un diagnostic vétérinaire. " +
        "Présentez-le à votre vétérinaire pour faciliter la consultation."
      );
      const discLines = doc.splitTextToSize(disc, pageW - 28);
      discLines.forEach((line) => { doc.text(line, 14, y); y += 3.5; });

      // ================================================================
      // FOOTER (every page)
      // ================================================================
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(170, 170, 170);
        doc.setFont("helvetica", "normal");
        doc.text(
          sanitize(`PawCoach · Carnet de santé de ${dog.name} · Page ${i}/${pageCount}`),
          pageW / 2,
          290,
          { align: "center" }
        );
      }

      doc.save(`PawCoach_${(dog.name || "chien").replace(/\s+/g, "_")}_sante.pdf`);
      toast.success("PDF téléchargé !");
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Impossible de générer le PDF. Réessaie dans un instant.");
    }
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={loading}
      className="gap-2 w-full border-primary/20 text-primary hover:bg-primary/5 text-xs font-semibold"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <FileDown className="w-3.5 h-3.5" />
      )}
      {loading ? "Génération..." : "Rapport PDF vétérinaire"}
    </Button>
  );
}
