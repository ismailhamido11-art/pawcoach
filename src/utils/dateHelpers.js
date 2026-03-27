/**
 * dateHelpers.js — Shared date formatting & calculation helpers.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Short day names in French (Sunday-indexed, matches getDay()). */
export const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** Short month names in French (0-indexed, matches getMonth()). */
export const MOIS_FR = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];

// ─── Date arithmetic ─────────────────────────────────────────────────────────

/**
 * Add `days` to a date string "YYYY-MM-DD" and return a Date object.
 * Uses local midnight to avoid DST shifts.
 */
export function addDaysToDate(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Return the ISO date string (YYYY-MM-DD) for the Monday of the current week.
 * Used for weekly stats — consistent across all components.
 */
export function getWeekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format a Date object as "lun. 3 jan." using JOURS_COURTS + MOIS_FR.
 * Used in training program day cards.
 */
export function formatDateFr(date) {
  return `${JOURS_COURTS[date.getDay()]} ${date.getDate()} ${MOIS_FR[date.getMonth()]}`;
}

/**
 * Format a date string as localised French (e.g. "03/01/2025").
 * Returns "" for invalid dates.
 */
export function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return "";
  }
}

/**
 * Format a date string as long French (e.g. "3 janvier 2025").
 * Returns "—" for missing dates.
 */
export function fmtDateLong(d) {
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

// ─── Age ─────────────────────────────────────────────────────────────────────

/**
 * Compute a human-readable age string from a birth_date string.
 * Returns "X mois" if < 12 months, "1 an" or "X ans" otherwise.
 * Returns null for missing/invalid input.
 */
export function getAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths} mois`;
  if (years === 1) return `1 an`;
  return `${years} ans`;
}

// ─── Legacy helpers ───────────────────────────────────────────────────────────

/** Number of days from today to a future date string. Negative if past. */
export function getDaysLeft(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

/** Format a timestamp as "Aujourd'hui", "Hier", or "3 mars" */
export function getDateLabel(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/** Return true if messages[index] is on a different day than messages[index-1] */
export function shouldShowDateSeparator(messages, index) {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].timestamp);
  const curr = new Date(messages[index].timestamp);
  return prev.toDateString() !== curr.toDateString();
}

/** Format a timestamp as "14:30" */
export function getTimeStr(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
