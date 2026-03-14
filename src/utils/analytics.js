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
const MAX_EVENTS = 100;

/**
 * Track a business-critical event.
 * @param {string} eventName  - e.g. "onboarding_complete"
 * @param {Object} properties - optional metadata
 */
export function trackEvent(eventName, properties = {}) {
  const event = {
    event: eventName,
    ts: new Date().toISOString(),
    ...properties,
  };

  console.debug("[Analytics]", eventName, properties);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events = raw ? JSON.parse(raw) : [];
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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
