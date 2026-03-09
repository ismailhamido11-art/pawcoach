/**
 * healthStatus.js — Smart Health Notebook engine
 *
 * Pure frontend calculation functions for dog health intelligence.
 * No API calls, no side effects. Takes records + dog → returns insights.
 *
 * WSAVA 2024 guidelines adapted for France.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** WSAVA 2024 vaccine reference for France */
export const VACCINE_REFERENCE = {
  // Core vaccines (WSAVA essential)
  chp: {
    name: "CHP (Carre-Hepatite-Parvo)",
    shortName: "CHP",
    category: "core",
    label: "Essentiel",
    frequencyMonths: 36, // every 3 years after primo-vaccination
    primoWeeks: [8, 12, 16], // primo-vaccination schedule
    boosterMonths: 12, // first booster at 12 months
    description: "Protege contre 3 maladies graves : maladie de Carre, hepatite, parvovirose.",
    urgency: "Obligatoire pour tous les chiens.",
  },
  // Essential in France (promoted from optional by WSAVA for endemic zones)
  leptospirose: {
    name: "Leptospirose",
    shortName: "Lepto",
    category: "core",
    label: "Essentiel (France)",
    frequencyMonths: 12,
    description: "Maladie bacterienne transmise par l'eau contaminee (urine de rats). Tres repandue en France.",
    urgency: "Rappel annuel indispensable.",
  },
  rage: {
    name: "Rage",
    shortName: "Rage",
    category: "recommended",
    label: "Recommande",
    frequencyMonths: 12, // AMM France: annual for most vaccines
    description: "Obligatoire pour voyager en UE. Recommande meme sans voyage.",
    urgency: "Obligatoire si voyage ou pension.",
  },
  // Optional vaccines
  toux_chenil: {
    name: "Toux de chenil",
    shortName: "Toux chenil",
    category: "optional",
    label: "Optionnel",
    frequencyMonths: 12,
    description: "Recommande si pension, garderie, ou contact frequent avec d'autres chiens.",
    urgency: "Selon mode de vie.",
  },
  piroplasmose: {
    name: "Piroplasmose",
    shortName: "Piro",
    category: "optional",
    label: "Optionnel",
    frequencyMonths: 12,
    description: "Maladie transmise par les tiques. Recommande en zone a risque.",
    urgency: "Selon region et exposition aux tiques.",
  },
  leishmaniose: {
    name: "Leishmaniose",
    shortName: "Leishma",
    category: "optional",
    label: "Optionnel",
    frequencyMonths: 12,
    description: "Transmise par les phlebotomes (moustiques des sables). Sud de la France principalement.",
    urgency: "Selon region (Sud/Mediterranee).",
  },
};

