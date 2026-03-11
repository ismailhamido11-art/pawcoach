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

/** WSAVA 2024 vaccine reference for France
 * name = nom complet en francais (affiche a l'utilisateur)
 * shortName = abbreviation (espaces restreints)
 * abbrev = sigle veterinaire (pour info, entre parentheses si besoin)
 */
export const VACCINE_REFERENCE = {
  // Core vaccines (WSAVA essential)
  chp: {
    name: "Carre, Hepatite, Parvovirose",
    shortName: "Carre-Hepatite-Parvo",
    abbrev: "CHPPi / DHPP",
    category: "core",
    label: "Essentiel",
    frequencyMonths: 36, // every 3 years after primo-vaccination
    primoWeeks: [8, 12, 16], // primo-vaccination schedule
    boosterMonths: 12, // first booster at 12 months
    description: "Protege contre 3 maladies graves : la maladie de Carre, l'hépatite de Rubarth et la parvovirose. Aussi appele CHPPi ou DHPP sur le carnet de votre veto.",
    urgency: "Obligatoire pour tous les chiens.",
  },
  // Essential in France (promoted from optional by WSAVA for endemic zones)
  leptospirose: {
    name: "Leptospirose",
    shortName: "Leptospirose",
    abbrev: "Lepto",
    category: "core",
    label: "Essentiel (France)",
    frequencyMonths: 12,
    description: "Maladie bactérienne transmise par l'eau contaminée (urine de rats). Très répandue en France.",
    urgency: "Rappel annuel indispensable.",
  },
  rage: {
    name: "Rage",
    shortName: "Rage",
    abbrev: "Rage",
    category: "recommended",
    label: "Recommande",
    frequencyMonths: 12, // AMM France: annual for most vaccines
    description: "Obligatoire pour voyager en UE. Recommande meme sans voyage.",
    urgency: "Obligatoire si voyage ou pension.",
  },
  // Optional vaccines
  toux_chenil: {
    name: "Toux de chenil",
    shortName: "Toux de chenil",
    abbrev: "Bordetella",
    category: "optional",
    label: "Optionnel",
    frequencyMonths: 12,
    description: "Recommande si pension, garderie, ou contact frequent avec d'autres chiens.",
    urgency: "Selon mode de vie.",
  },
  piroplasmose: {
    name: "Piroplasmose (tiques)",
    shortName: "Piroplasmose",
    abbrev: "Piro",
    category: "optional",
    label: "Optionnel",
    frequencyMonths: 12,
    description: "Maladie transmise par les tiques. Recommande en zone a risque (campagne, foret).",
    urgency: "Selon region et exposition aux tiques.",
  },
  leishmaniose: {
    name: "Leishmaniose",
    shortName: "Leishmaniose",
    abbrev: "Leishma",
    category: "optional",
    label: "Optionnel",
    frequencyMonths: 12,
    description: "Transmise par les phlebotomes (petits moustiques). Surtout dans le sud de la France.",
    urgency: "Selon region (Sud / Mediterranee).",
  },
};

/** Vaccine aliases — maps user-entered titles to reference keys.
 * matchVaccineKey does lower.includes(alias), so "dhppi" matches "dhpp". */
