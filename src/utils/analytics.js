/**
 * PawCoach Analytics — localStorage-based event tracker.
 *
 * Temporary implementation: no third-party service.
 * Events are stored in localStorage (last 100) and logged via console.debug.
 * To inspect: getEvents() in the browser console.
 *
 * Will be replaced by a real analytics service when the time comes.
 */

const STORAGE_KEY = "pawcoach_analytics_events";
const CONSENT_KEY = "pawcoach_analytics_consent";
const MAX_EVENTS = 100;
const TTL_DAYS = 30;

/**
 * Store the user's analytics consent choice.
 * @param {boolean} granted - true = opt-in, false = opt-out (removes key)
 */
export function setAnalyticsConsent(granted) {
  try {
    if (granted) {
      localStorage.setItem(CONSENT_KEY, "true");
    } else {
      localStorage.removeItem(CONSENT_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

/**
 * Returns true only when the user has explicitly opted in.
 * @returns {boolean}
 */
export function hasAnalyticsConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Track a business-critical event.
 * @param {string} eventName  - e.g. "onboarding_complete"
 * @param {Object} properties - optional metadata
 */
export function trackEvent(eventName, properties = {}) {
  if (!hasAnalyticsConsent()) return;
  const event = {
    event: eventName,
    ts: new Date().toISOString(),
    ...properties,
  };

  console.debug("[Analytics]", eventName, properties);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;
    let events = raw ? JSON.parse(raw) : [];
    // Purge events older than TTL
    events = events.filter(e => {
      const ts = e.ts ? new Date(e.ts).getTime() : 0;
      return ts >= cutoff;
    });
    events.push(event);
    // Keep only the last MAX_EVENTS entries
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // localStorage unavailable — silent fail, never break the app
  }
}

/**
 * Retrieve all stored events (for debugging in the browser console).
 * @returns {Array}
 */
export function getEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;
    return JSON.parse(raw).filter(e => {
      const ts = e.ts ? new Date(e.ts).getTime() : 0;
      return ts >= cutoff;
    });
  } catch {
    return [];
  }
}