/** Vaccine aliases — maps user-entered titles to reference keys */
const VACCINE_ALIASES = {
  chp: "chp", carre: "chp", hepatite: "chp", parvo: "chp", parvovirose: "chp",
  dhpp: "chp", dhlpp: "chp",
  lepto: "leptospirose", leptospirose: "leptospirose",
  rage: "rage", rabies: "rage", antirabique: "rage",
  toux: "toux_chenil", chenil: "toux_chenil", bordetella: "toux_chenil", "toux de chenil": "toux_chenil",
  piro: "piroplasmose", piroplasmose: "piroplasmose", babesiose: "piroplasmose",
  leishma: "leishmaniose", leishmaniose: "leishmaniose",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(dateA, dateB) {
  return Math.round((dateB - dateA) / MS_PER_DAY);
}

function isValidDate(d) {
  if (!d || d === "") return false;
  const parsed = new Date(d);
  return !isNaN(parsed.getTime());
}

function parseDate(d) {
  if (!isValidDate(d)) return null;
  const parsed = new Date(d);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function monthsAgo(date) {
  const now = today();
  return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
}

function fmtDateFR(d) {
  if (!isValidDate(d)) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/** Guess dog age in months from birth_date */
function dogAgeMonths(dog) {
  if (!dog?.birth_date || !isValidDate(dog.birth_date)) return null;
  return monthsAgo(parseDate(dog.birth_date));
}

/** Normalize a vaccine title to a reference key */
export function matchVaccineKey(title) {
  if (!title) return null;
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [alias, key] of Object.entries(VACCINE_ALIASES)) {
    if (lower.includes(alias)) return key;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Core calculations
// ---------------------------------------------------------------------------

/**
 * Compute per-vaccine status by matching records to WSAVA reference.
 * Returns Map<vaccineKey, { ref, lastRecord, nextDue, status, daysUntilDue }>
 *
 * status: "up_to_date" | "due_soon" (< 30 days) | "overdue" | "never"
 */
export function computeVaccineMap(records) {
  const vaccines = (records || []).filter(r => r.type === "vaccine");
  const t = today();

  // Group vaccine records by reference key
  const byKey = {};
  for (const v of vaccines) {
    const key = matchVaccineKey(v.title);
    if (!key) continue;
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(v);
  }

  const result = {};
  for (const [key, ref] of Object.entries(VACCINE_REFERENCE)) {
    const recs = byKey[key] || [];
    // Find latest record for this vaccine
    const sorted = recs
      .filter(r => isValidDate(r.date))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastRecord = sorted[0] || null;

    if (!lastRecord) {
      result[key] = { ref, lastRecord: null, nextDue: null, status: "never", daysUntilDue: null };
      continue;
    }

    // Calculate next due date
    let nextDue;
    if (isValidDate(lastRecord.next_date)) {
      nextDue = parseDate(lastRecord.next_date);
    } else {
      const lastDate = parseDate(lastRecord.date);
      nextDue = new Date(lastDate);
      nextDue.setMonth(nextDue.getMonth() + ref.frequencyMonths);
    }

    const daysUntil = daysBetween(t, nextDue);
    let status;
    if (daysUntil < 0) status = "overdue";
    else if (daysUntil <= 30) status = "due_soon";
    else status = "up_to_date";

    result[key] = { ref, lastRecord, nextDue, status, daysUntilDue: daysUntil };
  }

  return result;
}

/**
 * Compute weight trend from records.
 * Returns { current, previous, direction, changeKg, changePct, lastDate, period }
 *
 * direction: "stable" | "up" | "down" | "unknown"
 */
export function computeWeightTrend(records) {
  const weights = (records || [])
    .filter(r => r.type === "weight" && r.value && isValidDate(r.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (weights.length === 0) {
    return { current: null, previous: null, direction: "unknown", changeKg: 0, changePct: 0, lastDate: null, period: null };
  }

  const current = weights[0];
  const thirtyDaysAgo = new Date(today());
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find the closest weight record ~30 days ago (or oldest if not enough data)
  const olderWeights = weights.filter(r => new Date(r.date) <= thirtyDaysAgo);
  const previous = olderWeights.length > 0 ? olderWeights[0] : (weights.length > 1 ? weights[weights.length - 1] : null);

  if (!previous || previous.id === current.id) {
    return {
      current: current.value,
      previous: null,
      direction: "unknown",
      changeKg: 0,
      changePct: 0,
      lastDate: current.date,
      period: null,
    };
  }

  const changeKg = +(current.value - previous.value).toFixed(1);
  const changePct = previous.value > 0 ? +((changeKg / previous.value) * 100).toFixed(1) : 0;
  const periodDays = daysBetween(parseDate(previous.date), parseDate(current.date));

  let direction;
  // Threshold: <2% change = stable
  if (Math.abs(changePct) < 2) direction = "stable";
  else if (changeKg > 0) direction = "up";
  else direction = "down";

  return {
    current: current.value,
    previous: previous.value,
    direction,
    changeKg,
    changePct,
    lastDate: current.date,
    period: periodDays,
  };
}

/**
 * Compute overall health score (0-100).
 * Weighted: vaccines 40%, weight 20%, vet visits 25%, activity 15%.
 */
export function computeHealthScore(records, dog) {
  const t = today();
  const recs = records || [];

  // --- Vaccine score (0-40) ---
  const vaccineMap = computeVaccineMap(recs);
  const coreVaccines = Object.entries(vaccineMap).filter(([_, v]) => v.ref.category === "core");
  let vaccineScore = 0;
  if (coreVaccines.length > 0) {
    const statuses = coreVaccines.map(([_, v]) => v.status);
    const upToDate = statuses.filter(s => s === "up_to_date").length;
    const dueSoon = statuses.filter(s => s === "due_soon").length;
    const total = coreVaccines.length;
    vaccineScore = ((upToDate * 1 + dueSoon * 0.6) / total) * 40;
  }

  // --- Weight score (0-20) ---
  const weightTrend = computeWeightTrend(recs);
  let weightScore = 0;
  if (weightTrend.current !== null) {
    const lastWeightDate = parseDate(weightTrend.lastDate);
    const daysSinceLast = lastWeightDate ? daysBetween(lastWeightDate, t) : 999;
    if (daysSinceLast <= 30 && weightTrend.direction === "stable") weightScore = 20;
    else if (daysSinceLast <= 30) weightScore = 14;
    else if (daysSinceLast <= 90) weightScore = 10;
    else weightScore = 5;
  }

  // --- Vet visit score (0-25) ---
  const vetVisits = recs.filter(r => r.type === "vet_visit" && isValidDate(r.date));
  let vetScore = 0;
  if (vetVisits.length > 0) {
    const lastVet = vetVisits.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const months = monthsAgo(parseDate(lastVet.date));
    if (months <= 6) vetScore = 25;
    else if (months <= 12) vetScore = 20;
    else if (months <= 18) vetScore = 10;
    else vetScore = 5;
  }

  // --- Activity score (0-15) — based on record freshness ---
  const allDated = recs.filter(r => isValidDate(r.date));
  let activityScore = 0;
  if (allDated.length > 0) {
    const latest = allDated.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const daysSince = daysBetween(parseDate(latest.date), t);
    if (daysSince <= 7) activityScore = 15;
    else if (daysSince <= 30) activityScore = 12;
    else if (daysSince <= 90) activityScore = 8;
    else activityScore = 3;
  }

  const total = Math.round(vaccineScore + weightScore + vetScore + activityScore);
  return Math.min(100, Math.max(0, total));
}

/**
 * Get score label and color from score value.
 */
export function getScoreLevel(score) {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", barColor: "#2D9F82" };
  if (score >= 60) return { label: "Bon", color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", barColor: "#1A4D3E" };
  if (score >= 40) return { label: "A ameliorer", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", barColor: "#d97706" };
  return { label: "Attention requise", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", barColor: "#dc2626" };
}

/**
 * Compute status pills — quick badges for key health areas.
 * Returns array of { id, label, value, status, icon }
 * status: "good" | "warning" | "alert" | "empty"
 */
export function computeStatusPills(records, dog) {
  const recs = records || [];
  const t = today();
  const pills = [];

  // --- Vaccines pill ---
  const vaccineMap = computeVaccineMap(recs);
  const coreStatuses = Object.values(vaccineMap).filter(v => v.ref.category === "core");
  const overdueCount = coreStatuses.filter(v => v.status === "overdue").length;
  const dueSoonCount = coreStatuses.filter(v => v.status === "due_soon").length;
  const neverCount = coreStatuses.filter(v => v.status === "never").length;

  if (overdueCount > 0) {
    pills.push({ id: "vaccines", label: "Vaccins", value: `${overdueCount} en retard`, status: "alert" });
  } else if (dueSoonCount > 0) {
    pills.push({ id: "vaccines", label: "Vaccins", value: `${dueSoonCount} bientot`, status: "warning" });
  } else if (neverCount === coreStatuses.length) {
    pills.push({ id: "vaccines", label: "Vaccins", value: "Non renseigne", status: "empty" });
  } else {
    pills.push({ id: "vaccines", label: "Vaccins", value: "A jour", status: "good" });
  }

  // --- Weight pill ---
  const weightTrend = computeWeightTrend(recs);
  if (weightTrend.current === null) {
    pills.push({ id: "weight", label: "Poids", value: "Non suivi", status: "empty" });
  } else if (weightTrend.direction === "stable") {
    pills.push({ id: "weight", label: "Poids", value: `${weightTrend.current} kg — stable`, status: "good" });
  } else if (weightTrend.direction === "up") {
    pills.push({ id: "weight", label: "Poids", value: `+${weightTrend.changeKg} kg`, status: Math.abs(weightTrend.changePct) > 5 ? "alert" : "warning" });
  } else if (weightTrend.direction === "down") {
    pills.push({ id: "weight", label: "Poids", value: `${weightTrend.changeKg} kg`, status: Math.abs(weightTrend.changePct) > 5 ? "alert" : "warning" });
  } else {
    pills.push({ id: "weight", label: "Poids", value: `${weightTrend.current} kg`, status: "good" });
  }

  // --- Vet visit pill ---
  const vetVisits = recs
    .filter(r => r.type === "vet_visit" && isValidDate(r.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (vetVisits.length === 0) {
    pills.push({ id: "vet", label: "Veterinaire", value: "Aucune visite", status: "empty" });
  } else {
    const lastVet = vetVisits[0];
    const months = monthsAgo(parseDate(lastVet.date));
    if (months <= 6) {
      pills.push({ id: "vet", label: "Veterinaire", value: months === 0 ? "Ce mois-ci" : `il y a ${months} mois`, status: "good" });
    } else if (months <= 12) {
      pills.push({ id: "vet", label: "Veterinaire", value: `il y a ${months} mois`, status: "warning" });
    } else {
      pills.push({ id: "vet", label: "Veterinaire", value: `il y a ${months} mois`, status: "alert" });
    }
  }

  return pills;
}

/**
 * Compute THE most important next action for the dog owner.
 * Returns { type, title, description, urgency, ctaLabel }
 *
 * urgency: "critical" | "important" | "suggested" | "none"
 */
export function computeNextAction(records, dog) {
  const recs = records || [];
  const t = today();

  // Priority 0: Empty notebook — show welcome before vaccine warnings
  if (recs.length === 0) {
    return {
      type: "empty_notebook",
      title: "Commence le carnet de sante",
      description: `Ajoute le premier vaccin ou la derniere pesee de ${dog?.name || "ton chien"}.`,
      urgency: "suggested",
      ctaLabel: "Utiliser l'assistant",
      targetTab: "assistant",
    };
  }

  // Priority 1: Overdue core vaccines
  const vaccineMap = computeVaccineMap(recs);
  const overdueCore = Object.entries(vaccineMap)
    .filter(([_, v]) => v.ref.category === "core" && v.status === "overdue")
    .sort((a, b) => (a[1].daysUntilDue || 0) - (b[1].daysUntilDue || 0));

  if (overdueCore.length > 0) {
    const [key, v] = overdueCore[0];
    const daysLate = Math.abs(v.daysUntilDue);
    return {
      type: "vaccine_overdue",
      title: `Vaccin ${v.ref.shortName} en retard`,
      description: `Le rappel etait prevu il y a ${daysLate} jours. Mets a jour si c'est fait, ou prends rendez-vous.`,
      urgency: "critical",
      ctaLabel: "Mettre a jour",
      targetTab: "vaccine",
      targetKey: key,
    };
  }

  // Priority 2: Never-done core vaccines (puppy or missing data)
  const neverCore = Object.entries(vaccineMap)
    .filter(([_, v]) => v.ref.category === "core" && v.status === "never");
  if (neverCore.length > 0) {
    const [key, v] = neverCore[0];
    const ageMonths = dogAgeMonths(dog);
    const isPuppy = ageMonths !== null && ageMonths < 6;
    return {
      type: "vaccine_missing",
      title: isPuppy ? "Primo-vaccination a planifier" : `Vaccin ${v.ref.shortName} non enregistre`,
      description: isPuppy
        ? "Les chiots doivent recevoir leurs premiers vaccins entre 8 et 16 semaines."
        : `Si ${dog?.name || "ton chien"} a deja recu ce vaccin, enregistre-le ici.`,
      urgency: "important",
      ctaLabel: "Mettre a jour",
      targetTab: "vaccine",
      targetKey: key,
    };
  }

  // Priority 3: No vet visit in over 12 months
  const vetVisits = recs
    .filter(r => r.type === "vet_visit" && isValidDate(r.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (vetVisits.length > 0) {
    const months = monthsAgo(parseDate(vetVisits[0].date));
    if (months > 12) {
      return {
        type: "vet_visit_overdue",
        title: "Visite annuelle a prevoir",
        description: `La derniere visite date de ${months} mois. Un bilan annuel est recommande.`,
        urgency: "important",
        ctaLabel: "Trouver un veto",
        targetTab: "findvet",
      };
    }
  } else if (recs.length > 0) {
    // Has records but no vet visit ever
    return {
      type: "vet_visit_missing",
      title: "Aucune visite veterinaire enregistree",
      description: "Ajoute ta derniere visite pour un suivi complet.",
      urgency: "suggested",
      ctaLabel: "Ajouter une visite",
      targetTab: "vet_visit",
    };
  }

  // Priority 4: Due soon vaccines
  const dueSoon = Object.entries(vaccineMap)
    .filter(([_, v]) => v.status === "due_soon")
    .sort((a, b) => (a[1].daysUntilDue || 999) - (b[1].daysUntilDue || 999));
  if (dueSoon.length > 0) {
    const [key, v] = dueSoon[0];
    return {
      type: "vaccine_due_soon",
      title: `Vaccin ${v.ref.shortName} dans ${v.daysUntilDue}j`,
      description: `Pense a prendre rendez-vous pour le rappel de ${v.ref.name}.`,
      urgency: "suggested",
      ctaLabel: "Voir le vaccin",
      targetTab: "vaccine",
      targetKey: key,
    };
  }

  // Priority 5: Weight not tracked recently
  const weightTrend = computeWeightTrend(recs);
  if (weightTrend.current !== null) {
    const daysSince = daysBetween(parseDate(weightTrend.lastDate), t);
    if (daysSince > 60) {
      return {
        type: "weight_stale",
        title: "Poids a mettre a jour",
        description: `La derniere pesee date de ${Math.round(daysSince / 30)} mois. Pese ${dog?.name || "ton chien"} pour suivre sa courbe.`,
        urgency: "suggested",
        ctaLabel: "Enregistrer un poids",
        targetTab: "weight",
      };
    }
  }

  // Priority 6: Significant weight change
  if (weightTrend.direction === "up" && Math.abs(weightTrend.changePct) > 5) {
    return {
      type: "weight_alert",
      title: `Prise de poids : +${weightTrend.changeKg} kg`,
      description: `${dog?.name || "Ton chien"} a pris ${weightTrend.changePct}% en ${weightTrend.period} jours. Consulte ton veto si ca continue.`,
      urgency: "important",
      ctaLabel: "Voir la courbe",
      targetTab: "growth",
    };
  }
  if (weightTrend.direction === "down" && Math.abs(weightTrend.changePct) > 5) {
    return {
      type: "weight_alert",
      title: `Perte de poids : ${weightTrend.changeKg} kg`,
      description: `${dog?.name || "Ton chien"} a perdu ${Math.abs(weightTrend.changePct)}% en ${weightTrend.period} jours. A surveiller.`,
      urgency: "important",
      ctaLabel: "Voir la courbe",
      targetTab: "growth",
    };
  }

  // All good!
  return {
    type: "all_good",
    title: "Tout est a jour",
    description: `Le suivi de ${dog?.name || "ton chien"} est complet. Continue comme ca !`,
    urgency: "none",
    ctaLabel: null,
    targetTab: null,
  };
}

/**
 * Get dog age as a human-readable French string.
 */
export function getDogAgeLabel(dog) {
  const months = dogAgeMonths(dog);
  if (months === null) return null;
  if (months < 1) return "Moins d'1 mois";
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return years === 1 ? "1 an" : `${years} ans`;
  return years === 1 ? `1 an et ${rem} mois` : `${years} ans et ${rem} mois`;
}

/**
 * Compute a summary object for the "Carnet intelligent" view.
 * Single entry point that returns everything the UI needs.
 */
export function computeNotebookSummary(records, dog) {
  const recs = records || [];
  const score = computeHealthScore(recs, dog);
  return {
    score,
    scoreLevel: getScoreLevel(score),
    pills: computeStatusPills(recs, dog),
    nextAction: computeNextAction(recs, dog),
    vaccineMap: computeVaccineMap(recs),
    weightTrend: computeWeightTrend(recs),
    dogAge: getDogAgeLabel(dog),
    totalRecords: recs.length,
  };
}