const VACCINE_ALIASES = {
  // CHP / CHPPi / DHPP / DHPPI / DAPPi — all the same core vaccine
  chp: "chp", chppi: "chp", carre: "chp", hepatite: "chp", parvo: "chp", parvovirose: "chp",
  dhpp: "chp", dhlpp: "chp", rubarth: "chp", dappi: "chp", dapp: "chp",
  // Leptospirose
  lepto: "leptospirose", leptospirose: "leptospirose",
  // Rage
  rage: "rage", rabies: "rage", antirabique: "rage",
  // Toux de chenil
  toux: "toux_chenil", chenil: "toux_chenil", bordetella: "toux_chenil", "toux de chenil": "toux_chenil", kennel: "toux_chenil",
  // Piroplasmose
  piro: "piroplasmose", piroplasmose: "piroplasmose", babesiose: "piroplasmose", babesia: "piroplasmose", tique: "piroplasmose",
  // Leishmaniose
  leishma: "leishmaniose", leishmaniose: "leishmaniose", phlebotome: "leishmaniose",
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

export function isValidDate(d) {
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
export function dogAgeMonths(dog) {
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

/** Resolve any vaccine title (raw DB, abbreviation, alias) to the canonical user-friendly display name.
 *  Falls back to the original title if no match. */
export function getVaccineDisplayName(title) {
  if (!title) return "";
  const key = matchVaccineKey(title);
  if (key && VACCINE_REFERENCE[key]) return VACCINE_REFERENCE[key].name;
  return title; // fallback: return as-is
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
 *
 * @param {Array} records - HealthRecord[]
 * @param {Object} dog - dog object
 * @param {Array} extraWeightSources - optional additional weight sources (GrowthEntry[], DailyLog[])
 *   Each entry must have { weight_kg, date }. Deduplicated against HealthRecord by date (HealthRecord wins).
 */
export function computeHealthScore(records, dog, extraWeightSources = []) {
  const t = today();
  const recs = records || [];

  // Pre-merge extra weight sources (GrowthEntry, DailyLog) as pseudo-records
  const extraWeights = (extraWeightSources || [])
    .filter(s => s.weight_kg && s.date && isValidDate(s.date))
    .map(s => ({ type: "weight", value: s.weight_kg, date: s.date, id: s.id }));
  const hrDates = new Set(recs.filter(r => r.type === "weight").map(r => r.date));
  const deduped = extraWeights.filter(w => !hrDates.has(w.date));
  const enrichedRecs = [...recs, ...deduped];

  // --- Vaccine score (0-40) ---
  const vaccineMap = computeVaccineMap(enrichedRecs);
  const coreVaccines = Object.entries(vaccineMap).filter(([_, v]) => v.ref.category === "core");
  let vaccineScore = 0;
  if (coreVaccines.length > 0) {
    const statuses = coreVaccines.map(([_, v]) => v.status);
    const upToDate = statuses.filter(s => s === "up_to_date").length;
    const dueSoon = statuses.filter(s => s === "due_soon").length;
    const total = coreVaccines.length;
    vaccineScore = ((upToDate * 1 + dueSoon * 0.6) / total) * 40;
  }

  // --- Weight score (0-20) — uses enrichedRecs to include GrowthEntry + DailyLog weights ---
  const weightTrend = computeWeightTrend(enrichedRecs);
  let weightScore = 0;
  if (weightTrend.current !== null) {
    const lastWeightDate = parseDate(weightTrend.lastDate);
    const daysSinceLast = lastWeightDate ? daysBetween(lastWeightDate, t) : 999;
    if (daysSinceLast <= 30 && weightTrend.direction === "stable") weightScore = 20;
    else if (daysSinceLast <= 30) weightScore = 14;
    else if (daysSinceLast <= 90) weightScore = 10;
    else weightScore = 5;
  }

  // BCS bonus/malus from GrowthEntry.body_condition_score (WSAVA 1-9 scale)
  const bcsEntries = (extraWeightSources || [])
    .filter(s => s.body_condition_score && s.date && isValidDate(s.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (bcsEntries.length > 0) {
    const rawBcs = bcsEntries[0].body_condition_score;
    const latestBcs = Math.max(1, Math.min(9, Math.round(Number(rawBcs) || 5))); // Clamp to valid WSAVA 1-9 range
    const bcsDays = daysBetween(parseDate(bcsEntries[0].date), t);
    if (bcsDays <= 90) { // Only factor in recent BCS (last 3 months)
      if (latestBcs >= 4 && latestBcs <= 5) weightScore = Math.min(20, weightScore + 4); // Ideal BCS
      else if (latestBcs === 3 || latestBcs === 6) weightScore = Math.min(20, weightScore + 1); // Slightly off
      else weightScore = Math.max(0, weightScore - 3); // Under/overweight concern
    }
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

  // Bonus next_vet_appointment : un RDV programme dans les 30 jours montre une démarche proactive
  if (dog?.next_vet_appointment && isValidDate(dog.next_vet_appointment)) {
    const apptDate = parseDate(dog.next_vet_appointment);
    if (apptDate) {
      const daysUntil = daysBetween(t, apptDate); // positif si date future
      if (daysUntil >= 0 && daysUntil <= 30) {
        // RDV dans les 30j : +15 pts, plafonne a 25 (pas de double boost)
        vetScore = Math.min(25, vetScore + 15);
      }
    }
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
  if (score >= 40) return { label: "À améliorer", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", barColor: "#d97706" };
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
    pills.push({ id: "vet", label: "Vétérinaire", value: "Aucune visite", status: "empty" });
  } else {
    const lastVet = vetVisits[0];
    const months = monthsAgo(parseDate(lastVet.date));
    if (months <= 6) {
      pills.push({ id: "vet", label: "Vétérinaire", value: months === 0 ? "Ce mois-ci" : `il y a ${months} mois`, status: "good" });
    } else if (months <= 12) {
      pills.push({ id: "vet", label: "Vétérinaire", value: `il y a ${months} mois`, status: "warning" });
    } else {
      pills.push({ id: "vet", label: "Vétérinaire", value: `il y a ${months} mois`, status: "alert" });
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
      title: "Commence le carnet de santé",
      description: `Ajoute le premier vaccin ou la dernière pesée de ${dog?.name || "ton chien"}.`,
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
      title: `Vaccin en retard : ${v.ref.name}`,
      description: `Le rappel était prévu il y a ${daysLate} jours. Mets à jour si c'est fait, ou prends rendez-vous.`,
      urgency: "critical",
      ctaLabel: "Mettre à jour",
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
      title: isPuppy ? "Primo-vaccination à planifier" : `Vaccin non enregistre : ${v.ref.name}`,
      description: isPuppy
        ? "Les chiots doivent recevoir leurs premiers vaccins entre 8 et 16 semaines."
        : `Si ${dog?.name || "ton chien"} a déjà reçu ce vaccin, enregistre-le ici.`,
      urgency: "important",
      ctaLabel: "Mettre à jour",
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
        title: "Visite annuelle à prévoir",
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
      title: "Aucune visite vétérinaire enregistrée",
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
      title: `Vaccin à prévoir : ${v.ref.name}`,
      description: `Rappel dans ${v.daysUntilDue} jours. Pense à prendre rendez-vous chez ton véto.`,
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
        title: "Poids à mettre à jour",
        description: `La dernière pesée date de ${Math.round(daysSince / 30)} mois. Pèse ${dog?.name || "ton chien"} pour suivre sa courbe.`,
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
 * Get dog life-stage segment: "puppy" (<12m), "senior" (>84m), or "adult".
 */
export function getDogAgeSegment(dog) {
  if (!dog?.birth_date) return "adult";
  const months = dogAgeMonths(dog);
  if (months === null) return "adult";
  if (months < 12) return "puppy";
  if (months > 84) return "senior";
  return "adult";
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
