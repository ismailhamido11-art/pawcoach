/**
 * dateHelpers.js — Shared date formatting helpers for chat-style UIs.
 */

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
