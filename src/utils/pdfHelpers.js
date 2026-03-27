// ---------------------------------------------------------------------------
// PDF layout helpers — pure functions, no React, no side effects.
// Used by DownloadHealthPDF.jsx and any future PDF export component.
// ---------------------------------------------------------------------------

/**
 * Format a date as DD/MM/YYYY (short format for PDF tables).
 */
export function fmtShortDate(d) {
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

/**
 * Remove non-ASCII characters (accented French chars → ASCII equivalent).
 * Required because jsPDF helvetica font doesn't support UTF-8 beyond basic latin.
 */
export function sanitize(text) {
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

/**
 * Compute a human-readable age string from a birth date ISO string.
 */
export function computeAge(birthDate) {
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
// Color palette (RGB arrays for jsPDF)
// ---------------------------------------------------------------------------

export const COLORS = {
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

// ---------------------------------------------------------------------------
// Table drawing engine (pure jsPDF, no autotable)
// ---------------------------------------------------------------------------

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
export function drawTable(doc, startY, headers, rows, colWidths, opts = {}) {
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

/**
 * Draw a section header with title and underline.
 * @param {jsPDF} doc
 * @param {number} y
 * @param {string} title
 * @param {number[]} color — RGB array (defaults to COLORS.emerald)
 * @returns {number} new Y position after the header
 */
export function drawSectionHeader(doc, y, title, color = COLORS.emerald) {
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

/**
 * Draw the health score badge with progress bar and status pills.
 * @param {jsPDF} doc
 * @param {number} y
 * @param {number} score — 0-100
 * @param {string} label — score label (e.g. "Excellent")
 * @param {Array} pills — array of { label, value, status } objects
 * @returns {number} new Y position after the badge
 */
export function drawScoreBadge(doc, y, score, label, pills) {
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
