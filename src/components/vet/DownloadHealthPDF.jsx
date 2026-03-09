import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import {
  computeVaccineMap,
  computeWeightTrend,
  computeHealthScore,
  getScoreLevel,
  computeStatusPills,
} from "@/utils/healthStatus";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(d) {
  if (!d) return "\u2014";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function fmtShortDate(d) {
  if (!d) return "\u2014";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function sanitize(text) {
  if (!text) return "";
  return String(text)
    .replace(/é/g, "e").replace(/è/g, "e").replace(/ê/g, "e").replace(/ë/g, "e")
    .replace(/à/g, "a").replace(/â/g, "a").replace(/ä/g, "a")
    .replace(/ù/g, "u").replace(/û/g, "u").replace(/ü/g, "u")
    .replace(/ô/g, "o").replace(/ö/g, "o")
    .replace(/î/g, "i").replace(/ï/g, "i")
    .replace(/ç/g, "c")
    .replace(/É/g, "E").replace(/È/g, "E").replace(/Ê/g, "E")
    .replace(/À/g, "A").replace(/Â/g, "A")
    .replace(/Ù/g, "U").replace(/Û/g, "U")
    .replace(/Ô/g, "O").replace(/Î/g, "I").replace(/Ç/g, "C")
    .replace(/[^\x00-\x7F]/g, "");
}

function computeAge(birthDate) {
  if (!birthDate) return "";
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  if (months < 1) return "< 1 mois";
  if (months < 12) return `${months} mois`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${y} an${y > 1 ? "s" : ""}`;
  return `${y} an${y > 1 ? "s" : ""} et ${m} mois`;
}

// ---------------------------------------------------------------------------
// Table drawing engine (pure jsPDF, no autotable)
// ---------------------------------------------------------------------------

const COLORS = {
  primary: [26, 77, 62],
  emerald: [45, 159, 130],
  headerBg: [26, 77, 62],
  headerText: [255, 255, 255],
  rowEven: [248, 250, 249],
  rowOdd: [255, 255, 255],
  border: [220, 220, 220],
  text: [51, 51, 51],
  textLight: [120, 120, 120],
  red: [220, 38, 38],
  amber: [180, 120, 20],
  green: [22, 120, 90],
};

/**
 * Draw a table with header + rows.
 * @param {jsPDF} doc
 * @param {number} startY
 * @param {string[]} headers — column titles
 * @param {string[][]} rows — array of row data
 * @param {number[]} colWidths — proportional widths (sum = 1)
 * @param {object} opts — { tableWidth, x, rowHeight, headerHeight, statusCol }
 * @returns {number} new Y position after the table
 */
function drawTable(doc, startY, headers, rows, colWidths, opts = {}) {
  const pageW = doc.internal.pageSize.getWidth();
  const tableW = opts.tableWidth || pageW - 28;
  const x0 = opts.x || 14;
  const rowH = opts.rowHeight || 8;
  const headerH = opts.headerHeight || 9;
  const statusCol = opts.statusCol ?? -1; // column index for colored status text

  let y = startY;

  const checkPage = (needed) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  // Compute absolute column widths
  const absWidths = colWidths.map((w) => w * tableW);

  // Draw header
  checkPage(headerH + rowH);
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(x0, y, tableW, headerH, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.headerText);

  let colX = x0;
  headers.forEach((h, i) => {
    doc.text(sanitize(h), colX + 2, y + headerH - 2.5, { maxWidth: absWidths[i] - 4 });
    colX += absWidths[i];
  });
  y += headerH;

  // Draw rows
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  rows.forEach((row, ri) => {
    checkPage(rowH);
    // Alternating row color
    doc.setFillColor(...(ri % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd));
    doc.rect(x0, y, tableW, rowH, "F");
    // Bottom border
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(x0, y + rowH, x0 + tableW, y + rowH);

    colX = x0;
    row.forEach((cell, ci) => {
      if (ci === statusCol) {
        // Color the status column
        const lower = (cell || "").toLowerCase();
        if (lower.includes("retard") || lower.includes("attention")) {
          doc.setTextColor(...COLORS.red);
          doc.setFont("helvetica", "bold");
        } else if (lower.includes("bientot") || lower.includes("surveiller")) {
          doc.setTextColor(...COLORS.amber);
          doc.setFont("helvetica", "bold");
        } else if (lower.includes("jour") || lower.includes("stable") || lower.includes("bon")) {
          doc.setTextColor(...COLORS.green);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(...COLORS.textLight);
          doc.setFont("helvetica", "normal");
        }
      } else {
        doc.setTextColor(...COLORS.text);
        doc.setFont("helvetica", "normal");
      }
      doc.text(sanitize(cell || ""), colX + 2, y + rowH - 2, { maxWidth: absWidths[ci] - 4 });
      colX += absWidths[ci];
    });
    y += rowH;
  });

  return y;
}

// ---------------------------------------------------------------------------
// Section header helper
// ---------------------------------------------------------------------------

function drawSectionHeader(doc, y, title, color = COLORS.emerald) {
  const pageW = doc.internal.pageSize.getWidth();
  if (y + 15 > 275) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.text(sanitize(title), 14, y);
  y += 2.5;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);
  doc.line(14, y, pageW - 14, y);
  y += 5;
  return y;
}

// ---------------------------------------------------------------------------
// Score badge (inline)
// ---------------------------------------------------------------------------

function drawScoreBadge(doc, y, score, label, pills) {
  const pageW = doc.internal.pageSize.getWidth();
  if (y + 25 > 275) { doc.addPage(); y = 20; }

  // Background card
  doc.setFillColor(248, 250, 249);
  doc.roundedRect(14, y, pageW - 28, 22, 3, 3, "F");
  doc.setDrawColor(...COLORS.emerald);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, pageW - 28, 22, 3, 3, "S");

  // Score
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(`${score}`, 22, y + 14);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.setFont("helvetica", "normal");
  doc.text("/100", 22 + doc.getTextWidth(`${score}`) + 1, y + 14);

  // Label
  const scoreColor = score >= 80 ? COLORS.green : score >= 60 ? COLORS.primary : score >= 40 ? COLORS.amber : COLORS.red;
  doc.setFontSize(10);
  doc.setTextColor(...scoreColor);
  doc.setFont("helvetica", "bold");
  doc.text(sanitize(label), 50, y + 10);

  // Progress bar
  const barX = 50;
  const barW = 60;
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(barX, y + 14, barW, 3, 1.5, 1.5, "F");
  doc.setFillColor(...scoreColor);
  doc.roundedRect(barX, y + 14, barW * (score / 100), 3, 1.5, 1.5, "F");

  // Pills on the right
  if (pills && pills.length > 0) {
    let pillX = 120;
    doc.setFontSize(7);
    pills.forEach((p) => {
      const pillColor = p.status === "good" ? COLORS.green : p.status === "warning" ? COLORS.amber : p.status === "alert" ? COLORS.red : COLORS.textLight;
      doc.setTextColor(...pillColor);
      doc.setFont("helvetica", "bold");
      const txt = sanitize(`${p.label}: ${p.value}`);
      if (pillX + doc.getTextWidth(txt) < pageW - 18) {
        doc.text(txt, pillX, y + 10);
        pillX += doc.getTextWidth(txt) + 6;
      }
    });
  }

  y += 26;
  return y;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DownloadHealthPDF({ dogId, dogName }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("vetAccess", {
        action: "getHealthSummary",
        dogId,
      });

      if (!res.data.success) {
        toast.error("Erreur lors de la generation");
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
      doc.text(sanitize(`Carnet de sante — ${dog.name}`), 14, 16);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const subInfo = [dog.breed, ageText, dog.weight ? `${dog.weight} kg` : null, dog.sex === "male" ? "Male" : dog.sex === "female" ? "Femelle" : null].filter(Boolean).join(" · ");
      doc.text(sanitize(subInfo), 14, 26);

      if (dog.chip_number) {
        doc.setFontSize(9);
        doc.text(sanitize(`Puce : ${dog.chip_number}`), 14, 33);
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
        if (dog.health_issues) lines.push(`Problemes connus : ${dog.health_issues}`);
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
      const score = computeHealthScore(records, dog);
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
        Object.entries(vaccineMap).forEach(([key, v]) => {
          if (v.lastRecord) {
            tableRows.push([
              v.ref.shortName,
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
      const weights = records.filter((r) => r.type === "weight" && r.value);
      if (weights.length > 0) {
        y = drawSectionHeader(doc, y, "Suivi du poids");

        // Weight trend summary
        const trend = computeWeightTrend(records);
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
            : "Donnees insuffisantes";
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
        y = drawSectionHeader(doc, y, "Visites veterinaire");
        const sorted = [...vetVisits].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
        const rows = sorted.map((v) => [
          fmtShortDate(v.date),
          v.title || "\u2014",
          (v.details || "").substring(0, 60) || "\u2014",
        ]);
        y = drawTable(doc, y, ["Date", "Motif", "Details"], rows, [0.22, 0.35, 0.43]);
        y += 6;
      }

      // ================================================================
      // MEDICATIONS TABLE
      // ================================================================
      const meds = records.filter((r) => r.type === "medication");
      if (meds.length > 0) {
        y = drawSectionHeader(doc, y, "Medicaments");
        const sorted = [...meds].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
        const rows = sorted.map((m) => [
          fmtShortDate(m.date),
          m.title || "\u2014",
          m.next_date ? fmtShortDate(m.next_date) : "\u2014",
          (m.details || "").substring(0, 50) || "\u2014",
        ]);
        y = drawTable(doc, y, ["Date", "Medicament", "Prochain", "Notes"], rows, [0.18, 0.30, 0.18, 0.34]);
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

        const avg = (field, max) => {
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
        "Ce document est genere par PawCoach a titre informatif. " +
        "Il ne remplace pas un diagnostic veterinaire. " +
        "Presentez-le a votre veterinaire pour faciliter la consultation."
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
          sanitize(`PawCoach · Carnet de sante de ${dog.name} · Page ${i}/${pageCount}`),
          pageW / 2,
          290,
          { align: "center" }
        );
      }

      doc.save(`PawCoach_${(dog.name || "chien").replace(/\s+/g, "_")}_sante.pdf`);
      toast.success("PDF telecharge !");
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Erreur lors de la generation du PDF");
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
      {loading ? "Generation..." : "Rapport PDF veterinaire"}
    </Button>
  );
}
